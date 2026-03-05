from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from models.common import MongoBase


class TransportType(str, Enum):
    FTL = "FTL"
    LTL = "LTL"
    COMBINED = "Combined"


class RequestStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"
    AWAITING_PAYMENT = "awaiting_payment"
    PAID = "paid"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class PaymentMethod(str, Enum):
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    CARD = "card"


# ─── Sub-models ──────────────────────────────────────────────────────────────

class RoutePoint(BaseModel):
    address: str
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None


class CargoInfo(BaseModel):
    name: str
    package_type: Optional[str] = None
    weight_kg: Optional[float] = None
    volume_m3: Optional[float] = None
    quantity: Optional[int] = None
    temperature_regime: Optional[str] = None
    hazard_class: Optional[str] = None
    special_conditions: Optional[str] = None


class TransportInfo(BaseModel):
    type: Optional[str] = None
    brand: Optional[str] = None
    truck_plate: Optional[str] = None
    trailer_plate: Optional[str] = None


class DriverInfo(BaseModel):
    full_name: Optional[str] = None
    passport_series: Optional[str] = None  # encrypted at rest
    passport_number: Optional[str] = None  # encrypted at rest
    license_number: Optional[str] = None
    phone: Optional[str] = None
    driver_id: Optional[str] = None  # ref to drivers collection


class PaymentInfo(BaseModel):
    rate: Optional[float] = None
    currency: str = "RUB"
    payment_terms: Optional[str] = None
    vat_included: bool = False
    payment_method: Optional[PaymentMethod] = None
    payment_due_date: Optional[str] = None


class CounterpartyRef(BaseModel):
    name: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    counterparty_id: Optional[str] = None  # ref to counterparties collection


# ─── Main Request document ───────────────────────────────────────────────────

class LogisticsRequest(MongoBase):
    request_number: str  # e.g. DPPO1-OTKA560
    user_id: str
    status: RequestStatus = RequestStatus.DRAFT
    transport_type: Optional[TransportType] = None
    counterparty: Optional[CounterpartyRef] = None
    origin: Optional[RoutePoint] = None
    destination: Optional[RoutePoint] = None
    waypoints: List[RoutePoint] = Field(default_factory=list)
    cargo: Optional[CargoInfo] = None
    transport: Optional[TransportInfo] = None
    driver: Optional[DriverInfo] = None
    payment: Optional[PaymentInfo] = None
    comments: Optional[str] = None
    documents: List[str] = Field(default_factory=list)  # document IDs
    ai_extracted: bool = False  # was this filled by AI?
    progress_percent: int = 0
    archive_notify_sent: bool = False
    is_archived: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    archived_at: Optional[datetime] = None


# ─── API schemas ─────────────────────────────────────────────────────────────

class CreateRequestBody(BaseModel):
    transport_type: Optional[TransportType] = None
    counterparty: Optional[CounterpartyRef] = None
    origin: Optional[RoutePoint] = None
    destination: Optional[RoutePoint] = None
    waypoints: List[RoutePoint] = Field(default_factory=list)
    cargo: Optional[CargoInfo] = None
    transport: Optional[TransportInfo] = None
    driver: Optional[DriverInfo] = None
    payment: Optional[PaymentInfo] = None
    comments: Optional[str] = None


class UpdateRequestBody(BaseModel):
    status: Optional[RequestStatus] = None
    transport_type: Optional[TransportType] = None
    counterparty: Optional[CounterpartyRef] = None
    origin: Optional[RoutePoint] = None
    destination: Optional[RoutePoint] = None
    waypoints: Optional[List[RoutePoint]] = None
    cargo: Optional[CargoInfo] = None
    transport: Optional[TransportInfo] = None
    driver: Optional[DriverInfo] = None
    payment: Optional[PaymentInfo] = None
    comments: Optional[str] = None
    progress_percent: Optional[int] = None


class AiParseRequest(BaseModel):
    text: str = Field(..., min_length=5, max_length=5000, description="Free text to parse into request fields")


class RequestPublic(MongoBase):
    request_number: str
    user_id: str
    status: RequestStatus
    transport_type: Optional[TransportType] = None
    counterparty: Optional[CounterpartyRef] = None
    origin: Optional[RoutePoint] = None
    destination: Optional[RoutePoint] = None
    waypoints: List[RoutePoint] = Field(default_factory=list)
    cargo: Optional[CargoInfo] = None
    transport: Optional[TransportInfo] = None
    driver: Optional[DriverInfo] = None
    payment: Optional[PaymentInfo] = None
    comments: Optional[str] = None
    documents: List[str] = Field(default_factory=list)
    ai_extracted: bool = False
    progress_percent: int = 0
    is_archived: bool = False
    created_at: datetime
    updated_at: datetime
