from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.http import HttpResponse
from django.http import JsonResponse
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import  AvatarListSerializer
from rest_framework import status
from .models import Avatar
from rest_framework.views import APIView
import logging
import uuid
import jwt
import os, io
from PIL import Image, UnidentifiedImageError
from .mock_jwt_expired  import mock_jwt_expired

MAX_SIZE = 5 # the maximum accepted image size in MB
logger = logging.getLogger(__name__)


class ImageValidationError(ValueError):
    """Base class for image validation errors."""
    pass

class ImageTooLargeError(ImageValidationError):
    """Raised when the image file is too large."""
    pass

class UnsupportedFormatError(ImageValidationError):
    """Raised when the image format is unsupported."""
    pass

class ImageTooLargeDimensionsError(ImageValidationError):
    """Raised when the image exceeds maximum allowed dimensions."""
    pass

def validate_jwt_token(request):
    """
    Custom JWT token validation method.

    Args:
        request (Request): Incoming HTTP request

    Returns:
        dict: Decoded token payload if valid
    Raises:
        ValidationError: If token is invalid
    """
    auth_header = request.META.get('HTTP_AUTHORIZATION', '')

    if not auth_header.startswith('Bearer '):
        raise ValidationError("Invalid Authorization header format")

    token = auth_header.split(' ')[1]

    try:
        payload = jwt.decode(
            token,
            os.getenv('TRANSCENDENCE_SECRET_KEY'),
            algorithms=['HS256']
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise ValidationError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValidationError("Invalid token")




def validate_image(file_obj, allowed_formats=None, max_size=None):
    """
     image validation
    Args:
        file_obj: File-like object containing the image
        allowed_formats (list, optional): List of allowed image formats
        max_size int : Maximum size in MB allowed
        raise execeptions if the image is not validated
    Returns: None
    """
    file_obj.seek(0)
    if hasattr(file_obj, 'size'):
        if file_obj.size > MAX_SIZE * (1024 * 1024):
            raise ImageTooLargeError(f"Image file is too large")
    file_obj.seek(0)
    with Image.open(file_obj) as img:
        detected_format = img.format.upper() if img.format else None
        if allowed_formats:
            allowed_formats = [fmt.upper() for fmt in allowed_formats]
            if detected_format not in allowed_formats:
                raise UnsupportedFormatError(f"Unsupported format. Allowed: {allowed_formats}")
        if max_size:
            max_width, max_height = max_size
            if img.width > max_width or img.height > max_height:
                raise ImageTooLargeDimensionsError(f"Image exceeds maximum dimensions of {max_size}")


def convert_image(file_obj):
    """
    Convert and resize image to JPEG with enhanced error handling

    Args:
        file_obj: File-like object containing the image
    Returns:
        InMemoryUploadedFile: Django-compatible uploaded file object
    """
    # Reset file pointer to beginning
    file_obj.seek(0)

    try:
        with Image.open(file_obj) as img:
            # Calculate the scale and crop to ensure image fills 400x400
            # Determine the scaling ratio to match the smaller dimension
            width, height = img.size
            scale_width = 400 / width
            scale_height = 400 / height
            scale = max(scale_width, scale_height)

            # Resize image
            new_width = int(width * scale)
            new_height = int(height * scale)
            resized_img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            # Crop to exactly 400x400
            left = (new_width - 400) / 2
            top = (new_height - 400) / 2
            right = left + 400
            bottom = top + 400

            cropped_img = resized_img.crop((left, top, right, bottom))

            # Handle transparency if needed
            if cropped_img.mode in ('RGBA', 'LA'):
                with Image.open("helpers_images/cyberpunk_backdrop.jpg") as background:
                    background.paste(cropped_img, mask=cropped_img.split()[-1])
                    cropped_img = background

            # Ensure RGB mode
            if cropped_img.mode != 'RGB':
                cropped_img = cropped_img.convert('RGB')

            # Save to buffer
            buffer = io.BytesIO()
            cropped_img.save(buffer, format='JPEG', quality=85)
            buffer.seek(0)

            return InMemoryUploadedFile(
                file=buffer,           # file
                field_name='image',    # field name in the model
                name=f'avatar.jpg',    # filename
                content_type='image/jpeg',  # MIME type
                size=buffer.getbuffer().nbytes,  # file size
                charset=None           # charset (not applicable for images)
            )
    except Exception as e:
        raise RuntimeError(f"Image conversion failed: {str(e)}")


def very_unique_uuid(new_uuid, avatar_list, max_recursion):
    if max_recursion <= 0:
        raise RuntimeError('very_unique_uuid: max depth recursion')
    for avatar in avatar_list:
        if avatar.uuid == new_uuid:
            max_recursion -= 1
            return very_unique_uuid(uuid.uuid4())
    return new_uuid

class AvatarUploadView(APIView):
    def post(self, request):
        """
        Handle avatar upload with JWT authentication
        """
        logger.info("[Avatar.views] Avatar upload request received.")
        try:
            token_payload = validate_jwt_token(request)
            user_id = token_payload.get('user_id')
            if not user_id:
                logger.warning("[Avatar.views] No user_id found in token.")
                return Response(
                    {"error": "No user_id found in token"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            logger.info(f"[Avatar.views] Token validated for user_id: {user_id}.")

            image = request.FILES.get('image')
            if not image:
                logger.warning("[Avatar.views] No image provided in the request.")
                return Response(
                    {"error": "Invalid image provided"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            validate_image(image, allowed_formats=['JPEG', 'PNG'], max_size=(1200, 1200))
            logger.info("[Avatar.views] Image validation successful.")
        except ValidationError as e:
            logger.error(f"[Avatar.views] Validation error: {e}")
            return Response(mock_jwt_expired(), status=status.HTTP_401_UNAUTHORIZED)
        except UnsupportedFormatError as e:
            logger.error(f"[Avatar.views] Unsupported format error: {e}")
            return Response(
                {"error":{"error":f"{e}"}},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
            )
        except UnidentifiedImageError:
            return Response(
                {"error":{"error":f"Unsupported format. Allowed: JPEG', 'PNG'"}},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
            )
        except ImageTooLargeError as e:
            logger.error(f"[Avatar.views] Image too large error: {e}")
            return Response(
                {"error":f"{e}"},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )
        except ImageTooLargeDimensionsError as e:
            logger.error(f"[Avatar.views] Image dimension error: {e}")
            return Response(
                {"error":f"{e}"},
                status=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE
            )
        except Exception as e:
            logger.exception(f"[Avatar.views] Unexpected error during image validation. {e}")
            return Response(
                {"error":f"{e}"},
                status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE
            )

        try:
            avatar = Avatar.objects.get(Userid=user_id)
            logger.info(f"[Avatar.views] Existing avatar found for user_id: {user_id}. Updating it.")
            old_img_path = f"images/{avatar.uuid}.jpg"
            if os.path.exists(old_img_path):
                os.remove(old_img_path)
                logger.info(f"[Avatar.views] Old avatar image deleted: {old_img_path}.")
            avatar.image = convert_image(file_obj=image)
            avatar.uuid = very_unique_uuid(
                uuid.uuid4(),
                avatar_list=Avatar.objects.all().iterator(),
                max_recursion=10
            )
            avatar.save()
            logger.info(f"[Avatar.views] Avatar updated successfully for user_id: {user_id}.")
            return Response(
                {"message": f"Image updated successfully", "uuid": avatar.uuid}
            )
        except Avatar.DoesNotExist:
            logger.info(f"[Avatar.views] No existing avatar found for user_id: {user_id}. Creating a new one.")
            avatar = Avatar.objects.create(
                Userid=user_id,
                image=convert_image(file_obj=image)
            )
            avatar.save()
            logger.info(f"[Avatar.views] Avatar created successfully for user_id: {user_id}.")
            return Response(
                {"message": "Image uploaded successfully", "uuid": avatar.uuid},
                status=201
            )
        except Exception as e:
            logger.exception("[Avatar.views] Unexpected error during avatar save operation.")
            return Response(
                {"error":f"{e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


@api_view(['GET'])
def get_image(request, img_id):
    try:
        logger.info(f"[Avatar.views] Fetching image with uuid: {img_id}.")
        avatar = Avatar.objects.get(uuid=img_id)
        with open(avatar.image.path, 'rb') as image_file:
            response = HttpResponse(image_file.read(), content_type='image/jpeg')
            response['Cache-Control'] = 'max-age=3600'
            logger.info(f"[Avatar.views] Image successfully returned for uuid: {img_id}.")
            return response
    except Avatar.DoesNotExist:
        logger.warning(f"[Avatar.views] Avatar with uuid {img_id} does not exist. Returning fallback image.")
        with open('helpers_images/avatar_default.jpg', 'rb') as image_file:
            response = HttpResponse(image_file.read(), content_type='image/jpeg')
            response['Cache-Control'] = 'max-age=10800'
            return response
    except FileNotFoundError as e:
        logger.error(f"[Avatar.views] File not found for uuid {img_id}: {e}")
        with open('helpers_images/avatar_default.jpg', 'rb') as image_file:
            response = HttpResponse(image_file.read(), content_type='image/jpeg')
            response['Cache-Control'] = 'max-age=10800'
            return response


@api_view(['GET'])
def get_default(request):
    logger.info("[Avatar.views] Returning default avatar image.")
    with open('helpers_images/avatar_default.jpg', 'rb') as image_file:
        response = HttpResponse(image_file.read(), content_type='image/jpeg')
        response['Cache-Control'] = 'max-age=10800'
        return response

class AvatarListView(APIView):
    def get(self, request):
        """
        Return user list with corresponding uuid
        """
        try:
            validate_jwt_token(request)
            users = Avatar.objects.all()
            serializer = AvatarListSerializer(users, many=True)
            return JsonResponse(serializer.data, safe=False)
        except ValidationError as e:
            logger.error(f"[Avatar.views] Validation error: {e}")
            return Response(mock_jwt_expired(), status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response(
                {"error": "Unexpected error occurred"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




class AvatarDeleteView(APIView):
    def delete(self, request):
        try:
            logger.info("[Avatar.views] Avatar delete request received.")
            token_payload = validate_jwt_token(request)
            user_id = token_payload.get('user_id')
            if not user_id:
                logger.warning("[Avatar.views] No user_id found in token.")
                return Response(
                    {"error": "No user_id found in token"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            avatar = Avatar.objects.get(Userid=user_id)
            old_img_path = f"images/{avatar.uuid}.jpg"
            if os.path.exists(old_img_path):
                os.remove(old_img_path)
                logger.info(f"[Avatar.views] Deleted avatar image file: {old_img_path}.")
            avatar.delete()
            logger.info(f"[Avatar.views] Avatar successfully deleted for user_id: {user_id}.")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            logger.error(f"[Avatar.views] Validation error: {e}")
            return Response(mock_jwt_expired(), status=status.HTTP_401_UNAUTHORIZED)
        except Avatar.DoesNotExist:
            logger.warning(f"[Avatar.views] No avatar found for user_id: {user_id}.")
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            logger.exception("[Avatar.views] Unexpected error during avatar deletion.")
            return Response(
                {"error":f"error {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
