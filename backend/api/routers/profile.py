"""Profile endpoints: view, update, avatar."""
from fastapi import APIRouter, Depends, Request, HTTPException, Body
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from core.database import col_users
from core.dependencies import get_current_user
from core.audit_logger import audit_log, AuditAction
from models.user import UserPublic, UpdateProfileRequest

router = APIRouter(prefix="/profile", tags=["Profile"])


def _get_ip(request: Request) -> str:
    fwd = request.headers.get("X-Forwarded-For")
    return fwd.split(",")[0].strip() if fwd else request.client.host


@router.get("/me", response_model=UserPublic)
async def get_me(request: Request, user: dict = Depends(get_current_user)):
    ip = _get_ip(request)
    await audit_log(
        AuditAction.PERSONAL_DATA_VIEWED,
        user_id=str(user["_id"]),
        resource_type="user",
        ip_address=ip,
    )
    return UserPublic.from_mongo(user)


@router.patch("/me", response_model=UserPublic)
async def update_profile(
    body: UpdateProfileRequest,
    request: Request,
    user: dict = Depends(get_current_user),
):
    ip = _get_ip(request)
    update_data = {}
    if body.personal:
        existing = user.get("personal") or {}
        update_data["personal"] = {**existing, **body.personal.model_dump(exclude_none=True)}
    if body.company:
        existing = user.get("company") or {}
        update_data["company"] = {**existing, **body.company.model_dump(exclude_none=True)}
    if body.bank:
        existing = user.get("bank") or {}
        update_data["bank"] = {**existing, **body.bank.model_dump(exclude_none=True)}
    if body.logistician:
        existing = user.get("logistician") or {}
        update_data["logistician"] = {**existing, **body.logistician.model_dump(exclude_none=True)}

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now(timezone.utc)
    await col_users().update_one({"_id": user["_id"]}, {"$set": update_data})

    await audit_log(
        AuditAction.PERSONAL_DATA_UPDATED,
        user_id=str(user["_id"]),
        resource_type="user",
        ip_address=ip,
        details={"fields": list(update_data.keys())},
    )

    updated = await col_users().find_one({"_id": user["_id"]})
    return UserPublic.from_mongo(updated)


VALID_PLANS = {"free", "pro", "enterprise"}
PLAN_DURATION_DAYS = {"free": None, "pro": 30, "enterprise": 30}


@router.patch("/subscription", response_model=UserPublic)
async def update_subscription(
    body: dict = Body(...),
    user: dict = Depends(get_current_user),
):
    plan = body.get("plan", "")
    if plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail="Недопустимый тариф")

    days = PLAN_DURATION_DAYS[plan]
    expires = datetime.now(timezone.utc) + timedelta(days=days) if days else None

    await col_users().update_one(
        {"_id": user["_id"]},
        {"$set": {
            "subscription_plan": plan,
            "subscription_expires": expires,
            "updated_at": datetime.now(timezone.utc),
        }},
    )
    updated = await col_users().find_one({"_id": user["_id"]})
    return UserPublic.from_mongo(updated)
