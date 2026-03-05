"""
Database tab endpoints: counterparties, drivers, vehicles, documents.
FZ-152: drivers contain sensitive personal data (passport) — all actions logged.
"""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status

from core.database import col_counterparties, col_drivers, col_vehicles, col_documents
from core.dependencies import get_current_user
from core.audit_logger import audit_log, AuditAction
from core.security import encrypt_field, decrypt_field
from models.database_entities import (
    Counterparty, CounterpartyCreate, CounterpartyUpdate,
    Driver, DriverCreate, DriverUpdate,
    Vehicle, VehicleCreate, VehicleUpdate,
    DocumentType,
)
from services.document_service import upload_document, get_document_bytes, delete_document
from services.ocr_service import run_ocr

router = APIRouter(prefix="/db", tags=["Database"])


def _get_ip(r: Request) -> str:
    fwd = r.headers.get("X-Forwarded-For")
    return fwd.split(",")[0].strip() if fwd else r.client.host


def _s(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


# ══════════════════════════════════════════════════════════════════════════════
# COUNTERPARTIES
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/counterparties")
async def list_counterparties(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    q: dict = {"owner_id": str(user["_id"])}
    if search:
        q["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"inn": {"$regex": search}},
        ]
    docs = await col_counterparties().find(q).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return [_s(d) for d in docs]


@router.post("/counterparties", status_code=status.HTTP_201_CREATED)
async def create_counterparty(
    body: CounterpartyCreate,
    request: Request,
    user: dict = Depends(get_current_user),
):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)
    doc = {**body.model_dump(), "owner_id": user_id, "created_at": now, "updated_at": now}
    result = await col_counterparties().insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    await audit_log(AuditAction.COUNTERPARTY_CREATED, user_id=user_id, resource_id=doc["_id"],
                    resource_type="counterparty", ip_address=ip, details={"name": body.name})
    return doc


@router.patch("/counterparties/{cid}")
async def update_counterparty(
    cid: str, body: CounterpartyUpdate, request: Request, user: dict = Depends(get_current_user)
):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    doc = await col_counterparties().find_one({"_id": ObjectId(cid), "owner_id": user_id})
    if not doc:
        raise HTTPException(404, "Not found")
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    data["updated_at"] = datetime.now(timezone.utc)
    await col_counterparties().update_one({"_id": ObjectId(cid)}, {"$set": data})
    await audit_log(AuditAction.COUNTERPARTY_UPDATED, user_id=user_id, resource_id=cid,
                    resource_type="counterparty", ip_address=ip)
    updated = await col_counterparties().find_one({"_id": ObjectId(cid)})
    return _s(updated)


@router.delete("/counterparties/{cid}", status_code=204)
async def delete_counterparty(cid: str, request: Request, user: dict = Depends(get_current_user)):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    doc = await col_counterparties().find_one({"_id": ObjectId(cid), "owner_id": user_id})
    if not doc:
        raise HTTPException(404, "Not found")
    await col_counterparties().delete_one({"_id": ObjectId(cid)})
    await audit_log(AuditAction.COUNTERPARTY_DELETED, user_id=user_id, resource_id=cid,
                    resource_type="counterparty", ip_address=ip)


# ══════════════════════════════════════════════════════════════════════════════
# DRIVERS (FZ-152 sensitive — passport data encrypted)
# ══════════════════════════════════════════════════════════════════════════════

def _encrypt_driver(data: dict) -> dict:
    """Encrypt passport fields before storing."""
    if data.get("passport_series"):
        data["passport_series"] = encrypt_field(data["passport_series"])
    if data.get("passport_number"):
        data["passport_number"] = encrypt_field(data["passport_number"])
    return data


def _decrypt_driver(doc: dict) -> dict:
    """Decrypt passport fields when reading."""
    try:
        if doc.get("passport_series"):
            doc["passport_series"] = decrypt_field(doc["passport_series"])
        if doc.get("passport_number"):
            doc["passport_number"] = decrypt_field(doc["passport_number"])
    except Exception:
        pass  # fields may not be encrypted in old records
    return doc


@router.get("/drivers")
async def list_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    search: Optional[str] = Query(None),
    user: dict = Depends(get_current_user),
):
    q: dict = {"owner_id": str(user["_id"])}
    if search:
        q["full_name"] = {"$regex": search, "$options": "i"}
    docs = await col_drivers().find(q).sort("full_name", 1).skip(skip).limit(limit).to_list(limit)
    return [_decrypt_driver(_s(d)) for d in docs]


@router.post("/drivers", status_code=201)
async def create_driver(body: DriverCreate, request: Request, user: dict = Depends(get_current_user)):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)
    data = _encrypt_driver(body.model_dump())
    doc = {**data, "owner_id": user_id, "status": "active", "created_at": now, "updated_at": now}
    result = await col_drivers().insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    await audit_log(AuditAction.DRIVER_CREATED, user_id=user_id, resource_id=doc["_id"],
                    resource_type="driver", ip_address=ip, details={"name": body.full_name})
    return _decrypt_driver(doc)


@router.patch("/drivers/{did}")
async def update_driver(did: str, body: DriverUpdate, request: Request, user: dict = Depends(get_current_user)):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    doc = await col_drivers().find_one({"_id": ObjectId(did), "owner_id": user_id})
    if not doc:
        raise HTTPException(404, "Not found")
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    data = _encrypt_driver(data)
    data["updated_at"] = datetime.now(timezone.utc)
    await col_drivers().update_one({"_id": ObjectId(did)}, {"$set": data})
    await audit_log(AuditAction.DRIVER_UPDATED, user_id=user_id, resource_id=did,
                    resource_type="driver", ip_address=ip)
    updated = await col_drivers().find_one({"_id": ObjectId(did)})
    return _decrypt_driver(_s(updated))


@router.delete("/drivers/{did}", status_code=204)
async def delete_driver(did: str, request: Request, user: dict = Depends(get_current_user)):
    ip = _get_ip(request)
    user_id = str(user["_id"])
    doc = await col_drivers().find_one({"_id": ObjectId(did), "owner_id": user_id})
    if not doc:
        raise HTTPException(404, "Not found")
    await col_drivers().delete_one({"_id": ObjectId(did)})
    await audit_log(AuditAction.DRIVER_DELETED, user_id=user_id, resource_id=did,
                    resource_type="driver", ip_address=ip)


# ══════════════════════════════════════════════════════════════════════════════
# VEHICLES
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/vehicles")
async def list_vehicles(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    docs = await col_vehicles().find({"owner_id": str(user["_id"])}).sort("brand", 1).skip(skip).limit(limit).to_list(limit)
    return [_s(d) for d in docs]


@router.post("/vehicles", status_code=201)
async def create_vehicle(body: VehicleCreate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    now = datetime.now(timezone.utc)
    doc = {**body.model_dump(), "owner_id": user_id, "status": "available", "created_at": now, "updated_at": now}
    result = await col_vehicles().insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


@router.patch("/vehicles/{vid}")
async def update_vehicle(vid: str, body: VehicleUpdate, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    doc = await col_vehicles().find_one({"_id": ObjectId(vid), "owner_id": user_id})
    if not doc:
        raise HTTPException(404, "Not found")
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    data["updated_at"] = datetime.now(timezone.utc)
    await col_vehicles().update_one({"_id": ObjectId(vid)}, {"$set": data})
    updated = await col_vehicles().find_one({"_id": ObjectId(vid)})
    return _s(updated)


@router.delete("/vehicles/{vid}", status_code=204)
async def delete_vehicle(vid: str, user: dict = Depends(get_current_user)):
    user_id = str(user["_id"])
    doc = await col_vehicles().find_one({"_id": ObjectId(vid), "owner_id": user_id})
    if not doc:
        raise HTTPException(404, "Not found")
    await col_vehicles().delete_one({"_id": ObjectId(vid)})


# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENTS (encrypted upload/download)
# ══════════════════════════════════════════════════════════════════════════════

@router.get("/documents")
async def list_documents(
    request_id: Optional[str] = Query(None),
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(get_current_user),
):
    q: dict = {"owner_id": str(user["_id"])}
    if request_id:
        q["request_id"] = request_id
    docs = await col_documents().find(q).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    # Don't expose storage_path
    for d in docs:
        d.pop("storage_path", None)
        _s(d)
    return docs


@router.post("/documents/upload", status_code=201)
async def upload_doc(
    request: Request,
    file: UploadFile = File(...),
    request_id: Optional[str] = Query(None),
    document_type: DocumentType = Query(DocumentType.OTHER),
    is_sensitive: bool = Query(False),
    run_ocr_flag: bool = Query(False, alias="ocr"),
    user: dict = Depends(get_current_user),
):
    ip = _get_ip(request)
    user_id = str(user["_id"])

    # Read file data for OCR (before upload consumes it)
    file_data = await file.read()

    # Re-create file-like for upload service
    from io import BytesIO
    from fastapi import UploadFile as FUF
    # Rebuild UploadFile with already-read bytes
    file.file = BytesIO(file_data)
    file._size = len(file_data)

    doc_meta = await upload_document(
        file=file,
        owner_id=user_id,
        request_id=request_id,
        document_type=document_type,
        is_sensitive=is_sensitive,
        ip_address=ip,
    )

    # Optional OCR
    if run_ocr_flag and file.content_type and file.content_type.startswith("image"):
        ocr_text = await run_ocr(file_data, file.content_type, user_id)
        if ocr_text:
            await col_documents().update_one(
                {"_id": ObjectId(doc_meta["_id"])},
                {"$set": {"ocr_text": ocr_text}},
            )
            doc_meta["ocr_text"] = ocr_text

    doc_meta.pop("storage_path", None)
    return doc_meta


@router.get("/documents/{doc_id}/download")
async def download_doc(doc_id: str, request: Request, user: dict = Depends(get_current_user)):
    ip = _get_ip(request)
    from fastapi.responses import Response
    data, content_type, filename = await get_document_bytes(doc_id, str(user["_id"]), ip)
    return Response(
        content=data,
        media_type=content_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.delete("/documents/{doc_id}", status_code=204)
async def delete_doc(doc_id: str, request: Request, user: dict = Depends(get_current_user)):
    ip = _get_ip(request)
    await delete_document(doc_id, str(user["_id"]), ip)
