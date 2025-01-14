
import json
import jwt
import logging
import redis
from .models import Tournament
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist
from .tournament import Tournament_operation
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from jwt.exceptions import InvalidTokenError
import re
from .tournament import Tournament_operation
from .mock_jwt_expired  import mock_jwt_expired


redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
logger = logging.getLogger(__name__)

@csrf_exempt
@permission_classes([IsAuthenticated])
def CreateTournament(request):
    if request.method != 'POST':
            return JsonResponse({"detail": "Method not allowed"}, status=405)

    # Authorization and payload decoding
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return JsonResponse({'detail': 'Authorization header missing'}, status=401)

    try:
        auth_token = auth_header.split()[1]
        decoded = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded.get('user_id')
        if not user_id:
            raise ValueError("User ID missing in token")
    except Exception as e:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)

    data = json.loads(request.body)
    if not data.get('name') or not data.get('size'):
        return JsonResponse({'detail': 'incomplete body', 'code': 'incomplete_body'}, status=400)
    tournament_size = int(data.get('size'))
    if tournament_size not in [2, 4, 8]:
        return JsonResponse({'detail': 'invalid tournament size', 'code': 'error_occurred', 'size':tournament_size}, status=400)
    tournament_name = data.get('name').strip()
    if not tournament_name:
        return JsonResponse({'detail': 'no tournament name', 'code': 'error_occurred'}, status=400)
    if not tournament_name or not re.match(r'^[a-zA-Z0-9]{5,16}$', tournament_name):
        return JsonResponse({'detail': 'invalid tournament name', 'code': 'error_occurred'}, status=400)
    if Tournament.objects.filter(tournament_name=tournament_name).exists():
        return JsonResponse({'detail': 'tournament name already in use', 'code': 'error_occurred'}, status=409)
    tournament = Tournament.objects.create(tournament_name=tournament_name, tournament_size = tournament_size)
    tournament.player_list.append(user_id)
    tournament.save()
    return JsonResponse({'tournament name': tournament.tournament_name}, status=201)

@csrf_exempt
@permission_classes([IsAuthenticated])
def Invite(request):
    try:
        if request.method != 'POST':
            return JsonResponse({"detail": "Method not allowed"}, status=405)

        # Authorization and payload decoding
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return JsonResponse({'detail': 'Authorization header missing'}, status=401)

        try:
            auth_token = auth_header.split()[1]
            decoded = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=["HS256"])
            user_id = decoded.get('user_id')
            if not user_id:
                raise ValueError("User ID missing in token")
        except Exception as e:
            return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)

        # Parse request data
        data = json.loads(request.body)
        t_name = data.get('tournament_name')
        group = data.get('friend_id')

        if not t_name or not Tournament.objects.filter(tournament_name=t_name).exists():
            return JsonResponse({"detail": "Tournament not found", 'code': 'not_found'}, status=404)

        if not group:
            return JsonResponse({'detail': 'Friend ID is required', 'code': 'invalid_data'}, status=400)

        # Create the notification message
        message = t_name
        notification = {
            'type': 'invite_message',
            'group': f'user_{group}',
            'message': message,
            'sender': user_id,
        }

        # Publish the notification
        redis_client.publish('global_chat', json.dumps(notification))

    except Exception as e:
        logger.error(f"Error processing invite: {e}")
        return JsonResponse({"detail": "An unexpected error occurred."}, status=500)

    return JsonResponse({"detail": "Message sent"}, status=200)

@csrf_exempt
@permission_classes([IsAuthenticated])
def JoinTournament(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    try:
        tmp = request.headers.get('Authorization')
        if not tmp:
            return JsonResponse({'detail': 'Authorization header missing', 'code': 'missing_header'}, status=401)
        auth_header = tmp.split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    except InvalidTokenError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    user_id = decoded.get('user_id')
    if not user_id:
        return JsonResponse({'detail': 'User not found', 'code': 'not_found'}, status=404)
    data = json.loads(request.body)
    if not data.get('name'):
        return JsonResponse({'detail': 'missing tournament name in body', 'code': 'incomplete_body'}, status=400)
    tournament_name = data.get('name')
    if not tournament_name or not re.match(r'^[a-zA-Z0-9]{5,16}$', tournament_name):
        return JsonResponse({'detail': 'invalid tournament name', 'code': 'error_occurred'}, status=400)

    try:
        tournament = Tournament.objects.get(tournament_name=tournament_name)
    except ObjectDoesNotExist:
        return JsonResponse({'detail': 'Tournament not found', 'code': 'not_found'}, status=404)
    # Add a player to the list
    if user_id in tournament.player_list:
        return JsonResponse({'detail': 'User already subscribed', 'code': 'conflict'}, status=409)
    if len(tournament.player_list) == tournament.tournament_size:
        return JsonResponse({'detail': 'Tournament full', 'code': 'conflict'}, status=409)

    tournament.player_list.append(user_id)  # Add player ID 1
    tournament.save()
    try :
        Tournament_operation(tournament)
    except Exception as e:
        return JsonResponse({'detail': 'Error starting tournament', 'code': 'error_occurred'}, status=500)
    # if len(tournament.player_list) >= tournament.tournament_size:
    #     # Start the tournament
    #     return Tournament_operation(tournament)
    return JsonResponse({'tournament name': tournament.tournament_name}, status=200)

@csrf_exempt
@permission_classes([IsAuthenticated])
def TournamentList(request):
    if request.method != 'GET':
            return JsonResponse({"detail": "Method not allowed"}, status=405)

    # Authorization and payload decoding
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return JsonResponse({'detail': 'Authorization header missing'}, status=401)

    try:
        auth_token = auth_header.split()[1]
        decoded = jwt.decode(auth_token, settings.SECRET_KEY, algorithms=["HS256"])
        user_id = decoded.get('user_id')
        if not user_id:
            raise ValueError("User ID missing in token")
    except Exception as e:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    # Extract user ID from the decoded token
    user_id = decoded.get('user_id')
    if not user_id:
        return JsonResponse({'detail': 'User not found', 'code': 'not_found'}, status=404)
    tournaments = Tournament.objects.all()
    tournament_list = []
    for tournament in tournaments:
        tournament_list.append(tournament.tournament_name)
    return JsonResponse({'tournaments': tournament_list}, status=200)

@csrf_exempt
@permission_classes([IsAuthenticated])
def TournamentDetails(request, name):
    if request.method != 'GET':
        return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization').split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    except InvalidTokenError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    # Extract user ID from the decoded token
    user_id = decoded.get('user_id')
    if not user_id:
        return JsonResponse({'detail': 'User not found', 'code': 'not_found'}, status=404)
    try:
        tournament = Tournament.objects.get(tournament_name=name)
    except ObjectDoesNotExist:
        return JsonResponse({'detail': 'Tournament not found', 'code': 'not_found'}, status=404)
    return JsonResponse({'tournament name': tournament.tournament_name, 'players': tournament.player_list, 'size': tournament.tournament_size}, status=200)

@csrf_exempt
@permission_classes([IsAuthenticated])
def DeleteTournament(request):
    if request.method != 'DELETE':
        return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    try:
        auth_header = request.headers.get('Authorization').split()[1]
        decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    except InvalidTokenError:
        return JsonResponse(mock_jwt_expired(),status=status.HTTP_401_UNAUTHORIZED)
    # Extract user ID from the decoded token
    data = json.loads(request.body)
    if not data.get('name'):
        return JsonResponse({'detail': 'missing tournament name in body', 'code': 'incomplete_body'}, status=400)
    name = data.get('name')
    try:
        tournament = Tournament.objects.get(tournament_name=name)
    except ObjectDoesNotExist:
        return JsonResponse({'detail': 'Tournament not found', 'code': 'not_found'}, status=404)
    tournament.delete()
    return JsonResponse({'detail': 'Tournament deleted', 'name' : name}, status=200)
