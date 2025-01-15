https://docs.djangoproject.com/en/5.1/intro/tutorial01/
https://dev.to/ki3ani/building-out-a-notes-app-with-react-and-a-django-rest-api-part-1-5bc5
https://docs.djangoproject.com/en/5.1/intro/tutorial01/


to start server : daphne -p 8001 tournament.asgi:application
Certainly! Here's the same information formatted in Markdown:

# WebSocket Clock with 1/100th of a Second Precision

### 1. **Install Required Packages**
Install **Django Channels** to enable WebSockets in Django:

```bash
pip install channels
```
(Optional, but recommended for production) Install Redis:
```
pip install channels_redis
```
2. Django Settings

Update settings.py to configure Channels:
```
INSTALLED_APPS = [
    ...
    'channels',  # Add channels here
]

ASGI_APPLICATION = 'your_project.asgi.application'

# (Optional) Configure Redis for Channels
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],  # Redis server host and port
        },
    },
}
```
3. Configure ASGI File

Edit asgi.py to route WebSocket connections to the correct consumer:
```
import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from your_app import routing  # Import the routing module

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'your_project.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            routing.websocket_urlpatterns  # WebSocket URL routing
        )
    ),
})
```
4. Define WebSocket Routing

Create routing.py in your app to define WebSocket URL patterns:
```
from django.urls import re_path
from .consumers import ClockConsumer

websocket_urlpatterns = [
    re_path(r'ws/clock/$', ClockConsumer.as_asgi()),
]
```
5. Create WebSocket Consumer

Create consumers.py to handle the WebSocket connections and send the current time:
```
import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime

class ClockConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()  # Accept the WebSocket connection
        self.send_time_task = asyncio.create_task(self.send_time())  # Start sending time

    async def disconnect(self, close_code):
        self.send_time_task.cancel()  # Cancel the task when disconnected

    async def send_time(self):
        while True:
            now = datetime.now()
            # Format time as '%Y-%m-%d %H:%M:%S.' and then add 1/100th of a second
            formatted_time = now.strftime('%Y-%m-%d %H:%M:%S.') + f"{now.microsecond // 10000:02d}"
            await self.send(text_data=json.dumps({
                'message': formatted_time  # Send the time as a message
            }))
            await asyncio.sleep(0.01)  # Update every 1/100th of a second (10 ms)

    async def receive(self, text_data):
        pass  # No data received from client
```
  Key Changes in send_time Method:
      strftime('%Y-%m-%d %H:%M:%S.') formats the time.
      f"{now.microsecond // 10000:02d}" extracts the first two digits of the microseconds for 1/100th of a second.
      await asyncio.sleep(0.01) ensures updates every 10 milliseconds.

6. Frontend JavaScript for WebSocket

Update the HTML/JavaScript to establish a WebSocket connection and display the time:
```
<!DOCTYPE html>
<html>
<head>
    <title>Clock</title>
</head>
<body>
    <h1>Current Time</h1>
    <p id="clock">Connecting...</p>

    <script>
        const clockElement = document.getElementById("clock");
        const socket = new WebSocket("ws://" + window.location.host + "/ws/clock/");

        socket.onopen = () => {
            console.log("WebSocket connection opened!");
        };

        socket.onmessage = (event) => {
            console.log("Received:", event.data);  // Log received data
            clockElement.textContent = event.data;  // Display the time in the <p> tag
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
            clockElement.textContent = "Error connecting!";
        };

        socket.onclose = () => {
            console.log("WebSocket connection closed.");
            clockElement.textContent = "Disconnected.";
        };
    </script>
</body>
</html>
```
  Important: The new WebSocket() should use window.location.host to dynamically connect to the correct WebSocket server (ws://127.0.0.1:8001/ws/clock/ for local development).

7. Run the Server

Start the Django development server:
```
daphne -p 8001 tournament.asgi:application  # Make sure the port matches the one in your WebSocket URL
```
8. Testing

    Visit http://127.0.0.1:8001/clock/ in your browser.
    You should see the clock updating every 1/100th of a second.

Summary of Changes:

    Install Django Channels and configure it in settings.py.
    Set up asgi.py to handle WebSocket connections.
    Create WebSocket URL routing in routing.py.
    Implement the WebSocket consumer in consumers.py to handle time updates.
    Update the frontend HTML/JavaScript to establish the WebSocket connection and display the time.
    Start the Django server to serve the WebSocket connection and page.

Now you have a working WebSocket-based clock with 1/100th of a second precision. Let me know if you need further clarifications!

