"""
ASGI config for pongAPI project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.1/howto/deployment/asgi/
"""

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.urls import path
from django.core.asgi import get_asgi_application
from pong.routing import websocket_urlpatterns
from channels.auth import AuthMiddlewareStack
from pong import routing

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pongAPI.settings')

application = ProtocolTypeRouter({
	'http': get_asgi_application(),
	"websocket" : AuthMiddlewareStack(
            URLRouter(
                routing.websocket_urlpatterns
            )    
        )
})