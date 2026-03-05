from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field
from models.common import MongoBase


class GeoPoint(BaseModel):
    lat: float
    lon: float
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    speed_kmh: Optional[float] = None
    heading: Optional[float] = None


class TrackingRecord(MongoBase):
    request_id: str
    driver_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    current_position: Optional[GeoPoint] = None
    route_history: List[GeoPoint] = Field(default_factory=list)
    estimated_arrival: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UpdateLocationBody(BaseModel):
    lat: float
    lon: float
    speed_kmh: Optional[float] = None
    heading: Optional[float] = None


class TrackingPublic(BaseModel):
    request_id: str
    current_position: Optional[GeoPoint] = None
    route_history: List[GeoPoint] = Field(default_factory=list)
    estimated_arrival: Optional[datetime] = None


class NotificationRecord(MongoBase):
    user_id: str
    title: str
    body: str
    type: str  # "info" | "warning" | "error" | "archive_warning"
    is_read: bool = False
    related_id: Optional[str] = None  # request_id etc
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
