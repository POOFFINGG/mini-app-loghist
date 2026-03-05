"""
aiogram bot setup. Called from FastAPI lifespan to register webhook.
"""
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

from core.config import settings
from bot.middlewares.auth import UserMiddleware
from bot.handlers import start, requests, documents

logger = logging.getLogger(__name__)


def create_bot() -> Bot:
    return Bot(
        token=settings.TELEGRAM_BOT_TOKEN,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )


def create_dispatcher() -> Dispatcher:
    dp = Dispatcher()
    dp.update.middleware(UserMiddleware())

    # Register routers
    dp.include_router(start.router)
    dp.include_router(requests.router)
    dp.include_router(documents.router)

    return dp


async def setup_webhook(bot: Bot) -> None:
    webhook_url = f"{settings.TELEGRAM_WEBHOOK_HOST}{settings.TELEGRAM_WEBHOOK_PATH}"
    await bot.set_webhook(
        url=webhook_url,
        secret_token=settings.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates=["message", "callback_query", "inline_query"],
        drop_pending_updates=True,
    )
    info = await bot.get_webhook_info()
    logger.info("Telegram webhook set: %s (pending: %d)", info.url, info.pending_update_count)


async def remove_webhook(bot: Bot) -> None:
    await bot.delete_webhook(drop_pending_updates=True)
    logger.info("Telegram webhook removed")
