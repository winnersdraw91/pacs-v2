from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import auth, users, centres, studies, reports, billing, ai, imaging_machines

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    from sqlalchemy.orm import Session
    from app.auth import get_password_hash
    from app.models import User, UserRole, DiagnosticCentre, PricingConfig, Modality, Currency
    
    db = Session(bind=engine)
    try:
        admin = User(
            email="admin@pacs.com",
            username="admin",
            hashed_password=get_password_hash("admin"),
            full_name="System Administrator",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin)
        
        radiologist = User(
            email="radiologist1@pacs.com",
            username="radiologist1",
            hashed_password=get_password_hash("radio"),
            full_name="Dr. John Radiologist",
            role=UserRole.RADIOLOGIST,
            is_active=True
        )
        db.add(radiologist)
        
        centre = DiagnosticCentre(
            name="Demo Diagnostic Centre",
            address="123 Medical Street",
            contact_email="contact@democentre.com",
            contact_phone="+1234567890",
            is_active=True
        )
        db.add(centre)
        db.flush()
        
        pricing_xray = PricingConfig(
            centre_id=centre.id,
            modality=Modality.XRAY,
            price=50.0,
            currency=Currency.USD
        )
        db.add(pricing_xray)
        
        pricing_ct = PricingConfig(
            centre_id=centre.id,
            modality=Modality.CT,
            price=200.0,
            currency=Currency.USD
        )
        db.add(pricing_ct)
        
        tech = User(
            email="tech1@democentre.com",
            username="tech1",
            hashed_password=get_password_hash("tech"),
            full_name="Tech User",
            role=UserRole.TECHNICIAN,
            centre_id=centre.id,
            is_active=True
        )
        db.add(tech)
        
        db.commit()
        print("Database initialized with test users and data")
    except Exception as e:
        print(f"Database initialization error: {e}")
        db.rollback()
    finally:
        db.close()
    
    yield

app = FastAPI(title="PACS System", lifespan=lifespan)

app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://teleradiology-pacs-app-ubdzmbb7.devinapps.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(centres.router)
app.include_router(studies.router)
app.include_router(reports.router)
app.include_router(billing.router)
app.include_router(ai.router)
app.include_router(imaging_machines.router)

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "PACS System API", "version": "1.0.0"}
