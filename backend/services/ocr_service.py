"""
OCR service: Tesseract (primary) + ChatGPT Vision (fallback/enhancement).
FZ-152: OCR results may contain personal data — handle with care.
"""
import io
import logging
from typing import Optional

from PIL import Image

from core.config import settings

logger = logging.getLogger(__name__)


def _tesseract_ocr(image_bytes: bytes) -> str:
    """Run Tesseract OCR locally."""
    try:
        import pytesseract
        pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
        image = Image.open(io.BytesIO(image_bytes))
        text = pytesseract.image_to_string(image, lang=settings.OCR_LANGUAGE)
        return text.strip()
    except Exception as e:
        logger.warning("Tesseract OCR failed: %s", e)
        return ""


async def _gpt_ocr(image_bytes: bytes, mime_type: str, user_id: str) -> str:
    """Use ChatGPT Vision as OCR."""
    import base64
    from services.ai_service import get_openai_client, _log_usage
    import time

    client = get_openai_client()
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    start = time.time()
    usage = None
    try:
        response = await client.chat.completions.create(
            model=settings.OPENAI_VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                        {"type": "text", "text": "Выполни OCR этого изображения. Верни весь текст как есть, без форматирования."},
                    ],
                }
            ],
            temperature=0,
            max_tokens=2000,
        )
        usage = response.usage
        latency = int((time.time() - start) * 1000)
        await _log_usage(user_id, "ocr", settings.OPENAI_VISION_MODEL, usage, latency, True)
        return response.choices[0].message.content.strip()
    except Exception as e:
        latency = int((time.time() - start) * 1000)
        await _log_usage(user_id, "ocr", settings.OPENAI_VISION_MODEL, usage, latency, False, str(e))
        logger.error("GPT OCR failed: %s", e)
        return ""


async def run_ocr(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    user_id: str = "system",
    use_gpt_fallback: bool = True,
) -> str:
    """
    Run OCR on an image. Tries Tesseract first, falls back to GPT Vision.
    Returns extracted text.
    """
    text = _tesseract_ocr(image_bytes)

    # If Tesseract result is too short or empty, use GPT Vision
    if use_gpt_fallback and len(text) < 20:
        logger.info("Tesseract result too short (%d chars), using GPT Vision OCR", len(text))
        text = await _gpt_ocr(image_bytes, mime_type, user_id)

    return text
