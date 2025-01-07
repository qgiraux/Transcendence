import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns
from django.urls import path
import django
import asyncio
from chat.consumers import ChatConsumer
from chat.tasks import cleanup_online_users
from chat.listen_to_redis import Command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')
django.setup()

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter([
            path("ws/chat/", ChatConsumer.as_asgi()),
        ])
    ),
})

# Start the cleanup task
loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)
loop.create_task(cleanup_online_users())

# Start Redis Listener
from threading import Thread
def start_redis_listener():
    command_instance = Command()
    asyncio.run(command_instance.listen_to_redis())

# Start Redis listener in a background thread
Thread(target=start_redis_listener, daemon=True).start()