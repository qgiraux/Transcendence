from channels.generic.websocket import WebsocketConsumer
import redis
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import redis
from asgiref.sync import async_to_sync
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
import jwt
from django.contrib.auth import get_user_model
import logging
from .utils import print_redis_content

User = get_user_model()

class OnlineStatusConsumer(WebsocketConsumer):
    def connect(self):
        logger = logging.getLogger(__name__)
        # Called when the WebSocket connection is initiated.
        self.user = None
        headers = dict(self.scope['headers'])
        auth_header = headers.get(b'authorization', None)
        if auth_header:
            token = auth_header.decode()  # Assuming "Bearer <token>"
            try:
                # Validate the token
                UntypedToken(token)

                # Decode the token to get the payload
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded_token.get("user_id")

                # Get the user from the user_id
                self.user = User.objects.get(id=user_id)

            except (InvalidToken, TokenError, jwt.DecodeError, User.DoesNotExist):
                # Close connection if token is invalid or user does not exist
                self.close(code=4002)
                return
        
        if self.user:
            # Use Redis to store the user's online status.
            redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
            key = f"user:{self.user.id}:online"
            value = "1"
            redis_client.set(key, value, ex=300)  # Expire in 5 mins
            self.accept()
            print_redis_content()

    def disconnect(self, close_code):
        # Called when the WebSocket connection is closed.
        if self.user and self.user.is_authenticated:
            redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
            redis_client.delete(f"user:{self.user.id}:online")
            print_redis_content()
