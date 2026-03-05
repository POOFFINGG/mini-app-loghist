"""Real-time shipment tracking endpoints."""
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from core.database import col_tracking, col_requests
from core.dependencies import get_current_user
from models.tracking import UpdateLocationBody, TrackingPublic, GeoPoint

router = APIRouter(prefix="/tracking", tags=["Tracking"])


def _s(doc: dict) -> dict:
    doc["_id"] = str(doc["_id"])
    return doc


@router.get("/{request_id}", response_model=TrackingPublic)
async def get_tracking(request_id: str, user: dict = Depends(get_current_user)):
    """Get current tracking data for a request."""
    user_id = str(user["_id"])
    # Verify request belongs to user
    req = await col_requests().find_one({"_id": ObjectId(request_id), "user_id": user_id})
    if not req:
        raise HTTPException(404, "Request not found")

    doc = await col_tracking().find_one({"request_id": request_id})
    if not doc:
        return TrackingPublic(request_id=request_id)
    return TrackingPublic(
        request_id=request_id,
        current_position=doc.get("current_position"),
        route_history=doc.get("route_history", []),
        estimated_arrival=doc.get("estimated_arrival"),
    )


@router.post("/{request_id}/location", status_code=status.HTTP_200_OK)
async def update_location(
    request_id: str,
    body: UpdateLocationBody,
    user: dict = Depends(get_current_user),
):
    """Update current GPS position for a shipment."""
    user_id = str(user["_id"])
    req = await col_requests().find_one({"_id": ObjectId(request_id), "user_id": user_id})
    if not req:
        raise HTTPException(404, "Request not found")

    now = datetime.now(timezone.utc)
    point = {
        "lat": body.lat,
        "lon": body.lon,
        "timestamp": now,
        "speed_kmh": body.speed_kmh,
        "heading": body.heading,
    }

    existing = await col_tracking().find_one({"request_id": request_id})
    if existing:
        await col_tracking().update_one(
            {"request_id": request_id},
            {
                "$set": {"current_position": point, "updated_at": now},
                "$push": {"route_history": {"$each": [point], "$slice": -500}},
            },
        )
    else:
        await col_tracking().insert_one({
            "request_id": request_id,
            "current_position": point,
            "route_history": [point],
            "created_at": now,
            "updated_at": now,
        })

    return {"status": "ok", "position": point}
