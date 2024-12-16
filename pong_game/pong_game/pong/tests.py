import asyncio
from django.test import TestCase
from django.conf import settings
from channels.testing import ChannelsLiveServerTestCase, WebsocketCommunicator
from pongAPI.asgi import application

print("Settings:", settings.DATABASES)

# Create your tests here.
class PlayerWebSocketTests(ChannelsLiveServerTestCase):
    def test_player_assignment(self):
        # Run the async test code synchronously
        asyncio.run(self.async_test_player_assignment())

    async def async_test_player_assignment(self):
        # Player 1 connects
        communicator1 = WebsocketCommunicator(application, "/ws/pong/")
        connected, _ = await communicator1.connect()
        self.assertTrue(connected)  # Assert WebSocket connected

        # Receive response for Player 1
        response1 = await communicator1.receive_json_from()
        self.assertEqual(response1['player_left'], True)

        # Player 2 connects
        communicator2 = WebsocketCommunicator(application, "/ws/pong/")
        connected, _ = await communicator2.connect()
        self.assertTrue(connected)  # Assert WebSocket connected

        # Receive response for Player 2
        response2 = await communicator2.receive_json_from()
        self.assertEqual(response2['player_left'], False)

        # Clean up connections
        await communicator1.disconnect()
        await communicator2.disconnect()