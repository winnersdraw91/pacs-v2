from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.auth import get_current_active_user, require_role
from app.models import Billing, PricingConfig, Study, User, UserRole, DiagnosticCentre, Currency
from app.schemas import Billing as BillingSchema, BillingCreate, PricingConfig as PricingConfigSchema, PricingConfigCreate
import random
import string

router = APIRouter(prefix="/billing", tags=["billing"])

def generate_invoice_number() -> str:
    prefix = "INV"
    chars = string.digits
    number = ''.join(random.choice(chars) for _ in range(8))
    return f"{prefix}{number}"

@router.post("/pricing", response_model=PricingConfigSchema)
async def create_pricing_config(
    pricing: PricingConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    centre = db.query(DiagnosticCentre).filter(DiagnosticCentre.id == pricing.centre_id).first()
    if not centre:
        raise HTTPException(status_code=404, detail="Centre not found")
    
    existing = db.query(PricingConfig).filter(
        PricingConfig.centre_id == pricing.centre_id,
        PricingConfig.modality == pricing.modality
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Pricing already exists for this modality")
    
    db_pricing = PricingConfig(**pricing.dict())
    db.add(db_pricing)
    db.commit()
    db.refresh(db_pricing)
    return db_pricing

@router.get("/pricing", response_model=List[PricingConfigSchema])
async def list_pricing_configs(
    centre_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(PricingConfig)
    
    if centre_id:
        query = query.filter(PricingConfig.centre_id == centre_id)
    elif current_user.role in [UserRole.DIAGNOSTIC_CENTRE, UserRole.TECHNICIAN]:
        if not current_user.centre_id:
            return []
        query = query.filter(PricingConfig.centre_id == current_user.centre_id)
    
    pricing_configs = query.offset(skip).limit(limit).all()
    return pricing_configs

@router.patch("/pricing/{pricing_id}", response_model=PricingConfigSchema)
async def update_pricing_config(
    pricing_id: int,
    pricing_update: PricingConfigCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    pricing = db.query(PricingConfig).filter(PricingConfig.id == pricing_id).first()
    if not pricing:
        raise HTTPException(status_code=404, detail="Pricing config not found")
    
    for key, value in pricing_update.dict(exclude_unset=True).items():
        setattr(pricing, key, value)
    
    db.commit()
    db.refresh(pricing)
    return pricing

@router.post("/", response_model=BillingSchema)
async def create_billing(
    billing: BillingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.DIAGNOSTIC_CENTRE]))
):
    study = db.query(Study).filter(Study.id == billing.study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    existing_billing = db.query(Billing).filter(Billing.study_id == billing.study_id).first()
    if existing_billing:
        raise HTTPException(status_code=400, detail="Billing already exists for this study")
    
    invoice_number = generate_invoice_number()
    while db.query(Billing).filter(Billing.invoice_number == invoice_number).first():
        invoice_number = generate_invoice_number()
    
    db_billing = Billing(
        study_id=billing.study_id,
        amount=billing.amount,
        currency=billing.currency,
        invoice_number=invoice_number,
        status="pending"
    )
    
    db.add(db_billing)
    db.commit()
    db.refresh(db_billing)
    return db_billing

@router.get("/", response_model=List[BillingSchema])
async def list_billings(
    centre_id: Optional[int] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Billing).join(Study)
    
    if current_user.role in [UserRole.DIAGNOSTIC_CENTRE, UserRole.TECHNICIAN]:
        if not current_user.centre_id:
            return []
        query = query.filter(Study.centre_id == current_user.centre_id)
    elif centre_id:
        query = query.filter(Study.centre_id == centre_id)
    
    if status:
        query = query.filter(Billing.status == status)
    
    billings = query.offset(skip).limit(limit).all()
    return billings

@router.get("/{billing_id}", response_model=BillingSchema)
async def get_billing(
    billing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    billing = db.query(Billing).filter(Billing.id == billing_id).first()
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    if current_user.role in [UserRole.DIAGNOSTIC_CENTRE, UserRole.TECHNICIAN]:
        study = db.query(Study).filter(Study.id == billing.study_id).first()
        if study and study.centre_id != current_user.centre_id:
            raise HTTPException(status_code=403, detail="Not authorized to view this billing")
    
    return billing

@router.patch("/{billing_id}/status", response_model=BillingSchema)
async def update_billing_status(
    billing_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN]))
):
    billing = db.query(Billing).filter(Billing.id == billing_id).first()
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    billing.status = status
    db.commit()
    db.refresh(billing)
    return billing
