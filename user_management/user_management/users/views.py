# Create your views here.
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, UsernameSerializer
import json
import logging
from django.contrib.auth import get_user_model, authenticate
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from .utils import is_user_online, get_user_totp_device, generate_qr_code, Token2FAAccessSignatureError, Token2FAExpiredError, validate_2FA_accesstoken, generate_2FA_accesstoken
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from .models import add_stat
from urllib.parse import urlencode
import base64
from rest_framework.views import APIView
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from .mock_jwt_expired  import mock_jwt_expired
import jwt







User = get_user_model()
logger = logging.getLogger(__name__)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



@api_view(['POST'])
@permission_classes([AllowAny])
def get_jwt_token(request):
    logger.error("hello")
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)

    try:
        user = User.objects.get(username=body['username'])
    except User.DoesNotExist:
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)

    user = User.objects.get(username=body['username'])
    if user.account_deleted:
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
    # Check if the password matches the one stored in the database
    password = body.get('password')
    if not password:
        return Response({'error': 'Password is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=body['username'], password=password)
    if user is None:
        return Response({'error': 'Invalid username or password'}, status=status.HTTP_401_UNAUTHORIZED)
    logger.error("here")

    # # If 2FA is enabled, proceed with the two-factor authentication process
    if user.twofa_enabled:
        return Response({'2FA': '2FA token required', 'token': f"{generate_2FA_accesstoken(user.id, "secret")}"}, status=status.HTTP_401_UNAUTHORIZED)

    # 2FA not enabled: directly generate tokens
    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    access_token = refresh.access_token
    access_token['username'] = user.username
    access_token['nickname'] = user.nickname
    access_token['twofa'] = user.twofa_enabled

    access = str(access_token)

    return Response({
        'refresh': str(refresh),
        'access': access
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_jwt_token(request):
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)

    try:
        refresh = RefreshToken(body['refresh'])
        user = User.objects.get(id=refresh['user_id'])
    except RefreshToken.DoesNotExist:
        return Response({'error': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)

    refresh = RefreshToken.for_user(user)
    access = str(refresh.access_token)
    access_token = refresh.access_token
    access_token['username'] = user.username
    access_token['nickname'] = user.nickname
    access = str(access_token)

    return Response({
        'access': access
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def Get_my_infos(request):
    # Use the authenticated user from request.user
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def Get_user_stats(request, user_id):
    # Use the authenticated user from request.user
    user = get_object_or_404(User, id=user_id)
    return Response(user.stats , status=200)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def Add_user_stats(request, user_id):
    logger.error(f"adduserstats - Request body: {request.body}")
    # Use the authenticated user from request.user
    user = get_object_or_404(User, id=user_id)
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    logger.error(body)
    if not body.get('tournament_id') or not body.get('date') or not body.get('opponent') or not body.get('score') or not body.get('win'):
        logger.error("Missing required fields")
        return Response({'Error':'Missing required fields'}, status=400)
    try :
        add_stat(user,body['tournament_id'], body['date'], body['opponent'], body['score'], body['win'])
    except ValueError as e:
        return Response({"error":str(e)}, status=500)
    return Response(user.stats , status=201)

@api_view(['GET'])
@permission_classes([AllowAny])
def Get_user_infos(request, user_id):
    logger.error(user_id)
    if user_id == 0:
        user_info = {
        "id": 0,
        "username": "system",
        "nickname": "system",
        "2fa": "false",
        }
        logger.error(user_info)
        return JsonResponse(user_info)
    user = get_object_or_404(User, id=user_id)
    user_info = {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "deleted": user.account_deleted
    }
    return JsonResponse(user_info)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def Get_user_id(request):
    if not request.body:
        logger.error("Missing body")
        return Response({"error":'Missing username'}, status=400)

    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    if 'username' not in body:
        logger.error("Missing username")
        return Response({"error": 'Missing username'}, status=400)

    username = body['username']
    logger.error(username)
    if username == 'system':
        user_info = {
        "id": 0,
        "username": "system",
        "nickname": "system",
        "2fa": "false",
        }
        logger.error(user_info)
        return JsonResponse(user_info)
    user = get_object_or_404(User, username=username)
    user_info = {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "2fa": user.twofa_enabled,
    }
    return JsonResponse(user_info)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def Enable_Twofa(request):
    user = request.user
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    try:
        token = body.get('twofa')
        if not token:
            return Response({'error': '2FA token missing'}, status=status.HTTP_400_BAD_REQUEST)

        device = get_user_totp_device(user)
        if device and device.verify_token(token):
            if not device.confirmed:
                device.confirmed = True
                device.save()

            user.twofa_enabled = True
            user.save()
            return Response({"success":'2fa enabled'}, status=200)
        return Response({'error': 'Invalid 2FA code'}, status=status.HTTP_400_BAD_REQUEST)
    except json.JSONDecodeError:
        return Response({'error': 'Invalid request body'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ChangeLogin(request):
    user = request.user
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    # Update username
    serializer = UsernameSerializer(data=request.data)
    if serializer.is_valid():
        user.username = body['username']
        user.save()
        # Return updated user info
        serializer = UserSerializer(user)
        return Response(serializer.data, status=200)
    return Response({"error":serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ChangeNickname(request):
    user = request.user
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    # Update nickname
    if body['nickname']:
        user.nickname = body['nickname']
        user.save()
        # Return updated user info
        serializer = UserSerializer(user)
        return Response(serializer.data, status=200)
    return Response({"error":serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

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
            'django-insecure-dquen$ta141%61x(1^cf&73(&h+$76*@wbudpia^^ecijswi=q',
            algorithms=['HS256']
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise ValidationError("Token has expired")
    except jwt.InvalidTokenError:
        raise ValidationError("Invalid token")



class UserDeleteView(APIView):
    def delete(self, request):
        try:
            logger.info("User delete request received.")
            token_payload = validate_jwt_token(request)
            user_id = token_payload.get('user_id')
            if not user_id:
                logger.warning("No user_id found in token.")
                return Response(
                    {"error": "No user_id found in token"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            user = User.objects.get(id=user_id)
            logger.info(f"deleting account for id {user_id}")
            user.account_deleted = True
            user.username = f"DELETED_{user_id}"
            user.nickname = "ACCOUNT DELETED"
            user.password = ""
            user.stats = {}
            user.save()
            return Response({"deleted":user_id}, status=200)


        except User.DoesNotExist:
            return Response(
                    {"error": "No user found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        except ObjectDoesNotExist:
             return Response(
                    {"error": "No user found"},
                    status=status.HTTP_404_NOT_FOUND)
        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            return Response(mock_jwt_expired(), status=status.HTTP_401_UNAUTHORIZED)

        except Exception as e:
            logger.exception("Unexpected error during avatar deletion.")
            return Response(
                {"error":f"error {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )




@api_view(['POST'])
@permission_classes([AllowAny])
def RegisterUser(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        logger.error('hello')
        user = serializer.save()
        user.nickname = user.username
        user.set_password(serializer.validated_data['password'])
        user.save()
        return Response(serializer.data, status=201)
    return Response({"error":serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ChangePassword(request):
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    user = request.user
    username = user.username
    # Check if the password matches the one stored in the database
    oldpassword = body.get('oldpassword')
    newpassword = body.get('newpassword')
    if not oldpassword:
        return Response({'error': 'old Password is required'}, status=status.HTTP_400_BAD_REQUEST)
    if not newpassword:
        return Response({'error': 'new Password is required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=oldpassword)
    if user is None:
        return Response({'error': 'Invalid old password'}, status=status.HTTP_401_UNAUTHORIZED)
    user.set_password(newpassword)
    user.save()
    return Response({"success": "Password changed successfully"}, status=200)

@csrf_exempt
@permission_classes([AllowAny])
@api_view(['GET'])
def CheckUserStatus(request, user_id):
    online = is_user_online(user_id)
    return JsonResponse({"user_id": user_id, "online": online})

@permission_classes([IsAuthenticated])
@api_view(['GET'])
def GetAllUsers(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return JsonResponse(serializer.data, safe=False)

class TOTPCreateView(views.APIView):
    """
    Use this endpoint to set up a new TOTP device
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, format=None):
        user = request.user
        # Check if the user already has a TOTP device
        device = get_user_totp_device(user)
        if not device:
            device = user.totpdevice_set.create(confirmed=False)

        # Extract the secret and encode it in Base32
        raw_secret = device.key  # Assuming `key` is the raw secret (binary or hex)
        if not isinstance(raw_secret, bytes):
            raw_secret = bytes.fromhex(raw_secret)  # Convert hex to bytes if necessary
        base32_secret = base64.b32encode(raw_secret).decode('utf-8').strip('=')  # Base32 without padding

        # Construct the TOTP URL
        issuer = "transcendence"  # Your app's name
        account_name = user.username  # Or another user identifier (e.g., email)
        label = f"{issuer}:{account_name}"
        params = {
            "secret": base32_secret,
            "issuer": issuer,
            "algorithm": "SHA1",  # Most TOTP apps default to SHA1
            "digits": 6,
            "period": 30,
        }
        totp_url = f"otpauth://totp/{label}?{urlencode(params)}"
        return generate_qr_code(totp_url)


