"""
Document storage service with AES-256 encryption (FZ-152).
Files are stored encrypted on disk; metadata in MongoDB.
"""
import os
import uuid
import logging
from pathlib import Path
from typing import Optional

from fastapi import UploadFile, HTTPException
from bson import ObjectId

from core.config import settings
from core.security import encrypt_document, decrypt_document
from core.database import col_documents
from core.audit_logger import audit_log, AuditAction
from models.database_entities import Document, DocumentType
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads/documents")
ALLOWED_TYPES = {
    "image/jpeg", "image/png", "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


async def upload_document(
    file: UploadFile,
    owner_id: str,
    request_id: Optional[str] = None,
    document_type: DocumentType = DocumentType.OTHER,
    is_sensitive: bool = False,
    notes: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> dict:
    """Upload, encrypt and store a document. Returns document metadata."""

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type not allowed: {file.content_type}")

    data = await file.read()
    if len(data) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 20 MB)")

    # Encrypt (FZ-152)
    encrypted = encrypt_document(data)

    # Save to disk
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    file_id = str(uuid.uuid4())
    storage_path = str(UPLOAD_DIR / f"{file_id}.enc")
    with open(storage_path, "wb") as f:
        f.write(encrypted)

    doc = {
        "owner_id": owner_id,
        "request_id": request_id,
        "document_type": document_type.value,
        "filename": file.filename,
        "content_type": file.content_type,
        "size_bytes": len(data),
        "storage_path": storage_path,
        "is_encrypted": True,
        "is_sensitive": is_sensitive,
        "uploaded_by": owner_id,
        "notes": notes,
        "created_at": datetime.now(timezone.utc),
    }
    result = await col_documents().insert_one(doc)
    doc_id = str(result.inserted_id)

    await audit_log(
        AuditAction.DOCUMENT_UPLOADED,
        user_id=owner_id,
        resource_id=doc_id,
        resource_type="document",
        ip_address=ip_address,
        details={"filename": file.filename, "type": document_type.value, "sensitive": is_sensitive},
    )

    doc["_id"] = doc_id
    return doc


async def get_document_bytes(
    doc_id: str,
    user_id: str,
    ip_address: Optional[str] = None,
) -> tuple[bytes, str, str]:
    """
    Retrieve and decrypt a document. Returns (bytes, content_type, filename).
    Raises 404 if not found, 403 if not owner.
    """
    doc = await col_documents().find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    with open(doc["storage_path"], "rb") as f:
        encrypted = f.read()
    data = decrypt_document(encrypted)

    await audit_log(
        AuditAction.DOCUMENT_DOWNLOADED,
        user_id=user_id,
        resource_id=doc_id,
        resource_type="document",
        ip_address=ip_address,
        details={"filename": doc["filename"]},
    )

    return data, doc["content_type"], doc["filename"]


async def delete_document(
    doc_id: str,
    user_id: str,
    ip_address: Optional[str] = None,
) -> None:
    """Delete document from disk and MongoDB."""
    doc = await col_documents().find_one({"_id": ObjectId(doc_id)})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    if doc["owner_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Remove encrypted file
    try:
        os.remove(doc["storage_path"])
    except OSError:
        pass

    await col_documents().delete_one({"_id": ObjectId(doc_id)})

    await audit_log(
        AuditAction.DOCUMENT_DELETED,
        user_id=user_id,
        resource_id=doc_id,
        resource_type="document",
        ip_address=ip_address,
        details={"filename": doc["filename"]},
    )
