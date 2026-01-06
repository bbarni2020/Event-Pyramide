import redis
import json
import os

redis_client = redis.Redis(
    host=os.getenv('REDIS_HOST', 'localhost'),
    port=int(os.getenv('REDIS_PORT', 6379)),
    decode_responses=True
)

CACHE_TTL = 60
USER_CACHE_TTL = 300

def get(key):
    try:
        if redis_client.ping():
            cached = redis_client.get(key)
            if cached:
                return json.loads(cached)
    except:
        pass
    return None

def set(key, value, ttl=CACHE_TTL):
    try:
        if redis_client.ping():
            redis_client.setex(key, ttl, json.dumps(value, default=str))
    except:
        pass

def delete(key):
    try:
        if redis_client.ping():
            redis_client.delete(key)
    except:
        pass

def get_cache_status():
    try:
        if redis_client.ping():
            info = redis_client.info()
            return {
                'status': 'connected',
                'memory_used_mb': info.get('used_memory', 0) / (1024 * 1024),
                'connected_clients': info.get('connected_clients', 0),
            }
    except:
        return {'status': 'disconnected'}
