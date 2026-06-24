"""Redis connection, idempotency cache, and ranking cache."""

import os
import json
import redis.asyncio as redis
from typing import Optional
from datetime import datetime

_redis_client = None

IDEMPOTENCY_TTL = 86400   # 24 hours
RANKING_CACHE_TTL = 30    # 30 seconds


def _get_redis_url():
    return os.getenv("REDIS_URL", "redis://localhost:6379/0")


async def init_redis():
    global _redis_client
    _redis_client = redis.from_url(_get_redis_url(), decode_responses=True)
    await _redis_client.ping()
    print("[Redis] Connected")


async def close_redis():
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


def get_redis():
    if _redis_client is None:
        raise RuntimeError("Redis not initialized")
    return _redis_client


# -- Idempotency --

async def get_cached_response(idempotency_key: str) -> Optional[dict]:
    cached = await get_redis().get(f"idempotency:{idempotency_key}")
    return json.loads(cached) if cached else None


async def cache_response(idempotency_key: str, response_data: dict):
    await get_redis().set(
        f"idempotency:{idempotency_key}",
        json.dumps(response_data),
        ex=IDEMPOTENCY_TTL
    )


# -- Ranking cache --

async def get_cached_ranking():
    r = get_redis()
    cached = await r.get("ranking:cache")
    cached_at = await r.get("ranking:cached_at")
    if cached and cached_at:
        return json.loads(cached), cached_at
    return None, None


async def cache_ranking(ranking_data: list) -> str:
    r = get_redis()
    now = datetime.utcnow().isoformat() + "Z"
    pipe = r.pipeline()
    pipe.set("ranking:cache", json.dumps(ranking_data), ex=RANKING_CACHE_TTL)
    pipe.set("ranking:cached_at", now, ex=RANKING_CACHE_TTL)
    await pipe.execute()
    return now
