import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter, ChannelNameRouter
from channels.auth import AuthMiddlewareStack
from pong.routing import websocket_urlpatterns  # Import your routing.py
from pong.pong_consumer import PongConsumer

# This is your Django app's ASGI configuration
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pongAPI.settings")

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # Handle HTTP requests
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)  # Route WebSocket traffic to PlayerConsumer
    ),
    "channel": ChannelNameRouter({
        "game_engine": PongConsumer.as_asgi(),  # Ensure PongConsumer listens to game_engine group
    }),
    
})
