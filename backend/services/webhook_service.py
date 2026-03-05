"""
Webhook service: sends event notifications to a Russian HTTPS server.
FZ-152: all webhooks go to servers in the Russian Federation via HTTPS.
"""
import logging
import hmac
import hashlib
import json
from datetime import datetime, timezone
from typing import Optional

import httpx

from core.config import settings
from core.audit_logger import audit_log, AuditAction

logger = logging.getLogger(__name__)

WEBHOOK_URL = f"{settings.TELEGRAM_WEBHOOK_HOST}/internal/webhook"


def _sign_payload(payload: bytes) -> str:
    """HMAC-SHA256 signature for webhook payload verification."""
    return hmac.new(
        settings.TELEGRAM_WEBHOOK_SECRET.encode(),
        payload,
        hashlib.sha256,
    ).hexdigest()


async def send_webhook(
    event_type: str,
    data: dict,
    user_id: Optional[str] = None,
) -> bool:
    """
    POST an event to the configured Russian HTTPS webhook endpoint.
    Returns True on success.
    """
    payload = {
        "event": event_type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    signature = _sign_payload(body)

    try:
        async with httpx.AsyncClient(verify=True, timeout=10.0) as client:
            resp = await client.post(
                WEBHOOK_URL,
                content=body,
                headers={
                    "Content-Type": "application/json",
                    "X-Signature": signature,
                    "X-Event-Type": event_type,
                },
            )
            resp.raise_for_status()

        await audit_log(
            AuditAction.WEBHOOK_SENT,
            user_id=user_id,
            details={"event": event_type, "status": resp.status_code},
        )
        logger.info("Webhook sent: %s → %d", event_type, resp.status_code)
        return True

    except Exception as e:
        await audit_log(
            AuditAction.WEBHOOK_FAILED,
            user_id=user_id,
            details={"event": event_type, "error": str(e)},
            success=False,
        )
        logger.error("Webhook failed [%s]: %s", event_type, e)
        return False


# Convenience wrappers for common events
async def webhook_request_created(request_number: str, user_id: str, data: dict):
    await send_webhook("request.created", {"request_number": request_number, **data}, user_id)

async def webhook_request_status_changed(request_number: str, new_status: str, user_id: str):
    await send_webhook("request.status_changed", {
        "request_number": request_number,
        "status": new_status,
    }, user_id)

async def webhook_user_registered(user_id: str, email: str):
    await send_webhook("user.registered", {"user_id": user_id, "email": email}, user_id)
