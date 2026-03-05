from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from core.config import settings
import logging

logger = logging.getLogger(__name__)

_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


async def connect_db() -> None:
    global _client, _db
    _client = AsyncIOMotorClient(
        settings.MONGO_URI,
        serverSelectionTimeoutMS=5000,
        connectTimeoutMS=5000,
        maxPoolSize=50,
        minPoolSize=5,
    )
    _db = _client[settings.MONGO_DB]
    # Verify connection using app DB (loghist_app has no admin privileges)
    await _db.command("ping")
    logger.info("Connected to MongoDB: %s", settings.MONGO_DB)


async def close_db() -> None:
    global _client
    if _client:
        _client.close()
        logger.info("MongoDB connection closed")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_db() first.")
    return _db


# Collection accessors
def col_users():
    return get_db()["users"]

def col_requests():
    return get_db()["requests"]

def col_counterparties():
    return get_db()["counterparties"]

def col_drivers():
    return get_db()["drivers"]

def col_vehicles():
    return get_db()["vehicles"]

def col_documents():
    return get_db()["documents"]

def col_audit_logs():
    return get_db()["audit_logs"]

def col_ai_usage_logs():
    return get_db()["ai_usage_logs"]

def col_notifications():
    return get_db()["notifications"]

def col_tracking():
    return get_db()["tracking"]

def col_support_messages():
    return get_db()["support_messages"]
