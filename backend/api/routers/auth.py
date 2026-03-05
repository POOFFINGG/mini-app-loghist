"""Authentication endpoints: register, login, refresh, logout, change-password."""
from fastapi import APIRouter, HTTPException, Request, status, Depends
from bson import ObjectId
from datetime import datetime, timezone
import re

from core.database import col_users
from core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from core.audit_logger import audit_log, AuditAction
from core.dependencies import get_current_user
from models.user import RegisterRequest, LoginRequest, TokenResponse, RefreshRequest, UserPublic, ChangePasswordRequest
from services.webhook_service import webhook_user_registered

router = APIRouter(prefix="/auth", tags=["Auth"])


def _get_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    return forwarded.split(",")[0].strip() if forwarded else request.client.host


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, request: Request):
    ip = _get_ip(request)
    email = body.email.lower().strip()

    # Check duplicate email
    if await col_users().find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")

    user_doc = {
        "email": email,
        "phone": body.phone,
        "password_hash": hash_password(body.password),
        "personal": body.personal.model_dump() if body.personal else None,
        "company": body.company.model_dump() if body.company else None,
        "bank": body.bank.model_dump() if body.bank else None,
        "logistician": body.logistician.model_dump() if body.logistician else None,
        "is_active": True,
        "is_blocked": False,
        "subscription_plan": "free",
        "pd_consent_given": body.pd_consent,
        "pd_consent_date": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    result = await col_users().insert_one(user_doc)
    user_id = str(result.inserted_id)

    await audit_log(AuditAction.USER_REGISTERED, user_id=user_id, ip_address=ip, details={"email": email})
    await webhook_user_registered(user_id, email)

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request):
    ip = _get_ip(request)
    login_val = body.login.strip().lower()

    # Allow login by email or phone
    query = {"email": login_val} if "@" in login_val else {"phone": login_val}
    user = await col_users().find_one(query)

    if not user or not verify_password(body.password, user["password_hash"]):
        await audit_log(AuditAction.USER_LOGIN, ip_address=ip, details={"login": login_val}, success=False)
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    if user.get("is_blocked"):
        raise HTTPException(status_code=403, detail="Аккаунт заблокирован")

    user_id = str(user["_id"])
    await audit_log(AuditAction.USER_LOGIN, user_id=user_id, ip_address=ip, success=True)

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload["sub"]
    user = await col_users().find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
    )


@router.post("/logout")
async def logout(request: Request, user: dict = Depends(get_current_user)):
    ip = _get_ip(request)
    await audit_log(AuditAction.USER_LOGOUT, user_id=str(user["_id"]), ip_address=ip)
    return {"message": "Logged out"}


@router.post("/change-password")
async def change_password(
    body: ChangePasswordRequest,
    request: Request,
    user: dict = Depends(get_current_user),
):
    ip = _get_ip(request)
    if not verify_password(body.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")

    new_hash = hash_password(body.new_password)
    await col_users().update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc)}},
    )
    await audit_log(AuditAction.USER_PASSWORD_CHANGED, user_id=str(user["_id"]), ip_address=ip)
    return {"message": "Пароль изменён"}
