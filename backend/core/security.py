"""
Security utilities: JWT, password hashing, document encryption (AES-256).
FZ-152 requires encryption of sensitive personal data documents.
"""
import base64
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt as _bcrypt
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from jose import JWTError, jwt

from core.config import settings


# ─── Password ────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt(rounds=12)).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ─── JWT ─────────────────────────────────────────────────────────────────────

def create_access_token(subject: str, extra: dict | None = None) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "exp": expire, "type": "access", **(extra or {})}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": subject, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        return None


# ─── AES-256-GCM Document Encryption (FZ-152) ────────────────────────────────

def _get_aes_key() -> bytes:
    """Decode the 32-byte AES key from base64-encoded config."""
    return base64.b64decode(settings.ENCRYPTION_KEY)


def encrypt_document(data: bytes) -> bytes:
    """
    Encrypt binary data with AES-256-GCM.
    Returns: nonce (12 bytes) + ciphertext_with_tag
    """
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return nonce + ciphertext


def decrypt_document(encrypted: bytes) -> bytes:
    """Decrypt AES-256-GCM encrypted data."""
    key = _get_aes_key()
    aesgcm = AESGCM(key)
    nonce, ciphertext = encrypted[:12], encrypted[12:]
    return aesgcm.decrypt(nonce, ciphertext, None)


def encrypt_field(value: str) -> str:
    """Encrypt a string field and return base64-encoded result."""
    encrypted = encrypt_document(value.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")


def decrypt_field(encrypted_b64: str) -> str:
    """Decrypt a base64-encoded encrypted string field."""
    encrypted = base64.b64decode(encrypted_b64.encode("utf-8"))
    return decrypt_document(encrypted).decode("utf-8")
