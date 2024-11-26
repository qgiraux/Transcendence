import json
from channels.generic.websocket import AsyncWebsocketConsumer
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import TokenObtainPairView
import jwt
from django.conf import settings
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async
from rest_framework_simplejwt.authentication import JWTAuthentication



class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.roomGroupName = "group_chat_transcendence"
        await self.channel_layer.group_add(
            self.roomGroupName,
            self.channel_name
        )

        # Manually handle CSRF exemption and permissions
        headers = dict(self.scope['headers'])
        auth_header = headers.get(b'authorization', None)
        if not auth_header:
            await self.close(code=4001)
            return

        # Decode the token
        token = auth_header.decode()

        try:
            # Use SimpleJWT to validate the token
            UntypedToken(token)  # Validates the token signature and expiry
            decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
            self.username = decoded_token.get("username")

        except (InvalidToken, TokenError):
            # Close connection if token is invalid
            await self.close(code=4002)
            return

        
        await self.accept()



    async def disconnect(self , close_code):
        await self.channel_layer.group_discard(
            self.roomGroupName , 
            self.channel_name 
        )
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        username = self.username
        await self.channel_layer.group_send(
            self.roomGroupName,{
                "type" : "sendMessage" ,
                "username" : username ,
                "message" : message , 
            })
    async def sendMessage(self , event) : 
        message = event["message"]
        username = event["username"]
        await self.send(text_data = json.dumps({"message":message ,"username":username}))