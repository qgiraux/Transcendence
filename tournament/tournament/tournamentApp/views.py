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

@csrf_exempt
def Invite(request):
    try:
        if request.method != 'POST':
            return JsonResponse({"detail": "Method not allowed"}, status=405)
        auth_header = request.headers.get('Authorization').split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
        data = json.loads(request.body)
        # Extract user ID from the decoded token
        user_id = decoded.get('user_id')
        user_id = 'debug'
        t_name = data.get('tournament_name')
        
        if not Tournament.objects.filter(tournament_name=t_name).exists():
            return JsonResponse({"detail": "tournament not found", 'code':'not_found'}, status=404)
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
    except Exception as e:
            logger.error(f"Error sending notif: {e}")
            return JsonResponse({"detail": e}, status=500)
    # Publish the notification to Redis
    try:
        redis_client.publish('global_chat', json.dumps(notification))
    except Exception as e:
            logger.error(f"Error sending notif: {e}")
            return JsonResponse({"detail": e}, status=500)

    return JsonResponse({"detail": "Message sent"}, status=200)

@csrf_exempt
def JoinTournament(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    auth_header = request.headers.get('Authorization').split()[1]
    decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])

    # Extract user ID from the decoded token
    user_id = decoded.get('user_id')
    if not user_id:
        return JsonResponse({'detail': 'User not found', 'code': 'not_found'}, status=404)
    data = json.loads(request.body)
    tournament_name = data.get('name')
    tournament = Tournament.objects.get(tournament_name=tournament_name)
    # Add a player to the list
    if user_id in tournament.player_list:
        return JsonResponse({'detail': 'User already subscribed', 'code': 'bad_request'}, status=400)
        
    tournament.player_list.append(user_id)  # Add player ID 1
    tournament.save()
    return JsonResponse({'tournament name': tournament.tournament_name}, status=200)
    
    