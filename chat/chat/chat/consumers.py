import json
import logging
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from urllib.parse import parse_qs
import jwt
from django.conf import settings
import redis.asyncio as redis

# Initialize Redis client
redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
pubsub = redis_client.pubsub()
logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.error("WebSocket connection attempt")
        # Extract the token from the query string
        query_params = parse_qs(self.scope['query_string'].decode())
        token = query_params.get('token', [None])[0]

        if token:
            user_info = self.decode_token(token)
            if user_info:
                # Decode the token to get user_id and nickname
                self.user_id = user_info['user_id']
                self.nickname = user_info['nickname']
                logger.error(f"User {self.nickname} connected")
            else:
                logger.error("Invalid token")
                await self.close()
                return
        else:
            logger.error("No token provided")
            await self.close()
            return

        self.group_name = f"user_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.channel_layer.group_add('global_chat', self.channel_name)
        await redis_client.sadd('online_users', self.user_id)

        await self.accept()
        # Redis connection
        await self.connect_redis()

    async def disconnect(self, close_code):
        logger.info(f"User {self.nickname} disconnected")
        await redis_client.srem('online_users', self.user_id)
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
        await redis_client.close()


    def decode_token(self, token):
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            logger.error("Token expired")
        except jwt.InvalidTokenError:
            logger.error("Invalid token")
        return None

    async def connect_redis(self):
        retries = 5
        while retries > 0:
            try:
                self.redis_pubsub = redis_client.pubsub()
                return
            except redis.ConnectionError as e:
                retries -= 1
                logger.error(f"Redis connection failed, {retries} retries left")
                await asyncio.sleep(1)
        raise redis.ConnectionError("Failed to connect to Redis")

    async def receive(self, text_data):
        """Handles incoming messages from WebSocket clients."""
        data = json.loads(text_data)
        message_type = data.get('type')
        group = data.get('group', 'global_chat')
        sender_name = self.user_id

        # Handle different message types
        if message_type == 'chat':
            # Send the message to the global chat group
            await self.channel_layer.group_send(
                group,
                {
                    'type': 'chat_message',
                    'message': data['message'],
                    'sender': sender_name,
                    'group': group,
                }
            )
        elif message_type == 'notification':
            # Send the message directly to the specified user
            await self.channel_layer.group_send(
                group,
                {
                    'type': 'notification_message',
                    'message': data['message'],
                    'sender': sender_name,
                    'group': group,
                }
            )
        elif message_type == 'GOTO':
            # Send the message directly to the specified user
            await self.channel_layer.group_send(
                group,
                {
                    'type': 'redirection_message',
                    'message': data['message'],
                    'sender': sender_name,
                    'group': group,
                }
            )
        elif message_type == 'invite':
            # Send the message directly to the specified user
            await self.channel_layer.group_send(
                group,
                {
                    'type': 'invite_message',
                    'message': data['message'],
                    'sender': sender_name,
                    'group': group,
                }
            )

        elif message_type == 'subscribe':
            # Handle subscription to additional channels (e.g., tournament channels)
            channel_name = data.get('channel')
            if channel_name:
                await self.channel_layer.group_add(
                    channel_name,
                    self.channel_name
                )
                await self.redis_pubsub.subscribe(self.channel_name, 'global_chat')
                await self.channel_layer.group_send(
                    f'user_{self.user_id}',
                    {
                    'type': 'notification_message',
                    'sender':'system',
                    'group': channel_name,
                    'message': f'{self.nickname} subscribed to {channel_name}'
                })
                # logger.error(f"User {self.nickname} subscribed to {channel_name}")

    async def chat_message(self, event):
        """Send the chat message to the WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'message': event['message'],
            'group': event['group'],
            'sender': event['sender'],
        }))
    
    async def redirection_message(self, event):
        """Send the chat message to the WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'GOTO',
            'message': event['message'],
            'group': event['group'],
            'sender': event['sender'],
        }))

    async def notification_message(self, event):
        """Send the chat message to the WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event['message'],
            'group': event['group'],
            'sender': event['sender'],
        }))
    
    async def invite_message(self, event):
        """Send the chat message to the WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'invite',
            'message': event['message'],
            'group': event['group'],
            'sender': event['sender'],
        }))

    async def add_channel(self, channel_name):
        """Dynamically add new Redis channels to listen to."""
        if channel_name not in self.channels:
            self.channels.append(channel_name)
            await pubsub.subscribe(channel_name)
            # logger.error(f"Subscribed to new channel: {channel_name}")