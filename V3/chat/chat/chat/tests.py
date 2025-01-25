
import jwt
from django.conf import settings
from channels.testing import WebsocketCommunicator, ChannelsLiveServerTestCase
from channels.layers import get_channel_layer
from .consumers import ChatConsumer
import redis
from unittest import mock

class ChatConsumerTests(ChannelsLiveServerTestCase):
    def setUp(self):
        """Set up initial conditions for the test"""
        
        # Mock the Redis connection
        self.mock_redis = mock.MagicMock(spec=redis.asyncio.client.StrictRedis)
        
        # Mock the pubsub object returned by Redis
        self.mock_pubsub = mock.MagicMock()
        self.mock_redis.pubsub.return_value = self.mock_pubsub
        
        # Mock Redis methods like sadd and srem
        self.mock_redis.sadd.return_value = None
        self.mock_redis.srem.return_value = None
        # Inject the mock Redis client into the consumer
        redis_client = self.mock_redis
        # redis.StrictRedis = self.mock_redis

        # Create a JWT token for authentication
        self.token = self.create_jwt_token(user_id=1, nickname='TestUser')

        # Set the WebSocket URL with the token as a query parameter
        self.ws_url = f"ws://localhost:{self.live_server_url}/ws/chat/?token={self.token}"

    def create_jwt_token(self, user_id, nickname):
        """Generate a JWT token for testing."""
        payload = {
            'user_id': user_id,
            'nickname': nickname,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

    async def connect_to_websocket(self):
        """Helper method to establish a WebSocket connection"""
        communicator = WebsocketCommunicator(ChatConsumer.as_asgi(), self.ws_url)
        # Connect and wait for the handshake to complete
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected)
        return communicator

    async def test_send_receive_message(self):
        """Test sending and receiving messages through WebSocket."""
        communicator = await self.connect_to_websocket()

        # Send a chat message to the consumer
        message = {
            'type': 'chat',
            'message': 'Hello, world!',
            'group': 'global_chat',
            'sender': 'tester'
        }
        await communicator.send_json_to(message)

        # Check that the consumer correctly broadcasts the message
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'chat')
        self.assertEqual(response['message'], 'Hello, world!')
        self.assertEqual(response['sender'], 'TestUser')

        await communicator.disconnect()

    async def test_subscribe_to_channel(self):
        """Test subscribing to a new channel and receiving notifications."""
        communicator = await self.connect_to_websocket()

        # Send a subscribe message
        subscribe_message = {
            'type': 'subscribe',
            'channel': 'tournament_123',
        }
        await communicator.send_json_to(subscribe_message)

        # Simulate receiving a notification on the subscribed channel
        notification_message = {
            'type': 'notification',
            'message': 'TestUser subscribed to tournament_123',
            'sender': 'system',
            'group': 'tournament_123',
        }

        # Check if the message is received through the WebSocket
        response = await communicator.receive_json_from()
        self.assertEqual(response['type'], 'notification')
        self.assertEqual(response['message'], 'TestUser subscribed to tournament_123')

        await communicator.disconnect()

    async def test_redis_publish_subscribe(self):
        """Test message passing through Redis and to the WebSocket."""
        communicator = await self.connect_to_websocket()

        # Simulate a message being sent through Redis (to the global chat)
        test_message = {
            'type': 'chat_message',
            'message': 'Message from Redis!',
            'sender': 'system',
            'group': 'global_chat',
        }

        # Trigger the pubsub system manually (simulate Redis event)
        await get_channel_layer().group_send(
            'global_chat',
            test_message
        )

        # Now check if the message is received by the WebSocket
        response = await communicator.receive_json_from()
        self.assertEqual(response['message'], 'Message from Redis!')
        self.assertEqual(response['sender'], 'system')

        await communicator.disconnect()


