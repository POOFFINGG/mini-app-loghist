"""FastAPI dependency injection helpers."""
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from core.security import decode_token
from core.database import col_users
from core.config import settings
from bson import ObjectId

bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer),
) -> dict:
    token = credentials.credentials
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

    user_id = payload.get("sub")
    user = await col_users().find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    if user.get("is_blocked"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is blocked")

    return user


async def get_admin_user(
    x_admin_key: str = Header(alias="X-Admin-Key"),
) -> bool:
    if x_admin_key != settings.ADMIN_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin key")
    return True


def get_user_id(user: dict = Depends(get_current_user)) -> str:
    return str(user["_id"])
