import redis
import logging

logger = logging.getLogger(__name__)

def is_user_online(user_id):
    redis_client = redis.StrictRedis(host='redis', port=6379, db=0)
    # print_redis_content()
    return redis_client.sismember('online_users', user_id)
