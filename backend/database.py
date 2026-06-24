"""PostgreSQL connection pool, schema initialization, and query functions."""

import os
import asyncpg
import logging
from typing import Optional, List, Dict, Any

logger = logging.getLogger(__name__)

_pool: Optional[asyncpg.Pool] = None


def _get_database_url() -> str:
    return os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/transaction_db"
    )


async def init_db():
    """Initialize connection pool and create schema."""
    global _pool

    database_url = _get_database_url()
    logger.info("Connecting to PostgreSQL...")

    _pool = await asyncpg.create_pool(
        database_url, min_size=2, max_size=10, command_timeout=30
    )

    async with _pool.acquire() as conn:
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS transactions (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                idempotency_key VARCHAR(100) UNIQUE NOT NULL,
                user_id VARCHAR(50) NOT NULL REFERENCES users(id),
                type VARCHAR(10) NOT NULL CHECK(type IN ('earn', 'spend')),
                amount NUMERIC(12,2) NOT NULL CHECK(amount > 0),
                description VARCHAR(255),
                created_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_summaries (
                user_id VARCHAR(50) PRIMARY KEY REFERENCES users(id),
                total_earned NUMERIC(12,2) DEFAULT 0,
                total_spent NUMERIC(12,2) DEFAULT 0,
                net_balance NUMERIC(12,2) DEFAULT 0,
                transaction_count INTEGER DEFAULT 0,
                last_transaction_at TIMESTAMPTZ,
                updated_at TIMESTAMPTZ DEFAULT NOW()
            )
        """)
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_txn_user ON transactions(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_txn_created ON transactions(created_at)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_summary_balance ON user_summaries(net_balance DESC)")

    logger.info("Database schema initialized")


async def close_db():
    global _pool
    if _pool:
        await _pool.close()
        _pool = None


def get_pool() -> asyncpg.Pool:
    if _pool is None:
        raise RuntimeError("Database not initialized")
    return _pool


async def user_exists(user_id: str) -> bool:
    pool = get_pool()
    async with pool.acquire() as conn:
        return await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM users WHERE id = $1)", user_id
        )


async def get_all_users() -> List[Dict[str, Any]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("SELECT id, name FROM users ORDER BY name")
        return [dict(r) for r in rows]


async def get_transaction_by_idempotency_key(key: str) -> Optional[Dict[str, Any]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, idempotency_key, user_id, type, amount, description, created_at "
            "FROM transactions WHERE idempotency_key = $1", key
        )
        return dict(row) if row else None


async def create_transaction(
    user_id: str, txn_type: str, amount: float,
    description: Optional[str], idempotency_key: str
) -> Dict[str, Any]:
    """
    Atomically insert a transaction and update user summary.
    Uses SELECT ... FOR UPDATE to serialize concurrent writes per user.
    """
    pool = get_pool()

    async with pool.acquire() as conn:
        async with conn.transaction():
            # Row-level lock on user summary
            summary = await conn.fetchrow(
                "SELECT net_balance FROM user_summaries WHERE user_id = $1 FOR UPDATE",
                user_id
            )
            if summary is None:
                raise ValueError(f"User summary not found: {user_id}")

            current_balance = float(summary['net_balance'])
            if txn_type == 'spend' and amount > current_balance:
                raise ValueError(
                    f"Insufficient balance: {current_balance:.2f} < {amount:.2f}"
                )

            row = await conn.fetchrow(
                "INSERT INTO transactions (idempotency_key, user_id, type, amount, description) "
                "VALUES ($1, $2, $3, $4, $5) "
                "RETURNING id, idempotency_key, user_id, type, amount, description, created_at",
                idempotency_key, user_id, txn_type, amount, description
            )

            if txn_type == 'earn':
                await conn.execute(
                    "UPDATE user_summaries SET total_earned = total_earned + $2, "
                    "net_balance = net_balance + $2, transaction_count = transaction_count + 1, "
                    "last_transaction_at = NOW(), updated_at = NOW() WHERE user_id = $1",
                    user_id, amount
                )
            else:
                await conn.execute(
                    "UPDATE user_summaries SET total_spent = total_spent + $2, "
                    "net_balance = net_balance - $2, transaction_count = transaction_count + 1, "
                    "last_transaction_at = NOW(), updated_at = NOW() WHERE user_id = $1",
                    user_id, amount
                )

            return dict(row)


async def get_user_summary(user_id: str) -> Optional[Dict[str, Any]]:
    pool = get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT u.id as user_id, u.name, "
            "COALESCE(s.total_earned,0) as total_earned, "
            "COALESCE(s.total_spent,0) as total_spent, "
            "COALESCE(s.net_balance,0) as net_balance, "
            "COALESCE(s.transaction_count,0) as transaction_count, "
            "s.last_transaction_at "
            "FROM users u LEFT JOIN user_summaries s ON u.id = s.user_id "
            "WHERE u.id = $1", user_id
        )
        return dict(row) if row else None


async def get_all_summaries() -> List[Dict[str, Any]]:
    """Get all user summaries with transaction_count > 0 for ranking."""
    pool = get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT u.id as user_id, u.name, "
            "COALESCE(s.total_earned,0) as total_earned, "
            "COALESCE(s.total_spent,0) as total_spent, "
            "COALESCE(s.net_balance,0) as net_balance, "
            "COALESCE(s.transaction_count,0) as transaction_count, "
            "s.last_transaction_at "
            "FROM users u LEFT JOIN user_summaries s ON u.id = s.user_id "
            "WHERE s.transaction_count > 0 ORDER BY s.net_balance DESC"
        )
        return [dict(r) for r in rows]
