"""Bot handlers for quick request actions via Telegram."""
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command

from core.database import col_requests

router = Router()


@router.message(Command("requests"))
async def cmd_requests(message: Message, db_user: dict | None = None):
    if not db_user:
        await message.answer("❌ Вы не зарегистрированы. Откройте приложение для входа.")
        return

    user_id = str(db_user["_id"])
    cursor = col_requests().find({"user_id": user_id, "is_archived": False}).sort("created_at", -1).limit(5)
    requests = await cursor.to_list(5)

    if not requests:
        await message.answer("У вас нет активных заявок.")
        return

    text = "📋 *Ваши последние заявки:*\n\n"
    for req in requests:
        status_emoji = {
            "pending": "⏳", "confirmed": "✅", "in_transit": "🚛",
            "delivered": "📦", "awaiting_payment": "💳", "cancelled": "❌",
        }.get(req.get("status", ""), "📄")

        origin = (req.get("origin") or {}).get("address", "—")
        dest = (req.get("destination") or {}).get("address", "—")
        text += (
            f"{status_emoji} *{req['request_number']}*\n"
            f"   {origin} → {dest}\n"
            f"   Статус: {req.get('status', '—')}\n\n"
        )

    await message.answer(text, parse_mode="Markdown")


@router.message(Command("status"))
async def cmd_status(message: Message, db_user: dict | None = None):
    """Check status of a specific request: /status DPPO1-OTKA560"""
    if not db_user:
        await message.answer("❌ Войдите в приложение.")
        return

    parts = message.text.split(maxsplit=1)
    if len(parts) < 2:
        await message.answer("Использование: /status НОМЕР_ЗАЯВКИ")
        return

    number = parts[1].strip()
    req = await col_requests().find_one({"request_number": number, "user_id": str(db_user["_id"])})
    if not req:
        await message.answer(f"Заявка {number} не найдена.")
        return

    origin = (req.get("origin") or {}).get("address", "—")
    dest = (req.get("destination") or {}).get("address", "—")
    cargo_name = (req.get("cargo") or {}).get("name", "—")
    progress = req.get("progress_percent", 0)

    text = (
        f"📦 *Заявка {req['request_number']}*\n\n"
        f"Маршрут: {origin} → {dest}\n"
        f"Груз: {cargo_name}\n"
        f"Статус: {req.get('status', '—')}\n"
        f"Прогресс: {progress}%\n"
    )
    await message.answer(text, parse_mode="Markdown")
