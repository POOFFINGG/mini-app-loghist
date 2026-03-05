"""Bot /start handler — shows mini-app button."""
from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo

from core.config import settings

router = Router()

WEBAPP_URL = f"{settings.TELEGRAM_WEBHOOK_HOST}"  # Your mini-app URL


@router.message(CommandStart())
async def cmd_start(message: Message, db_user: dict | None = None):
    name = message.from_user.first_name or "Логист"

    if db_user:
        text = (
            f"Добро пожаловать, {name}! 🚛\n\n"
            f"Вы авторизованы как {db_user.get('email', '')}.\n"
            f"Откройте приложение для управления заявками."
        )
    else:
        text = (
            f"Привет, {name}! 👋\n\n"
            f"LogHist — платформа для управления логистическими заявками.\n"
            f"Откройте приложение для регистрации и начала работы."
        )

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚛 Открыть LogHist",
                    web_app=WebAppInfo(url=WEBAPP_URL),
                )
            ]
        ]
    )
    await message.answer(text, reply_markup=keyboard)
