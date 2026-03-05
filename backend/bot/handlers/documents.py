"""Handle document uploads via Telegram for OCR + AI parsing."""
from aiogram import Router, F
from aiogram.types import Message

from services.ocr_service import run_ocr
from services.ai_service import parse_request_from_text

router = Router()


@router.message(F.photo)
async def handle_photo(message: Message, db_user: dict | None = None):
    """User sends a photo — run OCR and try to parse request data."""
    if not db_user:
        await message.answer("❌ Войдите в приложение для обработки документов.")
        return

    await message.answer("🔍 Анализирую изображение...")
    user_id = str(db_user["_id"])

    # Get highest-res photo
    photo = message.photo[-1]
    bot = message.bot
    file = await bot.get_file(photo.file_id)
    file_bytes = await bot.download_file(file.file_path)
    image_data = file_bytes.read()

    # OCR
    ocr_text = await run_ocr(image_data, "image/jpeg", user_id)

    if not ocr_text or len(ocr_text) < 10:
        await message.answer("❌ Не удалось распознать текст на изображении. Попробуйте более чёткое фото.")
        return

    await message.answer(f"📝 Распознанный текст:\n```\n{ocr_text[:500]}...\n```\n\nПытаюсь извлечь данные заявки...", parse_mode="Markdown")

    # AI parse
    try:
        parsed = await parse_request_from_text(user_id, ocr_text)
        lines = []
        if parsed.get("origin", {}).get("address"):
            lines.append(f"📍 Откуда: {parsed['origin']['address']}")
        if parsed.get("destination", {}).get("address"):
            lines.append(f"📍 Куда: {parsed['destination']['address']}")
        if parsed.get("cargo", {}).get("name"):
            lines.append(f"📦 Груз: {parsed['cargo']['name']}")
        if parsed.get("cargo", {}).get("weight_kg"):
            lines.append(f"⚖️ Вес: {parsed['cargo']['weight_kg']} кг")
        if parsed.get("payment", {}).get("rate"):
            lines.append(f"💰 Ставка: {parsed['payment']['rate']} ₽")

        if lines:
            await message.answer("✅ Извлечённые данные:\n" + "\n".join(lines) + "\n\nОткройте приложение для создания заявки.")
        else:
            await message.answer("ℹ️ Данные извлечены, но структура документа не распознана как заявка. Откройте приложение для ручного ввода.")
    except Exception as e:
        await message.answer("⚠️ Ошибка анализа документа. Попробуйте позже.")


@router.message(F.document)
async def handle_document(message: Message, db_user: dict | None = None):
    """Handle PDF or image document uploads."""
    if not db_user:
        await message.answer("❌ Войдите в приложение.")
        return

    doc = message.document
    if doc.mime_type not in {"image/jpeg", "image/png", "image/webp", "application/pdf"}:
        await message.answer("❌ Поддерживаются только изображения и PDF.")
        return

    await message.answer("📄 Получен документ. Откройте приложение для его загрузки и обработки.")
