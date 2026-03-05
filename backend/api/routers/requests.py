"""Logistics requests CRUD + AI parsing endpoints."""
import random
import string
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status, UploadFile, File

from core.database import col_requests
from core.dependencies import get_current_user, get_user_id
from core.audit_logger import audit_log, AuditAction
from models.request import (
    CreateRequestBody, UpdateRequestBody, RequestPublic,
    AiParseRequest, RequestStatus,
)
from services.ai_service import parse_request_from_text, parse_request_from_image
from services.webhook_service import webhook_request_created, webhook_request_status_changed

router = APIRouter(prefix="/requests", tags=["Requests"])


def _gen_number() -> str:
    prefix = "".join(random.choices(string.ascii_uppercase, k=4))
    suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=6))
    return f"{prefix}1-{suffix}"


def _get_ip(request: Request) -> str:
    fwd = request.headers.get("X-Forwarded-For")
    return fwd.split(",")[0].strip() if fwd else request.client.host


def _serialize(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


# ─── List ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=list[RequestPublic])
async def list_requests(
    status: Optional[str] = Query(None),
    archived: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user: dict = Depends(get_current_user),
):
    query: dict = {"user_id": str(user["_id"]), "is_archived": archived}
    if status:
        query["status"] = status

    cursor = col_requests().find(query).sort("created_at", -1).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return [RequestPublic.from_mongo(_serialize(d)) for d in docs]


# ─── Create ──────────────────────────────────────────────────────────────────

@router.post("/", response_model=RequestPublic, status_code=status.HTTP_201_CREATED)
async def create_request(
    body: CreateRequestBody,
    request: Request,
    user: dict = Depends(get_current_user),
):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    number = _gen_number()
    now = datetime.now(timezone.utc)

    doc = {
        "request_number": number,
        "user_id": user_id,
        "status": RequestStatus.PENDING.value,
        "transport_type": body.transport_type.value if body.transport_type else None,
        "counterparty": body.counterparty.model_dump() if body.counterparty else None,
        "origin": body.origin.model_dump() if body.origin else None,
        "destination": body.destination.model_dump() if body.destination else None,
        "waypoints": [w.model_dump() for w in body.waypoints],
        "cargo": body.cargo.model_dump() if body.cargo else None,
        "transport": body.transport.model_dump() if body.transport else None,
        "driver": body.driver.model_dump() if body.driver else None,
        "payment": body.payment.model_dump() if body.payment else None,
        "comments": body.comments,
        "documents": [],
        "ai_extracted": False,
        "progress_percent": 0,
        "archive_notify_sent": False,
        "is_archived": False,
        "created_at": now,
        "updated_at": now,
    }
    result = await col_requests().insert_one(doc)
    doc["_id"] = str(result.inserted_id)

    await audit_log(
        AuditAction.REQUEST_CREATED,
        user_id=user_id,
        resource_id=doc["_id"],
        resource_type="request",
        ip_address=ip,
        details={"number": number},
    )
    await webhook_request_created(number, user_id, {"status": "pending"})

    return RequestPublic.from_mongo(doc)


# ─── Get one ─────────────────────────────────────────────────────────────────

@router.get("/{request_id}", response_model=RequestPublic)
async def get_request(request_id: str, user: dict = Depends(get_current_user)):
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid ID")
    doc = await col_requests().find_one({"_id": ObjectId(request_id), "user_id": str(user["_id"])})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")
    return RequestPublic.from_mongo(_serialize(doc))


# ─── Update ──────────────────────────────────────────────────────────────────

@router.patch("/{request_id}", response_model=RequestPublic)
async def update_request(
    request_id: str,
    body: UpdateRequestBody,
    request: Request,
    user: dict = Depends(get_current_user),
):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await col_requests().find_one({"_id": ObjectId(request_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    update: dict = {"updated_at": datetime.now(timezone.utc)}
    data = body.model_dump(exclude_none=True)
    if "transport_type" in data and data["transport_type"]:
        data["transport_type"] = data["transport_type"].value if hasattr(data["transport_type"], "value") else data["transport_type"]
    if "status" in data and data["status"]:
        data["status"] = data["status"].value if hasattr(data["status"], "value") else data["status"]
    update.update(data)

    await col_requests().update_one({"_id": ObjectId(request_id)}, {"$set": update})

    if "status" in data:
        await webhook_request_status_changed(doc["request_number"], data["status"], user_id)

    await audit_log(
        AuditAction.REQUEST_UPDATED,
        user_id=user_id,
        resource_id=request_id,
        resource_type="request",
        ip_address=ip,
        details={"fields": list(data.keys())},
    )

    updated = await col_requests().find_one({"_id": ObjectId(request_id)})
    return RequestPublic.from_mongo(_serialize(updated))


# ─── Delete ──────────────────────────────────────────────────────────────────

@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_request(
    request_id: str,
    request: Request,
    user: dict = Depends(get_current_user),
):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await col_requests().find_one({"_id": ObjectId(request_id), "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    await col_requests().delete_one({"_id": ObjectId(request_id)})
    await audit_log(
        AuditAction.REQUEST_DELETED,
        user_id=user_id,
        resource_id=request_id,
        resource_type="request",
        ip_address=ip,
    )


# ─── Request history (audit log) ─────────────────────────────────────────────

@router.get("/{request_id}/history")
async def get_request_history(
    request_id: str,
    user: dict = Depends(get_current_user),
):
    """Return audit log entries for a specific request (most recent first)."""
    from core.database import col_audit_logs

    if not ObjectId.is_valid(request_id):
        raise HTTPException(status_code=400, detail="Invalid ID")

    doc = await col_requests().find_one(
        {"_id": ObjectId(request_id), "user_id": str(user["_id"])}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Request not found")

    cursor = col_audit_logs().find({"resource_id": request_id}).sort("created_at", -1)
    entries = await cursor.to_list(length=100)
    for e in entries:
        e["_id"] = str(e["_id"])
        if isinstance(e.get("created_at"), datetime):
            e["created_at"] = e["created_at"].isoformat()
    return entries


# ─── AI parse from text ──────────────────────────────────────────────────────

@router.post("/ai/parse-text")
async def ai_parse_text(
    body: AiParseRequest,
    user: dict = Depends(get_current_user),
):
    """Parse free-form text into request fields using ChatGPT."""
    user_id = str(user["_id"])
    result = await parse_request_from_text(user_id, body.text)
    return {"parsed": result}


# ─── AI parse from image/document ────────────────────────────────────────────

@router.post("/ai/parse-image")
async def ai_parse_image(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    """Extract request data from an uploaded document image using GPT-4o Vision."""
    allowed = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only images (JPEG/PNG/WEBP) and PDF allowed")

    data = await file.read()
    user_id = str(user["_id"])
    result = await parse_request_from_image(user_id, data, file.content_type)
    return {"parsed": result, "filename": file.filename}


# ─── AI chat ─────────────────────────────────────────────────────────────────

@router.post("/ai/chat")
async def ai_chat(
    body: dict,  # {"messages": [{"role": "user", "content": "..."}]}
    user: dict = Depends(get_current_user),
):
    """Logistics AI chat assistant."""
    from services.ai_service import logistics_chat
    messages = body.get("messages", [])
    if not messages:
        raise HTTPException(status_code=400, detail="messages required")
    reply = await logistics_chat(str(user["_id"]), messages)
    return {"reply": reply}
