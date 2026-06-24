"""Transaction Ranking System — FastAPI backend package."""

__version__ = "1.0.0"
__author__ = "Mahizhan"

from backend.database import init_db, close_db
from backend.redis_client import init_redis, close_redis

__all__ = [
    "init_db",
    "close_db",
    "init_redis",
    "close_redis",
]
