import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from users.consumers import OnlineStatusConsumer
from django.urls import path

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'user_management.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            [
                path("ws/status/", OnlineStatusConsumer.as_asgi()),
            ]
        )
    ),
})
