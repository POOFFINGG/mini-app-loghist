"""Analytics models for the owner's AI usage dashboard."""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from models.common import MongoBase


class AiUsageLog(MongoBase):
    user_id: str
    action: str  # "parse_text" | "parse_image" | "ocr" | "chat"
    model: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0
    latency_ms: int = 0
    success: bool = True
    error: Optional[str] = None
    created_at: datetime


class AiUsageSummary(BaseModel):
    period: str  # "today" | "week" | "month"
    total_requests: int
    successful_requests: int
    failed_requests: int
    total_tokens: int
    total_cost_usd: float
    avg_latency_ms: float
    by_action: dict  # action -> count
    by_user: List[dict]  # [{user_id, count, tokens, cost}]
    daily_breakdown: List[dict]  # [{date, requests, tokens, cost}]


class RequestStats(BaseModel):
    total: int
    by_status: dict
    created_today: int
    created_week: int
    created_month: int
    archived: int


class GeneralAnalytics(BaseModel):
    total_users: int
    active_users_today: int
    active_users_week: int
    request_stats: RequestStats
    ai_usage: AiUsageSummary
    top_routes: List[dict]
    total_revenue_rub: float
