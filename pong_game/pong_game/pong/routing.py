from django.urls import path
from pong.pong_consumer import PlayerConsumer, PongConsumer
from channels.routing import ChannelNameRouter

websocket_urlpatterns = [
    path("ws/pong/", PlayerConsumer.as_asgi()),

]
channel_routing = ChannelNameRouter({
    "game_channel": PongConsumer.as_asgi(),  # This will route messages on the "game_channel" to PongConsumer
})


