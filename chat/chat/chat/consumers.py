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

logger = logging.getLogger(__name__)

class ChatConsumer(AsyncWebsocketConsumer):
    channels = []

    async def connect(self):
        logger.info("WebSocket connection attempt")
        
        # Extract the token from the query string
        query_string = self.scope['query_string'].decode()
        query_params = parse_qs(query_string)
        token = query_params.get('token', [None])[0]

        if token:
            # Decode the token to get user_id and nickname
            user_info = self.decode_token(token)
            if user_info:
                self.user_id = user_info['user_id']
                self.nickname = user_info['nickname']
                logger.info(f"User {self.nickname} connected")
            else:
                self.user_id = None
                self.nickname = "Guest"
                logger.error("Invalid token")
        else:
            logger.error("No token provided")
            self.user_id = None
            self.nickname = "Guest"

        # Determine the group name based on whether the user is authenticated or not
        if self.user_id:
            self.group_name = f"user_{self.user_id}"

            # Add the user to the group
            await self.channel_layer.group_add(
                self.group_name,
                self.channel_name
            )
            logger.error(self.group_name)
            await self.channel_layer.group_add(
                'global_chat',
                self.channel_name
            )
            
            # Add user to the global Redis hash with nickname
            # await redis_client.hset('global_chat', self.user_id, self.nickname)  
            await self.accept()

            # Start listening to Redis messages (subscribe to the global chat and user-specific channels)
            self.add_channel(self.group_name)
            self.add_channel('global_chat')
            if self.group_name:
                self.channels.append(self.group_name)
            asyncio.create_task(self.listen_to_redis(self.channels))
        else:
            self.group_name = None
            await self.close()

    def decode_token(self, token):
        """Decodes the JWT token and extracts user information."""
        try:
            decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            return {
                'user_id': decoded.get('user_id', -1),
                'nickname': decoded.get('nickname', 'User')
            }
        except jwt.ExpiredSignatureError:
            logger.error("Token has expired")
            return None
        except jwt.InvalidTokenError:
            logger.error("Invalid token")
            return None

    async def disconnect(self, close_code):
        """Handles the disconnect event."""
        logger.info(f"User {self.nickname} disconnected with code {close_code}")
        # Remove the user from the groups
        if self.group_name:
            await self.channel_layer.group_discard(
                self.group_name,
                self.channel_name
            )
        if self.user_id is not None:
            await redis_client.hdel('global', self.user_id)  # Remove user from global hash

    async def receive(self, text_data):
        """Handles incoming messages from WebSocket clients."""
        data = json.loads(text_data)
        message_type = data.get('type')
        group = data.get('group', 'global_chat')
        sender_name = self.nickname

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
        elif message_type == 'subscribe':
            # Handle subscription to additional channels (e.g., tournament channels)
            channel_name = data.get('channel')
            if channel_name:
                await self.channel_layer.group_add(
                    channel_name,
                    self.channel_name
                )
                await self.add_channel(channel_name)
                await self.send(text_data=json.dumps({
                    'type': 'subscription',
                    'message': f'Subscribed to {channel_name}'
                }))
                logger.info(f"User {self.nickname} subscribed to {channel_name}")

    async def chat_message(self, event):
        """Send the chat message to the WebSocket."""
        await self.send(text_data=json.dumps({
            'type': 'chat',
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

    async def listen_to_redis(self, channels):
        """Listen for messages from Redis and forward to WebSocket."""
        redis_client = redis.from_url('redis://redis')
        try:
            pubsub = redis_client.pubsub()
            await pubsub.subscribe(*channels)
            async for message in pubsub.listen():
                if message['type'] == 'message':
                    try:
                        data = json.loads(message['data'])
                        logger.info(f"Received Redis message: {data}")
                        # Send the message to the appropriate WebSocket group
                        await self.channel_layer.group_send(
                            data['group'],
                            {
                                'type': 'chat_message',
                                'message': data['message'],
                                'sender': data['sender'],
                                'group': data['group'],
                            }
                        )
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON message: {e}")
                    except KeyError as e:
                        logger.error(f"Missing key in message data: {e}")
                    except Exception as e:
                        logger.error(f"Error sending message to WebSocket group: {e}")
        except redis.ConnectionError as e:
            logger.error(f"Redis connection error: {e}")
        except Exception as e:
            logger.error(f"Error subscribing to Redis channels: {e}")
        finally:
            await redis_client.close()

    async def add_channel(self, channel_name):
        """Dynamically add new Redis channels to listen to."""
        if channel_name not in self.channels:
            self.channels.append(channel_name)
            await redis_client.pubsub().subscribe(channel_name)
            logger.error(f"Subscribed to new channel: {channel_name}")