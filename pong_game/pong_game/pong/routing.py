from django.urls import path
from .pong_consumer import PlayerConsumer

websocket_urlpatterns = [
    path("ws/pong/", PlayerConsumer.as_asgi()),
]
