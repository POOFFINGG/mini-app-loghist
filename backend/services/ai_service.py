"""
ChatGPT API service for:
1. Parsing free-text logistics descriptions into structured request fields
2. Answering logistics questions (assistant chat)
3. Extracting data from document images (vision)
"""
import base64
import time
import logging
from typing import Optional
from openai import AsyncOpenAI
from core.config import settings
from core.database import col_ai_usage_logs
from datetime import datetime, timezone

logger = logging.getLogger(__name__)
_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _client


async def _log_usage(
    user_id: str,
    action: str,
    model: str,
    usage,
    latency_ms: int,
    success: bool,
    error: Optional[str] = None,
):
    # GPT-4o pricing (approx)
    cost_per_1k_input = 0.005
    cost_per_1k_output = 0.015
    cost = (
        (usage.prompt_tokens / 1000) * cost_per_1k_input
        + (usage.completion_tokens / 1000) * cost_per_1k_output
    ) if usage else 0.0

    await col_ai_usage_logs().insert_one({
        "user_id": user_id,
        "action": action,
        "model": model,
        "prompt_tokens": usage.prompt_tokens if usage else 0,
        "completion_tokens": usage.completion_tokens if usage else 0,
        "total_tokens": usage.total_tokens if usage else 0,
        "cost_usd": round(cost, 6),
        "latency_ms": latency_ms,
        "success": success,
        "error": error,
        "created_at": datetime.now(timezone.utc),
    })


PARSE_REQUEST_SYSTEM = """
Ты — ИИ-ассистент логистической платформы LogHist.
Извлеки из текста пользователя данные для создания заявки на перевозку.
Верни ответ строго в формате JSON без дополнительных пояснений.

Структура JSON:
{
  "transport_type": "FTL" | "LTL" | "Combined" | null,
  "counterparty": {"name": string|null, "inn": string|null},
  "origin": {"address": string|null, "contact_name": string|null, "contact_phone": string|null, "date": string|null, "time": string|null},
  "destination": {"address": string|null, "contact_name": string|null, "contact_phone": string|null, "date": string|null, "time": string|null},
  "cargo": {"name": string|null, "package_type": string|null, "weight_kg": number|null, "volume_m3": number|null, "quantity": number|null, "temperature_regime": string|null, "special_conditions": string|null},
  "transport": {"type": string|null, "brand": string|null, "truck_plate": string|null, "trailer_plate": string|null},
  "driver": {"full_name": string|null, "phone": string|null},
  "payment": {"rate": number|null, "currency": "RUB", "payment_terms": string|null, "vat_included": boolean, "payment_method": string|null},
  "comments": string|null
}

Если данных недостаточно — ставь null. Адреса пиши полностью.
"""


async def parse_request_from_text(user_id: str, text: str) -> dict:
    """Parse free-form logistics text into structured request fields."""
    client = get_openai_client()
    start = time.time()
    usage = None
    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": PARSE_REQUEST_SYSTEM},
                {"role": "user", "content": text},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        usage = response.usage
        latency = int((time.time() - start) * 1000)
        await _log_usage(user_id, "parse_text", settings.OPENAI_MODEL, usage, latency, True)
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await _log_usage(user_id, "parse_text", settings.OPENAI_MODEL, usage, latency, False, str(e))
        logger.error("AI parse_text failed: %s", e)
        raise


PARSE_IMAGE_SYSTEM = """
Ты — ИИ-ассистент. Проанализируй изображение документа (скриншот, фото накладной, счёта и т.д.)
и извлеки из него данные для заявки на перевозку в формате JSON.
Используй ту же структуру JSON, что и для текстового парсинга.
Дополнительно верни поле "document_type" (invoice/waybill/contract/other) и "raw_text" (весь распознанный текст).
"""


async def parse_request_from_image(user_id: str, image_bytes: bytes, mime_type: str = "image/jpeg") -> dict:
    """Extract logistics data from a document image using GPT-4o Vision."""
    client = get_openai_client()
    start = time.time()
    usage = None
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_VISION_MODEL,
            messages=[
                {"role": "system", "content": PARSE_IMAGE_SYSTEM},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                        {"type": "text", "text": "Извлеки данные из этого документа."},
                    ],
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        usage = response.usage
        latency = int((time.time() - start) * 1000)
        await _log_usage(user_id, "parse_image", settings.OPENAI_VISION_MODEL, usage, latency, True)
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await _log_usage(user_id, "parse_image", settings.OPENAI_VISION_MODEL, usage, latency, False, str(e))
        logger.error("AI parse_image failed: %s", e)
        raise


CHAT_SYSTEM = """
Ты — ИИ-ассистент логистической платформы LogHist. Помогаешь логистам создавать заявки,
отвечаешь на вопросы о перевозках, тарифах, документах и маршрутах.
Отвечай на русском языке, кратко и по делу.
"""


async def logistics_chat(user_id: str, messages: list[dict]) -> str:
    """Conversational AI for the chat assistant."""
    client = get_openai_client()
    start = time.time()
    usage = None
    chat_messages = [{"role": "system", "content": CHAT_SYSTEM}] + messages[-20:]  # last 20 msgs
    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=chat_messages,
            temperature=0.7,
            max_tokens=1000,
        )
        usage = response.usage
        latency = int((time.time() - start) * 1000)
        await _log_usage(user_id, "chat", settings.OPENAI_MODEL, usage, latency, True)
        return response.choices[0].message.content
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await _log_usage(user_id, "chat", settings.OPENAI_MODEL, usage, latency, False, str(e))
        logger.error("AI chat failed: %s", e)
        raise
