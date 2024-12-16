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

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pongAPI.settings')

application = ProtocolTypeRouter({
	'http': get_asgi_application(),
	'websocket': URLRouter(websocket_urlpatterns),
})

ASGI_APPLICATION = 'pongAPI.asgi.application'
WSGI_APPLICATION = 'pongAPI.wsgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [("127.0.0.1", 6379)],
			'capacity': 1000,
        },
    }
}