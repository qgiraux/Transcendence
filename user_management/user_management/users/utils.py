import redis
import logging

def is_user_online(user_id):
    logger = logging.getLogger(__name__)
    redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
    print_redis_content()
    return redis_client.exists(f"user:{user_id}:online")

def print_redis_content():
    logger = logging.getLogger(__name__)
    redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
    for key in redis_client.scan_iter():
        value = redis_client.get(key)
