"""
Archive service: automatically archive requests older than 30 days (FZ-152).
Sends notifications 3 days before archiving.
Runs as a background task (scheduled via APScheduler).
"""
import logging
from datetime import datetime, timedelta, timezone

from core.config import settings
from core.database import col_requests, col_notifications, col_users
from core.audit_logger import audit_log, AuditAction

logger = logging.getLogger(__name__)


async def check_and_notify_archive() -> None:
    """
    Find requests approaching the 30-day limit and send warnings.
    Scheduled to run daily.
    """
    notify_threshold = datetime.now(timezone.utc) - timedelta(
        days=settings.REQUEST_ARCHIVE_DAYS - settings.REQUEST_ARCHIVE_NOTIFY_BEFORE_DAYS
    )
    archive_threshold = datetime.now(timezone.utc) - timedelta(days=settings.REQUEST_ARCHIVE_DAYS)

    # Find requests that will be archived in N days and haven't been notified yet
    cursor = col_requests().find({
        "created_at": {"$lte": notify_threshold, "$gt": archive_threshold},
        "is_archived": False,
        "archive_notify_sent": False,
    })

    notified = 0
    async for req in cursor:
        days_left = (
            (req["created_at"] + timedelta(days=settings.REQUEST_ARCHIVE_DAYS))
            - datetime.now(timezone.utc)
        ).days

        notif = {
            "user_id": req["user_id"],
            "title": "Заявка будет удалена",
            "body": (
                f"Заявка #{req['request_number']} будет архивирована через {days_left} дн. "
                f"Скачайте необходимые документы заранее."
            ),
            "type": "archive_warning",
            "is_read": False,
            "related_id": str(req["_id"]),
            "created_at": datetime.now(timezone.utc),
        }
        await col_notifications().insert_one(notif)
        await col_requests().update_one(
            {"_id": req["_id"]},
            {"$set": {"archive_notify_sent": True}},
        )
        notified += 1

    if notified:
        logger.info("Archive warning notifications sent: %d", notified)


async def run_archiving() -> None:
    """
    Archive (soft-delete) all requests older than REQUEST_ARCHIVE_DAYS.
    Scheduled to run daily.
    """
    threshold = datetime.now(timezone.utc) - timedelta(days=settings.REQUEST_ARCHIVE_DAYS)

    cursor = col_requests().find({
        "created_at": {"$lte": threshold},
        "is_archived": False,
    })

    archived = 0
    async for req in cursor:
        await col_requests().update_one(
            {"_id": req["_id"]},
            {
                "$set": {
                    "is_archived": True,
                    "status": "archived",
                    "archived_at": datetime.now(timezone.utc),
                }
            },
        )
        await audit_log(
            AuditAction.REQUEST_ARCHIVED,
            user_id=req["user_id"],
            resource_id=str(req["_id"]),
            resource_type="request",
            details={"request_number": req["request_number"]},
        )
        archived += 1

    if archived:
        logger.info("Requests archived: %d", archived)


async def run_daily_tasks() -> None:
    """Entry point for the daily scheduler."""
    logger.info("Running daily archive tasks...")
    await check_and_notify_archive()
    await run_archiving()
    logger.info("Daily archive tasks complete.")
