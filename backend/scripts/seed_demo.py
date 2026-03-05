"""
Создаёт демо-пользователя в MongoDB.
Запуск: python seed_demo.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from core.security import hash_password
from core.config import settings

DEMO_EMAIL = "logist@demo.ru"
DEMO_PASSWORD = "Demo1234!"
DEMO_PHONE = "+79000000000"

async def main():
    client = AsyncIOMotorClient(settings.MONGO_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.MONGO_DB]

    existing = await db.users.find_one({"email": DEMO_EMAIL})
    if existing:
        print(f"Пользователь {DEMO_EMAIL} уже существует")
        client.close()
        return

    user_doc = {
        "email": DEMO_EMAIL,
        "phone": DEMO_PHONE,
        "password_hash": hash_password(DEMO_PASSWORD),
        "personal": {
            "first_name": "Демо",
            "last_name": "Пользователь",
            "patronymic": "",
        },
        "company": None,
        "bank": None,
        "logistician": None,
        "is_active": True,
        "is_blocked": False,
        "subscription_plan": "free",
        "pd_consent_given": True,
        "pd_consent_date": datetime.now(timezone.utc),
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    print(f"Создан пользователь: {DEMO_EMAIL} / {DEMO_PASSWORD}")
    print(f"ID: {result.inserted_id}")
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
