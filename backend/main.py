"""
FastAPI application — Transaction Ranking System.
Routes: POST /transaction, GET /summary/{userId}, GET /ranking
"""

import os
from datetime import datetime
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from backend.models import (
    TransactionRequest, TransactionResponse, SummaryResponse,
    RankingResponse, RankingEntry, ErrorResponse,
)
from backend import database, redis_client, rate_limiter
from backend.ranking import calculate_rankings
from backend.seed_data import seed_database
from backend.security import SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.init_db()
    await redis_client.init_redis()
    await seed_database()
    print("App ready")
    yield
    await database.close_db()
    await redis_client.close_redis()


app = FastAPI(
    title="Transaction Ranking System",
    description="API demonstrating data consistency, fair ranking, and abuse prevention",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -- Routes --

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat() + "Z"}


@app.get("/api/users")
async def get_users():
    return {"users": await database.get_all_users()}


@app.post("/api/transaction", status_code=201)
async def create_transaction(request: TransactionRequest):
    """Create a transaction with idempotency, rate limiting, and atomic balance update."""

    # Idempotency check
    cached = await redis_client.get_cached_response(request.idempotencyKey)
    if cached:
        return JSONResponse(
            status_code=200,
            content={**cached, "message": "Duplicate request — returning cached response"}
        )

    # Rate limit check
    is_allowed, remaining = await rate_limiter.check_rate_limit(request.userId)
    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Rate limit exceeded ({rate_limiter.MAX_REQUESTS}/min). Try again later."
        )

    # User existence check
    if not await database.user_exists(request.userId):
        raise HTTPException(status_code=404, detail=f"User '{request.userId}' not found")

    # Create transaction
    try:
        txn = await database.create_transaction(
            user_id=request.userId,
            txn_type=request.type,
            amount=request.amount,
            description=request.description,
            idempotency_key=request.idempotencyKey,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Handle concurrent duplicate (UNIQUE constraint race condition)
        if "unique" in str(e).lower() or "duplicate" in str(e).lower():
            existing = await database.get_transaction_by_idempotency_key(request.idempotencyKey)
            if existing:
                return JSONResponse(
                    status_code=200,
                    content=_format_txn(existing, "Duplicate request (concurrent)")
                )
        raise HTTPException(status_code=500, detail="Internal server error")

    response_data = _format_txn(txn, "Transaction created successfully")
    await redis_client.cache_response(request.idempotencyKey, response_data)
    return response_data


@app.get("/api/summary/{user_id}")
async def get_summary(user_id: str):
    if not user_id or len(user_id) > 50:
        raise HTTPException(status_code=400, detail="Invalid user ID")

    summary = await database.get_user_summary(user_id)
    if summary is None:
        raise HTTPException(status_code=404, detail=f"User '{user_id}' not found")

    return SummaryResponse(
        userId=summary['user_id'],
        name=summary['name'],
        totalEarned=round(float(summary['total_earned']), 2),
        totalSpent=round(float(summary['total_spent']), 2),
        netBalance=round(float(summary['net_balance']), 2),
        transactionCount=int(summary['transaction_count']),
        lastTransactionAt=(
            summary['last_transaction_at'].isoformat() + "Z"
            if summary['last_transaction_at'] else None
        ),
    )


@app.get("/api/ranking")
async def get_ranking():
    """Return ranked leaderboard, cached in Redis for 30s."""
    cached_ranking, cached_at = await redis_client.get_cached_ranking()
    if cached_ranking:
        return RankingResponse(
            rankings=[RankingEntry(**e) for e in cached_ranking],
            cachedAt=cached_at,
            cacheTtlSeconds=redis_client.RANKING_CACHE_TTL,
        )

    summaries = await database.get_all_summaries()
    ranking_data = calculate_rankings(summaries)
    cached_at = await redis_client.cache_ranking(ranking_data)

    return RankingResponse(
        rankings=[RankingEntry(**e) for e in ranking_data],
        cachedAt=cached_at,
        cacheTtlSeconds=redis_client.RANKING_CACHE_TTL,
    )


# -- Helpers --

def _format_txn(txn: dict, message: str) -> dict:
    return {
        "id": str(txn['id']),
        "userId": txn['user_id'],
        "type": txn['type'],
        "amount": float(txn['amount']),
        "description": txn.get('description'),
        "idempotencyKey": txn['idempotency_key'],
        "createdAt": txn['created_at'].isoformat() + "Z" if hasattr(txn['created_at'], 'isoformat') else str(txn['created_at']),
        "message": message,
    }


# -- Serve React frontend --

FRONTEND_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")

if os.path.isdir(FRONTEND_DIR):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIR, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        file_path = os.path.join(FRONTEND_DIR, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))
else:
    @app.get("/")
    async def root():
        return {"message": "Transaction Ranking System API", "docs": "/docs"}


@app.exception_handler(422)
async def validation_error_handler(request: Request, exc):
    return JSONResponse(status_code=422, content={"error": "Validation Error", "detail": str(exc)})
