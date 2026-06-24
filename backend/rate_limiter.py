"""Redis sliding window rate limiter."""

import time
from backend.redis_client import get_redis

MAX_REQUESTS = 10
WINDOW_SECONDS = 60


async def check_rate_limit(user_id: str) -> tuple[bool, int]:
    """Returns (is_allowed, remaining_requests)."""
    r = get_redis()
    key = f"ratelimit:{user_id}"
    now = time.time()

    pipe = r.pipeline()
    pipe.zremrangebyscore(key, 0, now - WINDOW_SECONDS)
    pipe.zcard(key)
    pipe.zadd(key, {str(now): now})
    pipe.expire(key, WINDOW_SECONDS)
    results = await pipe.execute()

    current_count = results[1]

    if current_count >= MAX_REQUESTS:
        await r.zrem(key, str(now))
        return False, 0

    return True, MAX_REQUESTS - current_count - 1
