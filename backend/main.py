"""
LogHist Backend — FastAPI entry point.

Starts:
- FastAPI REST API (all routers)
- aiogram Telegram bot (webhook mode)
- APScheduler for daily archive tasks
- MongoDB connection pool
"""
import logging
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from core.config import settings
from core.database import connect_db, close_db
from api.routers import auth, profile, requests, database_router, tracking, notifications, analytics, webhooks, support
from bot.main import create_bot, create_dispatcher, setup_webhook, remove_webhook
from api.routers.webhooks import set_bot_dispatcher
from services.archive_service import run_daily_tasks

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler(timezone="Europe/Moscow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──────────────────────────────────────────────────────────────
    logger.info("Starting LogHist API v%s", settings.APP_VERSION)

    await connect_db()

    # Telegram bot (optional — requires token in .env)
    bot = None
    if settings.TELEGRAM_BOT_TOKEN:
        bot = create_bot()
        dp = create_dispatcher()
        set_bot_dispatcher(bot, dp)
        if settings.TELEGRAM_WEBHOOK_HOST:
            await setup_webhook(bot)
        else:
            logger.warning("TELEGRAM_WEBHOOK_HOST not set — webhook not registered")
    else:
        logger.warning("TELEGRAM_BOT_TOKEN not set — bot disabled")

    # Scheduler: archive check daily at 03:00 Moscow time
    scheduler.add_job(run_daily_tasks, "cron", hour=3, minute=0, id="daily_archive")
    scheduler.start()
    logger.info("Scheduler started")

    yield

    # ── Shutdown ─────────────────────────────────────────────────────────────
    scheduler.shutdown(wait=False)
    if bot:
        if settings.TELEGRAM_WEBHOOK_HOST:
            await remove_webhook(bot)
        await bot.session.close()
    await close_db()
    logger.info("LogHist API stopped")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs" if settings.DEBUG else None,  # hide Swagger in production
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# ── Middleware ────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# FZ-152: only allow requests from known hosts
# app.add_middleware(TrustedHostMiddleware, allowed_hosts=["yourdomain.ru", "localhost"])

# ── Routers ──────────────────────────────────────────────────────────────────

API_PREFIX = "/api/v1"

app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(profile.router, prefix=API_PREFIX)
app.include_router(requests.router, prefix=API_PREFIX)
app.include_router(database_router.router, prefix=API_PREFIX)
app.include_router(tracking.router, prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(analytics.router, prefix=API_PREFIX)
app.include_router(support.router, prefix=API_PREFIX)
app.include_router(webhooks.router)  # /webhook/telegram — no prefix


@app.get("/health")
async def health():
    return {"status": "ok", "version": settings.APP_VERSION}
