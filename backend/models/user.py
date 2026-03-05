from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field, field_validator
from models.common import MongoBase, validate_inn, validate_kpp, validate_ogrn, validate_bik, validate_phone_ru


# ─── Sub-models ───────────────────────────────────────────────────────────────

class PersonalData(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    position: str = Field(..., min_length=2, max_length=100)


class CompanyData(BaseModel):
    name: str = Field(..., min_length=2, max_length=300)
    legal_address: str = Field(..., min_length=5)
    inn: str
    kpp: Optional[str] = None
    ogrn: str
    contact_phone: str
    contact_email: Optional[EmailStr] = None

    @field_validator("inn")
    @classmethod
    def check_inn(cls, v): return validate_inn(v)

    @field_validator("kpp")
    @classmethod
    def check_kpp(cls, v): return validate_kpp(v) if v else v

    @field_validator("ogrn")
    @classmethod
    def check_ogrn(cls, v): return validate_ogrn(v)

    @field_validator("contact_phone")
    @classmethod
    def check_phone(cls, v):
        import re
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if len(cleaned) < 7:
            raise ValueError("Введите корректный номер телефона")
        return cleaned


class BankData(BaseModel):
    bank_name: str = Field(..., min_length=2)
    bik: str = Field(..., min_length=1)
    account_number: str = Field(..., min_length=1)
    correspondent_account: str = Field(..., min_length=1)


class LogisticianData(BaseModel):
    phone: str
    email: EmailStr

    @field_validator("phone")
    @classmethod
    def check_phone(cls, v):
        import re
        cleaned = re.sub(r"[\s\-\(\)]", "", v)
        if len(cleaned) < 7:
            raise ValueError("Введите корректный номер телефона")
        return cleaned


# ─── DB document ──────────────────────────────────────────────────────────────

class UserInDB(MongoBase):
    email: EmailStr
    phone: Optional[str] = None
    password_hash: str
    personal: Optional[PersonalData] = None
    company: Optional[CompanyData] = None
    bank: Optional[BankData] = None
    logistician: Optional[LogisticianData] = None
    avatar_url: Optional[str] = None
    is_active: bool = True
    is_blocked: bool = False
    telegram_id: Optional[int] = None
    # Subscription
    subscription_plan: str = "free"  # free | pro | enterprise
    subscription_expires: Optional[datetime] = None
    # FZ-152 consent
    pd_consent_given: bool = False
    pd_consent_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ─── API schemas ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(..., min_length=8)
    personal: PersonalData
    company: CompanyData
    bank: Optional[BankData] = None
    logistician: LogisticianData
    pd_consent: bool = Field(..., description="Consent to personal data processing (FZ-152)")

    @field_validator("pd_consent")
    @classmethod
    def must_consent(cls, v):
        if not v:
            raise ValueError("Consent to personal data processing is required (FZ-152)")
        return v


class LoginRequest(BaseModel):
    login: str  # email or phone
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserPublic(MongoBase):
    email: EmailStr
    phone: Optional[str] = None
    personal: Optional[PersonalData] = None
    company: Optional[CompanyData] = None
    logistician: Optional[LogisticianData] = None
    avatar_url: Optional[str] = None
    subscription_plan: str = "free"
    subscription_expires: Optional[datetime] = None
    created_at: datetime


class UpdatePersonalData(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    position: Optional[str] = Field(None, min_length=2, max_length=100)


class UpdateCompanyData(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=300)
    legal_address: Optional[str] = None
    inn: Optional[str] = None
    kpp: Optional[str] = None
    ogrn: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[EmailStr] = None


class UpdateBankData(BaseModel):
    bank_name: Optional[str] = None
    bik: Optional[str] = None
    account_number: Optional[str] = None
    correspondent_account: Optional[str] = None


class UpdateLogisticianData(BaseModel):
    phone: Optional[str] = None
    email: Optional[EmailStr] = None


class UpdateProfileRequest(BaseModel):
    personal: Optional[UpdatePersonalData] = None
    company: Optional[UpdateCompanyData] = None
    bank: Optional[UpdateBankData] = None
    logistician: Optional[UpdateLogisticianData] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)
