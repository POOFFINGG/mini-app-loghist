"""User notifications endpoints."""
from bson import ObjectId
from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone

from core.database import col_notifications
from core.dependencies import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/")
async def list_notifications(
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: dict = Depends(get_current_user),
):
    user_id = str(user["_id"])
    q: dict = {"user_id": user_id}
    if unread_only:
        q["is_read"] = False
    docs = await col_notifications().find(q).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    result = []
    for d in docs:
        result.append({
            "id": str(d["_id"]),
            "user_id": d.get("user_id"),
            "title": d.get("title"),
            "message": d.get("message"),
            "type": d.get("type", "info"),
            "read": d.get("is_read", False),
            "request_id": d.get("request_id"),
            "created_at": d["created_at"].isoformat() if hasattr(d.get("created_at"), "isoformat") else str(d.get("created_at", "")),
        })
    return result


@router.post("/{notif_id}/read")
async def mark_read(notif_id: str, user: dict = Depends(get_current_user)):
    await col_notifications().update_one(
        {"_id": ObjectId(notif_id), "user_id": str(user["_id"])},
        {"$set": {"is_read": True}},
    )
    return {"status": "ok"}


@router.post("/read-all")
async def mark_all_read(user: dict = Depends(get_current_user)):
    await col_notifications().update_many(
        {"user_id": str(user["_id"]), "is_read": False},
        {"$set": {"is_read": True}},
    )
    return {"status": "ok"}


@router.get("/unread-count")
async def unread_count(user: dict = Depends(get_current_user)):
    count = await col_notifications().count_documents({"user_id": str(user["_id"]), "is_read": False})
    return {"count": count}
