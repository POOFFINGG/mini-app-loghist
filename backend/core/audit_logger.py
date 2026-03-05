"""
FZ-152 Audit Logger — logs every action involving personal data.
Required by Federal Law No. 152-FZ "On Personal Data".
"""
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

from core.database import col_audit_logs


class AuditAction(str, Enum):
    # Auth
    USER_REGISTERED = "user.registered"
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    USER_PASSWORD_CHANGED = "user.password_changed"
    USER_DELETED = "user.deleted"

    # Personal data
    PERSONAL_DATA_VIEWED = "personal_data.viewed"
    PERSONAL_DATA_UPDATED = "personal_data.updated"
    PERSONAL_DATA_EXPORTED = "personal_data.exported"

    # Documents (FZ-152 sensitive)
    DOCUMENT_UPLOADED = "document.uploaded"
    DOCUMENT_VIEWED = "document.viewed"
    DOCUMENT_DELETED = "document.deleted"
    DOCUMENT_DOWNLOADED = "document.downloaded"

    # Requests
    REQUEST_CREATED = "request.created"
    REQUEST_UPDATED = "request.updated"
    REQUEST_DELETED = "request.deleted"
    REQUEST_ARCHIVED = "request.archived"

    # Drivers (passport data — sensitive PD)
    DRIVER_CREATED = "driver.created"
    DRIVER_UPDATED = "driver.updated"
    DRIVER_DELETED = "driver.deleted"

    # Counterparties (INN/KPP — legally significant)
    COUNTERPARTY_CREATED = "counterparty.created"
    COUNTERPARTY_UPDATED = "counterparty.updated"
    COUNTERPARTY_DELETED = "counterparty.deleted"

    # AI
    AI_QUERY = "ai.query"
    AI_OCR = "ai.ocr"

    # Webhook
    WEBHOOK_SENT = "webhook.sent"
    WEBHOOK_FAILED = "webhook.failed"


async def audit_log(
    action: AuditAction,
    user_id: Optional[str] = None,
    resource_id: Optional[str] = None,
    resource_type: Optional[str] = None,
    ip_address: Optional[str] = None,
    details: Optional[dict] = None,
    success: bool = True,
) -> None:
    """Write an immutable audit log entry to MongoDB."""
    entry = {
        "action": action.value,
        "user_id": user_id,
        "resource_id": resource_id,
        "resource_type": resource_type,
        "ip_address": ip_address,
        "details": details or {},
        "success": success,
        "created_at": datetime.now(timezone.utc),
        # FZ-152: record cannot be modified — no update_at field
    }
    try:
        await col_audit_logs().insert_one(entry)
    except Exception:
        # Never let audit logging break the main flow
        import logging
        logging.getLogger(__name__).error("Failed to write audit log: %s", entry, exc_info=True)
