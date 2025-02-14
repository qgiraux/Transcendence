import asyncio
import redis.asyncio as redis
import logging
from channels.layers import get_channel_layer

logger = logging.getLogger(__name__)
redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
channel_layer = get_channel_layer()

async def cleanup_online_users():
    while True:
        online_users = await redis_client.smembers('online_users')
        group_members = await redis_client.smembers('global_chat_members')
        for user_id in online_users:
            user_channel = f"user_{user_id.decode('utf-8')}"
            if user_channel.encode('utf-8') not in group_members:
                await redis_client.srem('online_users', user_id)
                logger.info(f"[Chat.tasks] Removed ghost user {user_id} from online_users")
        await asyncio.sleep(60)  # Run cleanup every 60 seconds

# Start the cleanup task
if __name__ == "__main__":
    asyncio.run(cleanup_online_users())