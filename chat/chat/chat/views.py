from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import redis

redis_client = redis.StrictRedis(host='redis', port=6379, db=0)

class TestView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        notification = {
            'type': 'notification_message',
            'group': 'user_1',
            'message': 'greetings',
            'sender': 'system'
        }

        # Get the channel layer
        channel_layer = get_channel_layer()
        
        async_to_sync(channel_layer.group_add)(
            "newgroup",  # Group name
            "user_1"  # User-specific channel name
        )
        
        # Send the message to the group
        async_to_sync(channel_layer.group_send)(
            'user_1',  # Group name
            notification
        )

        return Response({"detail": "Message sent"}, status=status.HTTP_200_OK)
