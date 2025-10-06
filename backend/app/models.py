from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, Boolean, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    DIAGNOSTIC_CENTRE = "diagnostic_centre"
    TECHNICIAN = "technician"
    RADIOLOGIST = "radiologist"
    DOCTOR = "doctor"

class StudyStatus(str, enum.Enum):
    UPLOADED = "uploaded"
    ASSIGNED = "assigned"
    IN_REVIEW = "in_review"
    REPORT_GENERATED = "report_generated"
    VERIFIED = "verified"

class Modality(str, enum.Enum):
    XRAY = "xray"
    CT = "ct"
    MRI = "mri"
    ULTRASOUND = "ultrasound"
    PET = "pet"
    MAMMOGRAPHY = "mammography"

class Currency(str, enum.Enum):
    USD = "usd"
    INR = "inr"
    AED = "aed"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    centre_id = Column(Integer, ForeignKey("diagnostic_centres.id"), nullable=True)
    centre = relationship("DiagnosticCentre", back_populates="users")
    
    assigned_studies = relationship("Study", foreign_keys="Study.assigned_radiologist_id", back_populates="assigned_radiologist")
    created_studies = relationship("Study", foreign_keys="Study.created_by_id", back_populates="created_by")

class DiagnosticCentre(Base):
    __tablename__ = "diagnostic_centres"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    address = Column(String)
    contact_email = Column(String)
    contact_phone = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    users = relationship("User", back_populates="centre")
    studies = relationship("Study", back_populates="centre")
    pricing_config = relationship("PricingConfig", back_populates="centre")
    imaging_machines = relationship("ImagingMachine", back_populates="centre")

class ImagingMachine(Base):
    __tablename__ = "imaging_machines"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ip_address = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    ae_title = Column(String, nullable=False)
    description = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    centre_id = Column(Integer, ForeignKey("diagnostic_centres.id"), nullable=False)
    centre = relationship("DiagnosticCentre", back_populates="imaging_machines")

class Study(Base):
    __tablename__ = "studies"
    
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(String(8), unique=True, index=True, nullable=False)
    patient_name = Column(String, nullable=False)
    patient_age = Column(Integer)
    patient_gender = Column(String(10))
    modality = Column(SQLEnum(Modality), nullable=False)
    study_type = Column(String)
    study_description = Column(Text)
    status = Column(SQLEnum(StudyStatus), default=StudyStatus.UPLOADED)
    is_urgent = Column(Boolean, default=False)
    
    centre_id = Column(Integer, ForeignKey("diagnostic_centres.id"), nullable=False)
    centre = relationship("DiagnosticCentre", back_populates="studies")
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_studies")
    
    assigned_radiologist_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_radiologist = relationship("User", foreign_keys=[assigned_radiologist_id], back_populates="assigned_studies")
    
    dicom_files_path = Column(String)
    num_instances = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    reports = relationship("Report", back_populates="study")
    billing = relationship("Billing", back_populates="study", uselist=False)

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    study = relationship("Study", back_populates="reports")
    
    report_type = Column(String)
    findings = Column(Text)
    impression = Column(Text)
    is_ai_generated = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PricingConfig(Base):
    __tablename__ = "pricing_configs"
    
    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("diagnostic_centres.id"), nullable=False)
    centre = relationship("DiagnosticCentre", back_populates="pricing_config")
    
    modality = Column(SQLEnum(Modality), nullable=False)
    price = Column(Float, nullable=False)
    currency = Column(SQLEnum(Currency), default=Currency.USD)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Billing(Base):
    __tablename__ = "billings"
    
    id = Column(Integer, primary_key=True, index=True)
    study_id = Column(Integer, ForeignKey("studies.id"), nullable=False)
    study = relationship("Study", back_populates="billing")
    
    amount = Column(Float, nullable=False)
    currency = Column(SQLEnum(Currency), default=Currency.USD)
    status = Column(String, default="pending")
    
    invoice_number = Column(String, unique=True)
    invoice_date = Column(DateTime, default=datetime.utcnow)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
