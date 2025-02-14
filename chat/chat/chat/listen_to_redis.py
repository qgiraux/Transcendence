import asyncio
import json
import logging
from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Run Redis pubsub listener"

    async def listen_to_redis(self):
        redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
        pubsub = redis_client.pubsub()
        await pubsub.subscribe('global_chat')  # Subscribe to global Redis channels
        logger.info("[Chat.listen_to_redis] listen to redis intit ok")
        try:
            async for message in pubsub.listen():
                logger.debug(f"[Chat.listen_to_redis] Message: {message}")
                if message and isinstance(message['data'], bytes):
                    data = json.loads(message['data'])
                    logger.debug(f"[Chat.listen_to_redis] Dispatching message: {data}")
                    channel_layer = get_channel_layer()
                    await channel_layer.group_send(
                        data['group'],
                        {
                            'type': data['type'],
                            'message': data['message'],
                            'sender': data['sender'],
                            'group': data['group'],
                        }
                    )
        except Exception as e:
            logger.error(f"[Chat.listen_to_redis] Error in Redis listener: {e}")
        finally:
            await pubsub.unsubscribe('global_chat')
            await redis_client.close()

    def handle(self, *args, **kwargs):
        asyncio.run(self.listen_to_redis())

    def __init__(self):
        asyncio.run(self.listen_to_redis())