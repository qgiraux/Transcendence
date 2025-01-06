import json
import logging
import asyncio
from urllib.parse import parse_qs
import jwt
from django.conf import settings
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
import redis.asyncio as redis

# Logging setup
logger = logging.getLogger(__name__)

# Redis client setup
redis_client = redis.StrictRedis(host='redis', port=6379, db=0)

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info("WebSocket connection attempt")
        query_params = parse_qs(self.scope['query_string'].decode())
        token = query_params.get('token', [None])[0]

        if token:
            user_info = self.decode_token(token)
            if user_info:
                self.user_id = user_info['user_id']
                self.nickname = user_info['nickname']
                logger.info(f"User {self.nickname} connected")
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

    async def disconnect(self, close_code):
        logger.info(f"User {self.nickname} disconnected")
        await redis_client.srem('online_users', self.user_id)
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')
        group = data.get('group', 'global_chat')

        if message_type == 'chat':
            await self.channel_layer.group_send(
                group,
                {
                    'type': 'chat_message',
                    'message': data['message'],
                    'sender': self.nickname,
                    'group': group,
                }
            )
        elif message_type == 'subscribe':
            channel_name = data.get('channel')
            if channel_name:
                await self.channel_layer.group_add(channel_name, self.channel_name)
                await self.channel_layer.group_send(
                    f'user_{self.user_id}',
                    {
                        'type': 'notification_message',
                        'sender': 'system',
                        'message': f'{self.nickname} subscribed to {channel_name}',
                        'group': channel_name,
                    }
                )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat',
            'message': event['message'],
            'group': event['group'],
            'sender': event['sender'],
        }))

    async def notification_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'message': event['message'],
            'group': event['group'],
            'sender': event['sender'],
        }))
    
    async def invite_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'invite',
            'message': event['message'],
            'group': event['group'],
            'sender': event['sender'],
        }))

    def decode_token(self, token):
        try:
            return jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            logger.error("Token expired")
        except jwt.InvalidTokenError:
            logger.error("Invalid token")
        return None


async def listen_to_redis():
    pubsub = redis_client.pubsub()
    await pubsub.subscribe('global_chat')  # Subscribe to global Redis channels

    channel_layer = get_channel_layer()
    try:
        async for message in pubsub.listen():
            if message and isinstance(message['data'], bytes):
                data = json.loads(message['data'])
                logger.info(f"Dispatching message: {data}")
                await channel_layer.group_send(
                    data['group'],
                    {
                        'type': 'chat_message',
                        'message': data['message'],
                        'sender': data['sender'],
                        'group': data['group'],
                    }
                )
    except Exception as e:
        logger.error(f"Error in Redis listener: {e}")
    finally:
        await pubsub.unsubscribe('global_chat')
        await redis_client.close()


# Entry point to run Redis listener
if __name__ == "__main__":
    try:
        asyncio.run(listen_to_redis())
    except KeyboardInterrupt:
        logger.info("Shutting down Redis listener.")
