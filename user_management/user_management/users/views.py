# Create your views here.
from .serializers import UserSerializer, CustomTokenObtainPairSerializer
import json
from django.contrib.auth import get_user_model
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated

from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView


User = get_user_model()

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

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
    }
    return JsonResponse(user_info)

@api_view(['POST'])
@permission_classes([IsAuthenticated]) 
def ChangeLogin(request):
    user = request.user
    print(user)
    body_unicode = request.body.decode('utf-8')
    body = json.loads(body_unicode)
    # Update username
    user.username = body['username']
    user.save()
    # Return updated user info
    serializer = UserSerializer(user)
    return Response(serializer.data, status=200)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated]) 
def DeleteUser(request):
    user = request.user
    user.delete()
    return Response(status=200)

from .serializers import RegisterSerializer
from rest_framework.views import APIView
from rest_framework import status

@api_view(['POST'])
@permission_classes([AllowAny]) 
def RegisterUser(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user.set_password(serializer.validated_data['password'])
        user.save()
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    


