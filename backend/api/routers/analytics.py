"""
Analytics endpoints for the owner's admin panel.
Protected by X-Admin-Key header (not regular JWT).
"""
from datetime import datetime, timedelta, timezone
from typing import Optional
from calendar import month_abbr

from fastapi import APIRouter, Depends, Query

from core.database import col_users, col_requests, col_ai_usage_logs, col_audit_logs
from core.dependencies import get_admin_user, get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics (Admin)"])


def _date_range(period: str):
    now = datetime.now(timezone.utc)
    if period == "today":
        return now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        return now - timedelta(days=7)
    elif period == "month":
        return now - timedelta(days=30)
    return now - timedelta(days=30)


@router.get("/overview")
async def overview(_admin: bool = Depends(get_admin_user)):
    """High-level platform statistics."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=7)
    month_start = now - timedelta(days=30)

    total_users = await col_users().count_documents({})
    total_requests = await col_requests().count_documents({})
    requests_today = await col_requests().count_documents({"created_at": {"$gte": today_start}})
    requests_week = await col_requests().count_documents({"created_at": {"$gte": week_start}})
    requests_month = await col_requests().count_documents({"created_at": {"$gte": month_start}})
    archived = await col_requests().count_documents({"is_archived": True})

    # Requests by status
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    by_status_raw = await col_requests().aggregate(pipeline).to_list(20)
    by_status = {item["_id"]: item["count"] for item in by_status_raw}

    return {
        "users": {"total": total_users},
        "requests": {
            "total": total_requests,
            "today": requests_today,
            "week": requests_week,
            "month": requests_month,
            "archived": archived,
            "by_status": by_status,
        },
    }


@router.get("/ai-usage")
async def ai_usage(
    period: str = Query("month", regex="^(today|week|month)$"),
    _admin: bool = Depends(get_admin_user),
):
    """AI API usage statistics for cost tracking."""
    since = _date_range(period)

    pipeline_summary = [
        {"$match": {"created_at": {"$gte": since}}},
        {
            "$group": {
                "_id": None,
                "total_requests": {"$sum": 1},
                "successful": {"$sum": {"$cond": ["$success", 1, 0]}},
                "failed": {"$sum": {"$cond": ["$success", 0, 1]}},
                "total_tokens": {"$sum": "$total_tokens"},
                "total_cost_usd": {"$sum": "$cost_usd"},
                "avg_latency_ms": {"$avg": "$latency_ms"},
            }
        },
    ]
    summary_raw = await col_ai_usage_logs().aggregate(pipeline_summary).to_list(1)
    summary = summary_raw[0] if summary_raw else {
        "total_requests": 0, "successful": 0, "failed": 0,
        "total_tokens": 0, "total_cost_usd": 0.0, "avg_latency_ms": 0,
    }
    summary.pop("_id", None)

    # By action
    by_action_raw = await col_ai_usage_logs().aggregate([
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": "$action", "count": {"$sum": 1}, "tokens": {"$sum": "$total_tokens"}, "cost": {"$sum": "$cost_usd"}}},
    ]).to_list(20)
    by_action = {item["_id"]: {"count": item["count"], "tokens": item["tokens"], "cost": round(item["cost"], 4)} for item in by_action_raw}

    # By user (top 10)
    by_user_raw = await col_ai_usage_logs().aggregate([
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": "$user_id", "count": {"$sum": 1}, "tokens": {"$sum": "$total_tokens"}, "cost": {"$sum": "$cost_usd"}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]).to_list(10)

    # Daily breakdown
    daily_raw = await col_ai_usage_logs().aggregate([
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "requests": {"$sum": 1},
            "tokens": {"$sum": "$total_tokens"},
            "cost": {"$sum": "$cost_usd"},
        }},
        {"$sort": {"_id": 1}},
    ]).to_list(100)

    return {
        "period": period,
        "summary": summary,
        "by_action": by_action,
        "top_users": [{"user_id": u["_id"], "count": u["count"], "tokens": u["tokens"], "cost": round(u["cost"], 4)} for u in by_user_raw],
        "daily": [{"date": d["_id"], "requests": d["requests"], "tokens": d["tokens"], "cost": round(d["cost"], 4)} for d in daily_raw],
    }


@router.get("/audit-logs")
async def audit_logs(
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    since: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    _admin: bool = Depends(get_admin_user),
):
    """FZ-152 audit log viewer."""
    q: dict = {}
    if user_id:
        q["user_id"] = user_id
    if action:
        q["action"] = action
    if since:
        q["created_at"] = {"$gte": datetime.fromisoformat(since)}

    docs = await col_audit_logs().find(q).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for d in docs:
        d["_id"] = str(d["_id"])
    return {"logs": docs, "count": len(docs)}


@router.get("/top-routes")
async def top_routes(
    limit: int = Query(10, ge=1, le=50),
    _admin: bool = Depends(get_admin_user),
):
    """Most popular routes."""
    pipeline = [
        {"$match": {"origin.address": {"$exists": True}, "destination.address": {"$exists": True}}},
        {
            "$group": {
                "_id": {
                    "from": "$origin.address",
                    "to": "$destination.address",
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    raw = await col_requests().aggregate(pipeline).to_list(limit)
    return [{"from": r["_id"]["from"], "to": r["_id"]["to"], "count": r["count"]} for r in raw]


# ── User analytics (JWT-protected) ────────────────────────────────────────────

MONTH_RU = ["", "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
            "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"]

STATUS_RU = {
    "pending":          "Ожидает",
    "confirmed":        "Подтверждена",
    "in_transit":       "В пути",
    "delivered":        "Доставлена",
    "awaiting_payment": "Ожидает оплаты",
    "paid":             "Оплачена",
    "cancelled":        "Отменена",
    "archived":         "В архиве",
}

STATUS_COLOR = {
    "pending":          "#94a3b8",
    "confirmed":        "#00b3f2",
    "in_transit":       "#3b82f6",
    "delivered":        "#10b981",
    "awaiting_payment": "#f59e0b",
    "paid":             "#22c55e",
    "cancelled":        "#ef4444",
    "archived":         "#64748b",
}


def _naive(dt: datetime) -> datetime:
    """Strip timezone info so we can compare with MongoDB naive datetimes."""
    return dt.replace(tzinfo=None)


def _doc_dt(d: dict) -> datetime | None:
    """Get created_at from doc as naive datetime, or None."""
    v = d.get("created_at")
    if not v:
        return None
    if hasattr(v, "tzinfo") and v.tzinfo is not None:
        return v.replace(tzinfo=None)
    return v


@router.get("/user")
async def user_analytics(user: dict = Depends(get_current_user)):
    """Analytics for the current user's own requests."""
    user_id = str(user["_id"])
    now = _naive(datetime.now(timezone.utc))

    all_docs = await col_requests().find({"user_id": user_id}).to_list(length=10000)

    # Normalize created_at to naive UTC so comparisons work regardless of storage format
    for d in all_docs:
        v = d.get("created_at")
        if isinstance(v, datetime) and v.tzinfo is not None:
            d["created_at"] = v.replace(tzinfo=None)

    total = len(all_docs)

    # Growth: compare this month vs last month
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)

    def has_dt(d, start, end=None):
        v = d.get("created_at")
        if not isinstance(v, datetime):
            return False
        return (v >= start) if end is None else (start <= v < end)

    this_month = sum(1 for d in all_docs if has_dt(d, this_month_start))
    last_month = sum(1 for d in all_docs if has_dt(d, last_month_start, this_month_start))
    growth = round(((this_month - last_month) / last_month * 100) if last_month else 0)

    # Revenue
    total_revenue = sum((d.get("payment") or {}).get("rate") or 0 for d in all_docs)
    paid_docs = [d for d in all_docs if d.get("status") == "paid"]
    paid_revenue = sum((d.get("payment") or {}).get("rate") or 0 for d in paid_docs)

    # Revenue growth (this vs last month)
    rev_this = sum((d.get("payment") or {}).get("rate") or 0 for d in all_docs if has_dt(d, this_month_start))
    rev_last = sum((d.get("payment") or {}).get("rate") or 0 for d in all_docs if has_dt(d, last_month_start, this_month_start))
    rev_growth = round(((rev_this - rev_last) / rev_last * 100) if rev_last else 0)

    # Monthly dynamics (last 6 months)
    monthly = {}
    for i in range(5, -1, -1):
        m_start = (now.replace(day=1) - timedelta(days=i * 30)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        m_end = (m_start + timedelta(days=32)).replace(day=1)
        label = MONTH_RU[m_start.month]
        monthly[label] = {
            "requests": sum(1 for d in all_docs if has_dt(d, m_start, m_end)),
            "revenue": sum((d.get("payment") or {}).get("rate") or 0 for d in all_docs if has_dt(d, m_start, m_end)),
        }

    # Status breakdown
    status_counts: dict = {}
    for d in all_docs:
        s = d.get("status", "pending")
        status_counts[s] = status_counts.get(s, 0) + 1

    status_data = [
        {
            "name": STATUS_RU.get(s, s),
            "value": cnt,
            "color": STATUS_COLOR.get(s, "#94a3b8"),
        }
        for s, cnt in sorted(status_counts.items(), key=lambda x: -x[1])
    ]

    # Top routes (top 5 by count)
    route_counts: dict = {}
    for d in all_docs:
        orig = (d.get("origin") or {}).get("address", "")
        dest = (d.get("destination") or {}).get("address", "")
        if orig and dest:
            short_orig = orig.split(",")[0].strip()[:12]
            short_dest = dest.split(",")[0].strip()[:12]
            key = f"{short_orig} → {short_dest}"
            route_counts[key] = route_counts.get(key, 0) + 1

    top_routes = sorted(route_counts.items(), key=lambda x: -x[1])[:5]
    max_route = top_routes[0][1] if top_routes else 1

    return {
        "total": total,
        "growth": growth,
        "revenue": total_revenue,
        "paid_revenue": paid_revenue,
        "rev_growth": rev_growth,
        "monthly": [{"name": k, "requests": v["requests"], "revenue": v["revenue"]} for k, v in monthly.items()],
        "status_data": status_data,
        "top_routes": [{"name": r[0], "count": r[1], "pct": round(r[1] / max_route * 100)} for r in top_routes],
    }
