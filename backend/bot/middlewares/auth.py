"""Middleware: attach user document from MongoDB by Telegram ID."""
from typing import Any, Awaitable, Callable, Dict

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject

from core.database import col_users


class UserMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, Dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: Dict[str, Any],
    ) -> Any:
        telegram_user = data.get("event_from_user")
        if telegram_user:
            db_user = await col_users().find_one({"telegram_id": telegram_user.id})
            data["db_user"] = db_user  # None if not registered
        return await handler(event, data)
