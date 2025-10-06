from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, DiagnosticCentre, PricingConfig, Modality, Currency
from app.auth import get_password_hash

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            admin = User(
                username="admin",
                email="admin@pacs.com",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin"),
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)
            print("Created admin user: username='admin', password='admin'")
        
        radiologist = db.query(User).filter(User.username == "radiologist1").first()
        if not radiologist:
            radiologist = User(
                username="radiologist1",
                email="radiologist@pacs.com",
                full_name="Dr. John Radiologist",
                hashed_password=get_password_hash("radio"),
                role=UserRole.RADIOLOGIST,
                is_active=True
            )
            db.add(radiologist)
            print("Created radiologist user: username='radiologist1', password='radio'")
        
        demo_centre = db.query(DiagnosticCentre).filter(DiagnosticCentre.name == "Demo Centre").first()
        if not demo_centre:
            demo_centre = DiagnosticCentre(
                name="Demo Centre",
                address="123 Medical St",
                contact_email="demo@centre.com",
                contact_phone="+1234567890",
                is_active=True
            )
            db.add(demo_centre)
            db.flush()
            print("Created demo diagnostic centre")
            
            pricing_ct = PricingConfig(
                centre_id=demo_centre.id,
                modality=Modality.CT,
                price=150.0,
                currency=Currency.USD
            )
            pricing_xray = PricingConfig(
                centre_id=demo_centre.id,
                modality=Modality.XRAY,
                price=50.0,
                currency=Currency.USD
            )
            pricing_mri = PricingConfig(
                centre_id=demo_centre.id,
                modality=Modality.MRI,
                price=300.0,
                currency=Currency.USD
            )
            db.add_all([pricing_ct, pricing_xray, pricing_mri])
            print("Created pricing configurations")
            
            technician = User(
                username="tech1",
                email="tech@centre.com",
                full_name="Tech User",
                hashed_password=get_password_hash("tech"),
                role=UserRole.TECHNICIAN,
                centre_id=demo_centre.id,
                is_active=True
            )
            db.add(technician)
            print("Created technician user: username='tech1', password='tech'")
        
        db.commit()
        print("\nDatabase initialized successfully!")
        print("\nDefault users created:")
        print("  Admin: username='admin', password='admin'")
        print("  Radiologist: username='radiologist1', password='radio'")
        print("  Technician: username='tech1', password='tech'")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
