from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from django.http import JsonResponse
import json
import jwt
import logging
from .models import Tournament
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
import redis
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.views.decorators.csrf import csrf_exempt

redis_client = redis.StrictRedis(host='redis', port=6379, db=0)

logger = logging.getLogger(__name__)

@csrf_exempt
def CreateTournament(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    auth_header = request.headers.get('Authorization').split()[1]
    decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    # Extract user ID from the decoded token
    user_id = decoded.get('user_id')
    if not user_id:
        return JsonResponse({'detail': 'User not found', 'code': 'user_not_found'}, status=400)
    data = json.loads(request.body)
    tournament_size = data.get('size')
    if tournament_size not in [2, 4, 8]:
        return JsonResponse({'detail': 'invalid tournament size', 'code': 'error_occurred'}, status=400)
    tournament_name = data.get('name')
    if not tournament_name:
        return JsonResponse({'detail': 'no tournament name', 'code': 'error_occurred'}, status=400)
    if Tournament.objects.filter(tournament_name=tournament_name).exists():
        return JsonResponse({'detail': 'tournament name already in use', 'code': 'error_occurred'}, status=400)
    tournament = Tournament.objects.create(tournament_name=tournament_name)
    tournament.player_list.append(user_id)
    tournament.save()
    return JsonResponse({'tournament name': tournament.tournament_name}, status=201)


redis_client = redis.StrictRedis(host='redis', port=6379, db=0)

@csrf_exempt
def Invite(request):
    if request.method == 'POST':
        if request.method != 'POST':
            return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
        auth_header = request.headers.get('Authorization').split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
        data = json.loads(request.body)
        # Extract user ID from the decoded token
        user_id = decoded.get('user_id')
        user_id = 'debug'
        if not user_id:
            return JsonResponse({'detail': 'User not found', 'code': 'user_not_found'}, status=401)
        data = json.loads(request.body)
        group = data.get('friend_id')
        message = f'{decoded.get('nickname')} invited you to join tournament {data.get('tournament_name')}'
        sender = 'system'

        notification = {
            'type': 'notification_message',
            'group': f'user_{group}',
            'message': message,
            'sender': sender
        }

        # Publish the notification to Redis
        redis_client.publish('global_chat', json.dumps(notification))

        return JsonResponse({"detail": "Message sent"}, status=200)
    else:
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    # redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
    # if request.method != 'POST':
    #     return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    # auth_header = request.headers.get('Authorization').split()[1]
    # decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    # data = json.loads(request.body)
    # # Extract user ID from the decoded token
    # user_id = decoded.get('user_id')
    # user_id = 'debug'
    # if not user_id:
    #     return JsonResponse({'detail': 'User not found', 'code': 'user_not_found'}, status=401)
    # notification = {
    #     'type': 'notification_message',
    #     'group': f'user_{data.get('friend_id')}',
    #     'message': f'{decoded.get("nickname")} invited you to join the tournament {data.get('tournament_name')}',
    #     'sender': 'system'
    # }    

    #     # Get the channel layer
    # channel_layer = get_channel_layer()
    # async_to_sync(channel_layer.group_add)(
    #     "newgroup",  # Group name
    #     f'user_{data.get('friend_id')}'  # User-specific channel name
    # )
    
    # # Send the message to the group
    # async_to_sync(channel_layer.group_send)(
    #     f'user_{data.get('friend_id')}',  # Group name
    #     notification
    # )
    
    return JsonResponse({"detail": "Message sent"}, status=status.HTTP_200_OK)

@csrf_exempt
def JoinTournament(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    auth_header = request.headers.get('Authorization').split()[1]
    decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])

    # Extract user ID from the decoded token
    user_id = decoded.get('user_id')
    if not user_id:
        return JsonResponse({'detail': 'User not found', 'code': 'user_not_found'}, status=400)
    data = json.loads(request.body)
    tournament_name = data.get('name')
    tournament = Tournament.objects.get(tournament_name=tournament_name)
    # Add a player to the list
    tournament.player_list.append(user_id)  # Add player ID 1
    tournament.save()
    return JsonResponse({'tournament name': tournament.tournament_name}, status=200)

# from rest_framework.views import APIView
# from rest_framework.decorators import permission_classes, api_view
# from django.http import HttpResponse, JsonResponse
# import json
# import jwt
# import logging
# from .models import Tournament
# from rest_framework.permissions import IsAuthenticated, AllowAny
# from rest_framework.response import Response
# from rest_framework import status
# from django.conf import settings
# import redis
# from channels.layers import get_channel_layer
# from asgiref.sync import async_to_sync
# from django.views.decorators.csrf import csrf_exempt

# redis_client = redis.StrictRedis(host='redis', port=6379, db=0)

# logger = logging.getLogger(__name__)
# authentication_classes = []
# permission_classes = []
    
# # class JoinTournament(APIView):
    
# def JoinTournament(request):
#     auth_header = request.headers.get('Authorization').split()[1]
#     decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])

#     # Extract user ID from the decoded token
#     user_id = decoded.get('user_id')
#     if not user_id:
#         return JsonResponse({'detail': 'User not found', 'code': 'user_not_found'}, status=400)
#     data = json.loads(request.body)
#     tournament_name = data.get('name')
#     tournament = Tournament.objects.get(tournament_name)
#     # Add a player to the list
#     tournament.player_list.append(user_id)  # Add player ID 1
#     tournament.save()
#     return JsonResponse({'tournament name':tournament.tournament_name}, status = 200)

# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# @csrf_exempt
# def CreateTournament(request):
#     logger.error("test")
#     auth_header = request.headers.get('Authorization').split()[1]
#     decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
#     # Extract user ID from the decoded token
#     user_id = decoded.get('user_id')
#     if not user_id:
#         return JsonResponse({'detail': 'User not found', 'code': 'user_not_found'}, status=400)
#     data = json.loads(request.body)
#     tournament_size = data.get('size')
#     if tournament_size not in [2, 4, 8]:
#         return JsonResponse({'detail': 'invalid tournament size', 'code': 'error_occurred'}, status=400)
#     tournament_name = data.get('name')
#     if not tournament_name:
#         return JsonResponse({'detail': 'no tournament name', 'code': 'error_occurred'}, status=400)
#     if Tournament.objects.filter(tournament_name = tournament_name):
#         return JsonResponse({'detail': 'tournament name already in use', 'code': 'error_occurred'}, status=400)
#     tournament = Tournament.objects.create(tournament_name = tournament_name)
#     tournament.player_list.append(user_id)
#     tournament.save()
#     return JsonResponse({'tournament name':tournament.tournament_name}, status = 201)

# @api_view(['GET'])    
# @permission_classes([IsAuthenticated])
# @csrf_exempt
# def Invite(request, friend_id, tournament_name):
#     auth_header = request.headers.get('Authorization').split()[1]
#     decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])

#     # Extract user ID from the decoded token
#     user_id = decoded.get('user_id')
#     if not user_id:
#         return JsonResponse({'detail': 'User not found', 'code': 'user_not_found'}, status=400)
#     notification = {
#         'type': 'notification_message',
#         'group': f'user_{friend_id}',
#         'message': f'{decoded.get('nickname')} invited you to join the tournament {tournament_name}',
#         'sender': 'system'
#     }
#     channel_layer = get_channel_layer()
#     async_to_sync(channel_layer.group_send)(
#         f'user_{friend_id}',  # Group name
#         notification
#     )
#     return Response({"detail": "Message sent"}, status=status.HTTP_200_OK)
    
    