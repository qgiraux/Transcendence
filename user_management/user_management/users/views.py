# Create your views here.
from .serializers import UserSerializer, CustomTokenObtainPairSerializer, UsernameSerializer
import json
import logging
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer
from rest_framework import status
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .utils import is_user_online
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import views, permissions




User = get_user_model()
logger = logging.getLogger(__name__)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

@ensure_csrf_cookie
def get_csrf_token(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE')})

@api_view(['GET'])
@permission_classes([IsAuthenticated]) 
def Get_my_infos(request):
    # Use the authenticated user from request.user
    user = request.user
    serializer = UserSerializer(user)
    return Response(serializer.data, status=200)

@api_view(['GET'])
@permission_classes([IsAuthenticated]) 
def Get_user_infos(request, user_id):
    user = get_object_or_404(User, id=user_id)
    user_info = {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
    }
    return JsonResponse(user_info)

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
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated]) 
def DeleteUser(request):
    user = request.user
    user.delete()
    return Response(status=200)



@api_view(['POST'])
@permission_classes([AllowAny]) 
def RegisterUser(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.nickname = user.username
        user.set_password(serializer.validated_data['password'])
        user.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def CheckUserStatus(request, user_id):
    online = is_user_online(user_id)
    return JsonResponse({"user_id": user_id, "online": online})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def GetAllUsers(request):
    users = User.objects.all()
    serializer = UserSerializer(users, many=True)
    return JsonResponse(serializer.data, safe=False)

def AddChannel(request):
    pass

from rest_framework import views, permissions
from rest_framework.response import Response
from rest_framework import status
from django_otp import devices_for_user
from django_otp.plugins.otp_totp.models import TOTPDevice
from urllib.parse import urlencode

def get_user_totp_device(self, user, confirmed=None):
    devices = devices_for_user(user, confirmed=confirmed)
    for device in devices:
        if isinstance(device, TOTPDevice):
            return device

import base64
from rest_framework import permissions, status, views
from rest_framework.response import Response
from urllib.parse import urlencode

class TOTPCreateView(views.APIView):
    """
    Use this endpoint to set up a new TOTP device
    """
    permission_classes = [permissions.IsAuthenticated] 
    
    def get(self, request, format=None):
        user = request.user
        
        # Check if the user already has a TOTP device
        device = get_user_totp_device(self, user)
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

        return Response(totp_url, status=status.HTTP_201_CREATED)

    
class TOTPVerifyView(views.APIView):
    """
    Use this endpoint to verify/enable a TOTP device
    """
    permission_classes = [permissions.IsAuthenticated]    
    
    def post(self, request, token, format=None):
        user = request.user
        device = get_user_totp_device(self, user)
        if not device == None and device.verify_token(token):
            if not device.confirmed:
                device.confirmed = True
                device.save()
            return Response(True, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)