import json
import logging
from django.http import HttpResponse
from django.shortcuts import render
from .models import Friends
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework import status
from django.conf import settings
import jwt
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from django.views.decorators.csrf import csrf_exempt

# Create your views here.
# @api_view(['POST'])
@csrf_exempt
@permission_classes([IsAuthenticated])
def AddFriend(request):
    # Extract JSON data from request body
    data = json.loads(request.body)
    auth_header = request.headers.get('Authorization').split()[1]
    decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    friend_id = data.get('id')  # Extract 'id' from JSON data
    # Create a new friend relationship
    new = Friends()
    user_id = decoded['user_id']  # Corrected to access the user's id  
    if not user_id:
        return HttpResponse(json.dumps({'detail': 'User ID not found in token', 'code': 'user_id_not_found'}), status=400, content_type='application/json')
    new.friend_id = friend_id
    new.user_id = user_id
    new.save()

    # Prepare response body
    body = json.dumps({'message': 'Friend added successfully'})
    return HttpResponse(body, status=200, content_type='application/json')

# @api_view(['GET'])
@permission_classes([IsAuthenticated])
def Friendslist(request):
    logger = logging.getLogger(__name__)
    auth_header = request.headers.get('Authorization').split()[1]
    decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    # logger.error("test" + decoded)
    logger.error('BEGIN!!!!!!!!')
    logger.error(decoded)
    logger.error('END!!!!!!!!')
    user_id = decoded['user_id']    
    if not user_id:
        return HttpResponse(json.dumps({'detail': 'User ID not found in token', 'code': 'user_id_not_found'}), status=400, content_type='application/json')
    friend_ids = list(Friends.objects.filter(user_id=decoded['user_id']).values_list('friend_id', flat=True))
    if not friend_ids:
        return HttpResponse(json.dumps({'detail': 'no friends found', 'code': 'friends_not_found'}), status=400, content_type='application/json')
    return HttpResponse(json.dumps(friend_ids), status=200, content_type='application/json')

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def RemoveFriend(request):
    # Extract 'id' from query parameters
    auth_header = request.headers.get('Authorization').split()[1]
    decoded = jwt.decode(auth_header, settings.SECRET_KEY, algorithms=["HS256"])
    friend_id = request.query_params.get('id')
    if not friend_id:
        return HttpResponse(json.dumps({'error': 'Friend ID is required'}), status=400, content_type='application/json')
    # Delete the friend relationship
    deleted, _ = Friends.objects.filter(user_id=request.decode['user_id'], friend_id=friend_id).delete()
    if deleted:
        return HttpResponse(json.dumps({'message': 'Friend removed successfully'}), status=200, content_type='application/json')
    else:
        return HttpResponse(json.dumps({'error': 'Friend not found'}), status=404, content_type='application/json')