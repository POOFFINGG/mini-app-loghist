"""Shared Pydantic base classes and helpers."""
from datetime import datetime
from typing import Any, Optional
from bson import ObjectId
from pydantic import BaseModel, Field, field_validator
import re


def _validate_objectid(v: Any) -> str:
    if isinstance(v, ObjectId):
        return str(v)
    if isinstance(v, str) and ObjectId.is_valid(v):
        return v
    raise ValueError("Invalid ObjectId")


# Pydantic v2 compatible ObjectId field — generates proper JSON schema (string)
from pydantic import GetCoreSchemaHandler, GetJsonSchemaHandler
from pydantic_core import core_schema as _cs
from pydantic.json_schema import JsonSchemaValue


class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type: Any, handler: GetCoreSchemaHandler) -> _cs.CoreSchema:
        return _cs.no_info_wrap_validator_function(
            lambda v, nxt: _validate_objectid(v),
            _cs.str_schema(),
            serialization=_cs.plain_serializer_function_ser_schema(str),
        )

    @classmethod
    def __get_pydantic_json_schema__(cls, schema: _cs.CoreSchema, handler: GetJsonSchemaHandler) -> JsonSchemaValue:
        return {"type": "string", "example": "507f1f77bcf86cd799439011"}


class MongoBase(BaseModel):
    """Base model for MongoDB documents."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

    @classmethod
    def from_mongo(cls, data: dict) -> "MongoBase":
        if data and "_id" in data:
            data["_id"] = str(data["_id"])
        return cls(**data)


def validate_inn(inn: str) -> str:
    inn = inn.strip()
    if not re.fullmatch(r"\d{10}|\d{12}", inn):
        raise ValueError("INN must be 10 or 12 digits")
    return inn


def validate_kpp(kpp: str) -> str:
    kpp = kpp.strip()
    if not re.fullmatch(r"\d{9}", kpp):
        raise ValueError("KPP must be 9 digits")
    return kpp


def validate_ogrn(ogrn: str) -> str:
    ogrn = ogrn.strip()
    if not re.fullmatch(r"\d{13}|\d{15}", ogrn):
        raise ValueError("OGRN must be 13 or 15 digits")
    return ogrn


def validate_bik(bik: str) -> str:
    bik = bik.strip()
    if not re.fullmatch(r"\d{9}", bik):
        raise ValueError("BIK must be 9 digits")
    return bik


def validate_phone_ru(phone: str) -> str:
    phone = re.sub(r"[\s\-\(\)]", "", phone)
    if not re.fullmatch(r"(\+7|8|7)\d{10}", phone):
        raise ValueError("Invalid Russian phone number")
    return phone
