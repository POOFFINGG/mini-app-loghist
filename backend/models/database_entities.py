"""
Models for the "Database" tab: counterparties, drivers, vehicles, documents.
"""
from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field, EmailStr, field_validator
from models.common import MongoBase, validate_inn, validate_kpp, validate_phone_ru


# ─── Counterparty ─────────────────────────────────────────────────────────────

class CounterpartyType(str, Enum):
    CLIENT = "client"
    VENDOR = "vendor"
    CARRIER = "carrier"


class Counterparty(MongoBase):
    owner_id: str
    name: str = Field(..., min_length=2)
    type: CounterpartyType = CounterpartyType.CLIENT
    inn: str
    kpp: Optional[str] = None
    ogrn: Optional[str] = None
    legal_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CounterpartyCreate(BaseModel):
    name: str = Field(..., min_length=2)
    type: CounterpartyType = CounterpartyType.CLIENT
    inn: str
    kpp: Optional[str] = None
    ogrn: Optional[str] = None
    legal_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None

    @field_validator("inn")
    @classmethod
    def check_inn(cls, v): return validate_inn(v)


class CounterpartyUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[CounterpartyType] = None
    kpp: Optional[str] = None
    ogrn: Optional[str] = None
    legal_address: Optional[str] = None
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None


# ─── Driver ───────────────────────────────────────────────────────────────────

class DriverStatus(str, Enum):
    ACTIVE = "active"
    ON_TRIP = "on_trip"
    UNAVAILABLE = "unavailable"


class Driver(MongoBase):
    owner_id: str
    full_name: str
    phone: str
    passport_series: Optional[str] = None  # stored encrypted (FZ-152)
    passport_number: Optional[str] = None  # stored encrypted (FZ-152)
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[str] = None
    status: DriverStatus = DriverStatus.ACTIVE
    vehicle_id: Optional[str] = None  # assigned vehicle
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class DriverCreate(BaseModel):
    full_name: str = Field(..., min_length=2)
    phone: str
    passport_series: Optional[str] = None
    passport_number: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[str] = None
    vehicle_id: Optional[str] = None
    notes: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v): return validate_phone_ru(v)


class DriverUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    passport_series: Optional[str] = None
    passport_number: Optional[str] = None
    license_number: Optional[str] = None
    license_category: Optional[str] = None
    license_expiry: Optional[str] = None
    status: Optional[DriverStatus] = None
    vehicle_id: Optional[str] = None
    notes: Optional[str] = None


# ─── Vehicle ──────────────────────────────────────────────────────────────────

class VehicleStatus(str, Enum):
    AVAILABLE = "available"
    ON_TRIP = "on_trip"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"


class Vehicle(MongoBase):
    owner_id: str
    brand: str
    model: Optional[str] = None
    truck_plate: str
    trailer_plate: Optional[str] = None
    year: Optional[int] = None
    capacity_tons: Optional[float] = None
    volume_m3: Optional[float] = None
    body_type: Optional[str] = None  # Тентованный, Рефрижератор, Контейнер...
    status: VehicleStatus = VehicleStatus.AVAILABLE
    driver_id: Optional[str] = None
    next_maintenance: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class VehicleCreate(BaseModel):
    brand: str = Field(..., min_length=2)
    model: Optional[str] = None
    truck_plate: str = Field(..., min_length=3)
    trailer_plate: Optional[str] = None
    year: Optional[int] = None
    capacity_tons: Optional[float] = None
    volume_m3: Optional[float] = None
    body_type: Optional[str] = None
    driver_id: Optional[str] = None
    next_maintenance: Optional[str] = None
    notes: Optional[str] = None


class VehicleUpdate(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    truck_plate: Optional[str] = None
    trailer_plate: Optional[str] = None
    year: Optional[int] = None
    capacity_tons: Optional[float] = None
    volume_m3: Optional[float] = None
    body_type: Optional[str] = None
    status: Optional[VehicleStatus] = None
    driver_id: Optional[str] = None
    next_maintenance: Optional[str] = None
    notes: Optional[str] = None


# ─── Document ─────────────────────────────────────────────────────────────────

class DocumentType(str, Enum):
    INVOICE = "invoice"
    WAYBILL = "waybill"
    CONTRACT = "contract"
    PASSPORT = "passport"
    DRIVER_LICENSE = "driver_license"
    VEHICLE_REGISTRATION = "vehicle_registration"
    CMR = "cmr"
    OTHER = "other"


class Document(MongoBase):
    owner_id: str
    request_id: Optional[str] = None
    document_type: DocumentType = DocumentType.OTHER
    filename: str
    content_type: str
    size_bytes: int
    storage_path: str  # path to encrypted file on disk
    is_encrypted: bool = True  # FZ-152: always encrypted
    is_sensitive: bool = False  # passport etc — extra protection
    uploaded_by: str  # user_id
    ocr_text: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
