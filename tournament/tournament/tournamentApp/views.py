
import json
import jwt
import logging
import redis
from .models import Tournament
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.exceptions import ObjectDoesNotExist

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
    tournament = Tournament.objects.create(tournament_name=tournament_name, tournament_size = tournament_size)
    tournament.player_list.append(user_id)
    tournament.save()
    return JsonResponse({'tournament name': tournament.tournament_name}, status=201)

@csrf_exempt
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
            logger.error(f"JWT decoding failed: {e}")
            return JsonResponse({'detail': 'Invalid or expired token'}, status=401)
        
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
        logger.error(f"Message: {message}")
        notification = {
            'type': 'invite_message',
            'group': f'user_{group}',
            'message': message,
            'sender': 'system'
        }
        
        # Publish the notification
        redis_client.publish('global_chat', json.dumps(notification))
        
    except Exception as e:
        logger.error(f"Error processing invite: {e}")
        return JsonResponse({"detail": "An unexpected error occurred."}, status=500)
    
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
    
@csrf_exempt
def TournamentList(request):
    if request.method != 'GET':
        return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    auth_header = request.headers.get('Authorization').split()[1]
    decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    # Extract user ID from the decoded token
    user_id = decoded.get('user_id')
    if not user_id:
        return JsonResponse({'detail': 'User not found', 'code': 'not_found'}, status=404)
    tournaments = Tournament.objects.all()
    tournament_list = []
    for tournament in tournaments:
        logger.error(tournament.tournament_name, tournament.player_list)
        tournament_list.append(tournament.tournament_name)
    return JsonResponse({'tournaments': tournament_list}, status=200)

@csrf_exempt
def TournamentDetails(request, name):
    if request.method != 'GET':
        return JsonResponse({'detail': 'method not allowed', 'code': 'method_not_allowed'}, status=405)
    auth_header = request.headers.get('Authorization').split()[1]
    decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    # Extract user ID from the decoded token
    user_id = decoded.get('user_id')
    if not user_id:
        return JsonResponse({'detail': 'User not found', 'code': 'not_found'}, status=404)
    logger.error(name)
    try:
        tournament = Tournament.objects.get(tournament_name=name)
    except ObjectDoesNotExist:
        return JsonResponse({'detail': 'Tournament not found', 'code': 'not_found'}, status=404)
    return JsonResponse({'tournament name': tournament.tournament_name, 'players': tournament.player_list, 'size': tournament.tournament_size}, status=200)