"""Seeds demo users and sample transactions on first startup."""

import uuid
from backend.database import get_pool

DEMO_USERS = [
    {"id": "user_1", "name": "Alice Johnson"},
    {"id": "user_2", "name": "Bob Smith"},
    {"id": "user_3", "name": "Charlie Brown"},
    {"id": "user_4", "name": "Diana Prince"},
    {"id": "user_5", "name": "Eve Williams"},
]

DEMO_TRANSACTIONS = [
    ("user_1", "earn",  500.00, "Completed risk assessment project"),
    ("user_1", "earn",  250.00, "Monthly bonus"),
    ("user_1", "spend", 100.00, "Premium subscription"),
    ("user_1", "earn",  300.00, "Referral reward"),
    ("user_1", "spend",  75.00, "Report download"),
    ("user_1", "earn",  150.00, "Survey completion"),
    ("user_1", "earn",  200.00, "Training completion"),

    ("user_2", "earn",  400.00, "Data analysis task"),
    ("user_2", "earn",  150.00, "Weekly challenge"),
    ("user_2", "spend", 200.00, "Tool purchase"),
    ("user_2", "earn",  350.00, "Compliance review"),
    ("user_2", "spend",  50.00, "Report template"),

    ("user_3", "earn",  100.00, "Quick task"),
    ("user_3", "earn",   75.00, "Feedback submission"),
    ("user_3", "earn",   50.00, "Daily login bonus"),
    ("user_3", "spend",  25.00, "Badge purchase"),
    ("user_3", "earn",   80.00, "Peer review"),
    ("user_3", "earn",   60.00, "Quiz completion"),
    ("user_3", "earn",   90.00, "Workshop attendance"),
    ("user_3", "spend",  30.00, "Theme customization"),
    ("user_3", "earn",   45.00, "Community help"),

    ("user_4", "earn", 1000.00, "Enterprise audit completion"),
    ("user_4", "earn",  800.00, "Annual review"),
    ("user_4", "spend", 500.00, "Advanced certification"),

    ("user_5", "earn",  100.00, "Welcome bonus"),
    ("user_5", "earn",   50.00, "Profile setup"),
    ("user_5", "spend",  20.00, "Avatar purchase"),
]


async def seed_database():
    """Populate DB with demo data if empty."""
    pool = get_pool()

    async with pool.acquire() as conn:
        if await conn.fetchval("SELECT COUNT(*) FROM users") > 0:
            return

        for user in DEMO_USERS:
            await conn.execute(
                "INSERT INTO users (id, name) VALUES ($1, $2)",
                user["id"], user["name"]
            )
            await conn.execute(
                "INSERT INTO user_summaries (user_id) VALUES ($1)",
                user["id"]
            )

        for user_id, txn_type, amount, description in DEMO_TRANSACTIONS:
            async with conn.transaction():
                await conn.execute(
                    "INSERT INTO transactions (idempotency_key, user_id, type, amount, description) "
                    "VALUES ($1, $2, $3, $4, $5)",
                    f"seed-{uuid.uuid4()}", user_id, txn_type, amount, description
                )
                if txn_type == "earn":
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

        print(f"[Seed] Created {len(DEMO_USERS)} users, {len(DEMO_TRANSACTIONS)} transactions")
