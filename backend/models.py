from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import re


class TransactionRequest(BaseModel):
    userId: str = Field(..., min_length=1, max_length=50)
    type: str = Field(...)
    amount: float = Field(..., gt=0, le=10000)
    description: Optional[str] = Field(None, max_length=255)
    idempotencyKey: str = Field(..., min_length=1, max_length=100)

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        if v not in ("earn", "spend"):
            raise ValueError("type must be 'earn' or 'spend'")
        return v

    @field_validator("userId")
    @classmethod
    def validate_user_id(cls, v):
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError("userId must be alphanumeric with hyphens/underscores")
        return v

    @field_validator("idempotencyKey")
    @classmethod
    def validate_idempotency_key(cls, v):
        if not re.match(r'^[a-zA-Z0-9_\-\.]+$', v):
            raise ValueError("idempotencyKey contains invalid characters")
        return v

    @field_validator("description")
    @classmethod
    def sanitize_description(cls, v):
        if v is not None:
            v = re.sub(r'<[^>]+>', '', v).strip()
        return v


class TransactionResponse(BaseModel):
    id: str
    userId: str
    type: str
    amount: float
    description: Optional[str]
    idempotencyKey: str
    createdAt: str
    message: str


class SummaryResponse(BaseModel):
    userId: str
    name: str
    totalEarned: float
    totalSpent: float
    netBalance: float
    transactionCount: int
    lastTransactionAt: Optional[str]


class RankingEntry(BaseModel):
    rank: int
    userId: str
    name: str
    score: float
    netBalance: float
    transactionCount: int
    avgTransactionValue: float


class RankingResponse(BaseModel):
    rankings: List[RankingEntry]
    cachedAt: Optional[str] = None
    cacheTtlSeconds: int = 30


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
