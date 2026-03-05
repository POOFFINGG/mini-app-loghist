"""Support chat endpoints (user + admin)."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Body, HTTPException

from core.database import col_support_messages, col_users, col_notifications
from core.dependencies import get_current_user, get_admin_user
from bson import ObjectId

router = APIRouter(prefix="/support", tags=["Support"])

AUTO_REPLIES = [
    "Здравствуйте! Ваше обращение принято. Оператор ответит в ближайшее время.",
    "Спасибо за обращение! Мы рассмотрим ваш вопрос и ответим как можно скорее.",
    "Ваш запрос передан специалисту поддержки. Среднее время ответа — 15 минут.",
]
_auto_reply_idx: dict[str, int] = {}


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    if isinstance(doc.get("created_at"), datetime):
        doc["created_at"] = doc["created_at"].isoformat()
    return doc


# ── User endpoints ────────────────────────────────────────────────────────────

@router.get("/messages")
async def get_messages(user: dict = Depends(get_current_user)):
    cursor = col_support_messages().find(
        {"user_id": str(user["_id"])}
    ).sort("created_at", 1)
    docs = await cursor.to_list(length=200)
    return [_serialize(d) for d in docs]


@router.post("/messages")
async def send_message(
    body: dict = Body(...),
    user: dict = Depends(get_current_user),
):
    text = (body.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)

    user_msg = {
        "user_id": user_id,
        "role": "user",
        "text": text,
        "created_at": now,
        "read": False,
    }
    result = await col_support_messages().insert_one(user_msg)
    user_msg["id"] = str(result.inserted_id)
    del user_msg["_id"]
    user_msg["created_at"] = now.isoformat()

    # Auto-reply only if no real operator has responded yet
    op_count = await col_support_messages().count_documents(
        {"user_id": user_id, "role": "operator"}
    )
    user_count = await col_support_messages().count_documents(
        {"user_id": user_id, "role": "user"}
    )
    if op_count == 0 and user_count == 1:
        # First ever message — send welcome auto-reply
        idx = _auto_reply_idx.get(user_id, 0) % len(AUTO_REPLIES)
        _auto_reply_idx[user_id] = idx + 1
        reply_doc = {
            "user_id": user_id,
            "role": "operator",
            "text": AUTO_REPLIES[idx],
            "created_at": datetime.now(timezone.utc),
            "read": False,
        }
        await col_support_messages().insert_one(reply_doc)

    return user_msg


@router.post("/messages/read")
async def mark_read(user: dict = Depends(get_current_user)):
    await col_support_messages().update_many(
        {"user_id": str(user["_id"]), "role": "operator", "read": False},
        {"$set": {"read": True}},
    )
    return {"ok": True}


# ── Admin endpoints ───────────────────────────────────────────────────────────

@router.get("/admin/conversations")
async def admin_list_conversations(_admin: bool = Depends(get_admin_user)):
    """List all unique user conversations with last message and unread count."""
    pipeline = [
        {"$sort": {"created_at": -1}},
        {"$group": {
            "_id": "$user_id",
            "last_message": {"$first": "$text"},
            "last_role": {"$first": "$role"},
            "last_at": {"$first": "$created_at"},
            "unread": {
                "$sum": {
                    "$cond": [
                        {"$and": [
                            {"$eq": ["$role", "user"]},
                            {"$eq": ["$read", False]},
                        ]},
                        1, 0,
                    ]
                }
            },
        }},
        {"$sort": {"last_at": -1}},
    ]
    conversations = await col_support_messages().aggregate(pipeline).to_list(length=200)

    # Enrich with user info
    result = []
    for conv in conversations:
        user_id = conv["_id"]
        user_doc = None
        if ObjectId.is_valid(user_id):
            user_doc = await col_users().find_one({"_id": ObjectId(user_id)}, {"personal": 1, "logistician": 1, "company": 1})
        result.append({
            "user_id": user_id,
            "last_message": conv["last_message"],
            "last_role": conv["last_role"],
            "last_at": conv["last_at"].isoformat() if isinstance(conv["last_at"], datetime) else str(conv["last_at"]),
            "unread": conv["unread"],
            "user_name": (user_doc or {}).get("personal", {}).get("full_name") if user_doc else None,
            "user_company": (user_doc or {}).get("company", {}).get("name") if user_doc else None,
        })
    return result


@router.get("/admin/conversations/{user_id}")
async def admin_get_conversation(
    user_id: str,
    _admin: bool = Depends(get_admin_user),
):
    """Get all messages for a specific user conversation."""
    cursor = col_support_messages().find(
        {"user_id": user_id}
    ).sort("created_at", 1)
    docs = await cursor.to_list(length=500)
    # Mark user messages as read
    await col_support_messages().update_many(
        {"user_id": user_id, "role": "user", "read": False},
        {"$set": {"read": True}},
    )
    return [_serialize(d) for d in docs]


@router.post("/admin/conversations/{user_id}")
async def admin_send_message(
    user_id: str,
    body: dict = Body(...),
    _admin: bool = Depends(get_admin_user),
):
    """Send an operator message to a user."""
    text = (body.get("text") or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="Empty message")

    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "role": "operator",
        "text": text,
        "created_at": now,
        "read": False,
    }
    result = await col_support_messages().insert_one(doc)
    doc["id"] = str(result.inserted_id)
    del doc["_id"]
    doc["created_at"] = now.isoformat()

    # Create a notification for the user
    preview = text if len(text) <= 80 else text[:77] + "..."
    await col_notifications().insert_one({
        "user_id": user_id,
        "title": "Ответ от оператора",
        "message": preview,
        "type": "support",
        "is_read": False,
        "created_at": now,
    })

    return doc
