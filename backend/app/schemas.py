from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List
from app.models import UserRole, StudyStatus, Modality, Currency

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[UserRole] = None

class UserBase(BaseModel):
    email: EmailStr
    username: str
    full_name: Optional[str] = None
    role: UserRole
    centre_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class DiagnosticCentreBase(BaseModel):
    name: str
    address: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None

class DiagnosticCentreCreate(DiagnosticCentreBase):
    pass

class DiagnosticCentre(DiagnosticCentreBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class ImagingMachineBase(BaseModel):
    name: str
    ip_address: str
    port: int
    ae_title: str
    description: Optional[str] = None

class ImagingMachineCreate(ImagingMachineBase):
    centre_id: int

class ImagingMachineUpdate(BaseModel):
    name: Optional[str] = None
    ip_address: Optional[str] = None
    port: Optional[int] = None
    ae_title: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class ImagingMachine(ImagingMachineBase):
    id: int
    centre_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudyBase(BaseModel):
    patient_name: str
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None
    modality: Modality
    study_type: Optional[str] = None
    study_description: Optional[str] = None
    is_urgent: bool = False

class StudyCreate(StudyBase):
    centre_id: int

class Study(StudyBase):
    id: int
    study_id: str
    status: StudyStatus
    centre_id: int
    created_by_id: int
    assigned_radiologist_id: Optional[int] = None
    dicom_files_path: Optional[str] = None
    num_instances: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ReportBase(BaseModel):
    findings: str
    impression: str
    report_type: Optional[str] = None

class ReportCreate(ReportBase):
    study_id: int
    is_ai_generated: bool = False

class Report(ReportBase):
    id: int
    study_id: int
    is_ai_generated: bool
    is_verified: bool
    created_at: datetime
    verified_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class PricingConfigBase(BaseModel):
    modality: Modality
    price: float
    currency: Currency = Currency.USD

class PricingConfigCreate(PricingConfigBase):
    centre_id: Optional[int] = None
    radiologist_id: Optional[int] = None

class PricingConfig(PricingConfigBase):
    id: int
    centre_id: Optional[int] = None
    radiologist_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class BillingBase(BaseModel):
    amount: float
    currency: Currency = Currency.USD

class BillingCreate(BillingBase):
    study_id: int

class Billing(BillingBase):
    id: int
    study_id: int
    status: str
    invoice_number: Optional[str] = None
    invoice_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True
