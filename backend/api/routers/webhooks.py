"""
Telegram bot webhook receiver endpoint.
Telegram sends updates to this URL over HTTPS.
"""
import hashlib
import hmac
import logging

from aiogram import Bot, Dispatcher
from aiogram.types import Update
from fastapi import APIRouter, Header, HTTPException, Request

from core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Webhooks"])

# Bot & Dispatcher are initialized in main.py and injected here
_bot: Bot | None = None
_dp: Dispatcher | None = None


def set_bot_dispatcher(bot: Bot, dp: Dispatcher):
    global _bot, _dp
    _bot = bot
    _dp = dp


@router.post(settings.TELEGRAM_WEBHOOK_PATH)
async def telegram_webhook(
    request: Request,
    x_telegram_bot_api_secret_token: str | None = Header(default=None),
):
    """Receive Telegram updates via webhook."""
    # Verify secret token
    if x_telegram_bot_api_secret_token != settings.TELEGRAM_WEBHOOK_SECRET:
        logger.warning("Invalid Telegram webhook secret")
        raise HTTPException(status_code=403, detail="Forbidden")

    body = await request.json()
    if _dp is None or _bot is None:
        raise HTTPException(status_code=503, detail="Bot not initialized")

    update = Update(**body)
    await _dp.feed_update(_bot, update)
    return {"ok": True}
