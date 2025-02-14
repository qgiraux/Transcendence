import json
import jwt
import logging
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from .models import Blocks
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from .mock_jwt_expired  import mock_jwt_expired

logger = logging.getLogger(__name__)


def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE')})

@csrf_exempt
@permission_classes([IsAuthenticated])
def add_block(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed', 'code': 'method_not_allowed'}, status=405)
    try:
        # Extract JSON data from request body
        data = json.loads(request.body)

        # Extract and decode the JWT token
        auth_header = request.headers.get('Authorization').split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])

        # Extract user ID from the decoded token
        user_id = decoded.get('user_id')
        if not user_id:
            return JsonResponse({'detail': 'User not found', 'code': 'user_not_found'}, status=400)

        # Extract block ID from the request data
        block_id = data.get('id')
        if not block_id:
            return JsonResponse({'detail': 'Block ID is required', 'code': 'block_id_required'}, status=400)
        if block_id == user_id:
            return JsonResponse({'message': 'user already cannot block himself', 'code': 'conflict'}, status=409)
        if Blocks.objects.filter(user_id=user_id, block_id=block_id).exists():
            return JsonResponse({'message': 'user already in block list', 'code': 'conflict'}, status=409)

        # Create a new block relationship
        new = Blocks()
        new.block_id = block_id
        new.user_id = user_id
        new.save()

        # Prepare response body
        body = json.dumps({'message': 'Block added successfully'})
        return JsonResponse({'message': 'Block added successfully'}, status=200)

    except ExpiredSignatureError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    except InvalidTokenError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return JsonResponse({'detail': 'An error occurred', 'code': 'error_occurred'}, status=500)

@csrf_exempt
@permission_classes([IsAuthenticated])
def remove_block(request):
    if request.method != 'DELETE':
        return JsonResponse({'detail': 'Method not allowed', 'code': 'method_not_allowed'}, status=405)
    try:
        data = json.loads(request.body)

        auth_header = request.headers.get('Authorization').split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])

        user_id = decoded.get('user_id')
        if not user_id:
            return HttpResponse(
                json.dumps({'detail': 'User not found', 'code': 'user_not_found'}),
                status=400,
                content_type='application/json'
            )

        block_id = data.get('id')
        if not block_id:
            return JsonResponse({'detail': 'Block ID is required', 'code': 'block_id_required'}, status=400)

        block_ids = list(Blocks.objects.filter(user_id=user_id, block_id=block_id).values_list('block_id', flat=True))
        if len(block_ids) == 0:
            return JsonResponse({'error': 'user not in block list', 'code': 'not found'}, status=404)

        deleted, _ = Blocks.objects.filter(user_id=user_id, block_id=block_id).delete()
        if deleted:
            return JsonResponse({'message': 'Block removed successfully'}, status=200)
        else:
            return JsonResponse({'error': 'Block not found'}, status=404)

    except jwt.ExpiredSignatureError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return HttpResponse(
            json.dumps({'detail': 'An error occurred', 'code': 'error_occurred'}),
            status=500,
            content_type='application/json'
        )


@csrf_exempt
@permission_classes([IsAuthenticated])
def blocks_list(request):
    if request.method != 'GET':
        return HttpResponse(
            json.dumps({'detail': 'Method not allowed', 'code': 'method_not_allowed'}),
            status=405,
            content_type='application/json'
        )
    try :
        logger = logging.getLogger(__name__)
        auth_header = request.headers.get('Authorization').split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded['user_id']
        user_id = decoded.get('user_id')
        if not user_id:
            return JsonResponse({'detail': 'User ID not found in token', 'code': 'user_id_not_found'}, status=400)
        block_ids = list(Blocks.objects.filter(user_id=user_id).values_list('block_id', flat=True))
        return HttpResponse(json.dumps({"blocks": block_ids}), status=200, content_type='application/json')
    except jwt.ExpiredSignatureError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return HttpResponse(
            json.dumps({'detail': 'An error occurred', 'code': 'error_occurred'}),
            status=500,
            content_type='application/json'
        )

@csrf_exempt
@permission_classes([IsAuthenticated])
def remove_from_all(request):
    if request.method != 'DELETE':
        return HttpResponse(
            json.dumps({'detail': 'Method not allowed', 'code': 'method_not_allowed'}),
            status=405,
            content_type='application/json'
        )
    try:
        auth_header = request.headers.get('Authorization').split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded.get('user_id')
        if not user_id:
            return HttpResponse(
                json.dumps({'detail': 'User not found', 'code': 'user_not_found'}),
                status=400,
                content_type='application/json'
            )
        Blocks.objects.filter(block_id=user_id).delete()
        return JsonResponse({'message': 'User removed successfully form all blocklists'}, status=200)


    except jwt.ExpiredSignatureError:
        return JsonResponse(mock_jwt_expired(), status=status.HTTP_401_UNAUTHORIZED)
    except jwt.InvalidTokenError:
        return JsonResponse(mock_jwt_expired(), status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return HttpResponse(
            json.dumps({'detail': 'An error occurred', 'code': 'error_occurred'}),
            status=500,
            content_type='application/json'
        )
