import json
import jwt
import logging
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError
from .models import Friends
from django.conf import settings
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .mock_jwt_expired  import mock_jwt_expired

def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE')})

@csrf_exempt
@permission_classes([IsAuthenticated])
def add_friend(request):
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

        # Extract friend ID from the request data
        friend_id = data.get('id')
        if not friend_id:
            return JsonResponse({'detail': 'Friend ID is required', 'code': 'friend_id_required'}, status=400)
        if Friends.objects.filter(user_id=user_id, friend_id=friend_id).exists():
            return JsonResponse({'message': 'user already in friend list', 'code': 'conflict'}, status=409)

        # Create a new friend relationship
        new = Friends()
        new.friend_id = friend_id
        new.user_id = user_id
        new.save()

        # Prepare response body
        body = json.dumps({'message': 'Friend added successfully'})
        return JsonResponse({'message': 'Friend added successfully'}, status=200)

    except ExpiredSignatureError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    except InvalidTokenError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        # logger.error(f"Unexpected error: {e}")
        return JsonResponse({'detail': f"An error occurred {e} ", 'code': 'error_occurred'}, status=500)

@csrf_exempt
@permission_classes([IsAuthenticated])
def remove_friend(request):
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

        friend_id = data.get('id')
        if not friend_id:
            return JsonResponse({'detail': 'Friend ID is required', 'code': 'friend_id_required'}, status=400)

        friend_ids = list(Friends.objects.filter(user_id=user_id, friend_id=friend_id).values_list('friend_id', flat=True))
        if len(friend_ids) == 0:
            return JsonResponse({'error': 'user not in friend list', 'code': 'not found'}, status=404)

        deleted, _ = Friends.objects.filter(user_id=user_id, friend_id=friend_id).delete()
        if deleted:
            return JsonResponse({'message': 'Friend removed successfully'}, status=200)
        else:
            return JsonResponse({'error': 'Friend not found'}, status=404)

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


@csrf_exempt
@permission_classes([IsAuthenticated])
@csrf_exempt
def friends_list(request):
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
        friend_ids = list(Friends.objects.filter(user_id=user_id).values_list('friend_id', flat=True))
        return HttpResponse(json.dumps({"friends": friend_ids}), status=200, content_type='application/json')
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
