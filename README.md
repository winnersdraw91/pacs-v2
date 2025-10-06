# PACS System v2 - Complete Teleradiology Platform

A complete, self-hosted Picture Archiving and Communication System (PACS) with advanced features including multi-role user portals, DICOM viewer, AI image analysis, and comprehensive backend infrastructure for teleradiology businesses.

## Features

### Core Functionality
- **Multi-Role Authentication**: JWT-based authentication with role-based access control (Admin, Diagnostic Centre, Technician, Radiologist)
- **DICOM Management**: Upload, storage, and retrieval of DICOM studies with automatic 8-digit alphanumeric Study ID generation
- **Advanced DICOM Viewer**: React-based viewer with zoom, pan, multi-instance navigation
- **AI-Powered Analysis**: Integrated AI modules for automated image analysis and preliminary report generation
- **Multi-Currency Billing**: Support for USD, INR, AED with configurable per-modality pricing
- **Role-Specific Dashboards**: Customized portals for each user role

### Technology Stack

#### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy
- **Authentication**: JWT with bcrypt password hashing
- **DICOM Processing**: pydicom, Pillow
- **AI Frameworks**: MONAI, TorchIO, MiniGPT-Med (infrastructure ready)

#### Frontend
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **UI Library**: shadcn/ui with Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **DICOM Viewing**: Custom canvas-based viewer

#### Deployment
- **Containerization**: Docker & Docker Compose
- **Orchestration**: Ready for Kubernetes
- **Cloud Support**: AWS, Azure, GCP compatible

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.12+ (for local development)
- Poetry (for Python dependency management)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/winnersdraw91/pacs-v2.git
cd pacs-v2
```

2. **Create environment file**
```bash
cp .env.example .env
```

Edit `.env` and update the values, especially `SECRET_KEY` and database credentials.

3. **Start with Docker Compose**
```bash
docker-compose up -d
```

4. **Initialize the database**
```bash
docker-compose exec backend poetry run python init_db.py
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

### Local Development (without Docker)

#### Backend Setup
```bash
cd backend
poetry install
poetry run python init_db.py
poetry run fastapi dev app/main.py
```

#### Frontend Setup
```bash
cd frontend
pnpm install
pnpm run dev
```

## Default Users

After initializing the database, the following test users are created:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | admin | admin123 | admin@pacs.local |
| Radiologist | radiologist | radio123 | radiologist@pacs.local |
| Diagnostic Centre | centre | centre123 | centre@pacs.local |
| Technician | technician | tech123 | technician@pacs.local |

**⚠️ Important**: Change these passwords in production!

## User Roles & Permissions

### Admin Portal
- Manage diagnostic centres and radiologists
- Configure billing and pricing per modality
- System-wide analytics and monitoring
- User management (activate/deactivate)
- Multi-currency billing configuration

### Diagnostic Centre Portal
- Manage internal users (doctors, technicians)
- Upload DICOM studies
- Assign studies to internal doctors or radiologists
- View verified reports
- Track billing and report turnaround time

### Technician Portal
- Upload DICOM files (single or batch)
- Input patient metadata
- Assign studies to doctors
- Mark cases as urgent
- View upload and processing status

### Radiologist Portal
- Access unassigned studies from all centres
- Claim studies for reporting
- Use integrated DICOM viewer
- Review AI-generated preliminary reports
- Edit and verify reports
- Send finalized reports to diagnostic centres

## API Documentation

### Authentication
```bash
# Login
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123"

# Get current user
curl http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### DICOM Studies
```bash
# Upload study
curl -X POST http://localhost:8000/studies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "patient_name=John Doe" \
  -F "modality=XRAY" \
  -F "patient_age=45" \
  -F "files=@path/to/dicom.dcm"

# List studies
curl http://localhost:8000/studies \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get study details
curl http://localhost:8000/studies/{study_id} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Assign study to radiologist
curl -X POST http://localhost:8000/studies/{study_id}/assign \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"radiologist_id": 2}'
```

### AI Processing
```bash
# Trigger AI processing for a study
curl -X POST http://localhost:8000/ai/process-study/{study_id} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get AI-generated report
curl http://localhost:8000/ai/report/{study_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Complete API Documentation
Visit http://localhost:8000/docs for interactive Swagger UI documentation.

## Architecture

### Database Models
- **Users**: Multi-role user management with RBAC
- **DiagnosticCentres**: Centre information and configuration
- **Studies**: DICOM studies with metadata and file paths
- **Reports**: AI-generated and verified reports
- **BillingRecords**: Transaction history
- **PricingConfigs**: Per-modality pricing by centre

### Storage Structure
```
storage/
├── {centre_name}/
│   └── {study_id}/
│       ├── instance_001.dcm
│       ├── instance_002.dcm
│       └── ...
```

### AI Workflow
1. DICOM study uploaded by technician
2. System assigns unique 8-digit Study ID
3. Files stored in structured directory
4. AI preprocessing with MONAI/TorchIO
5. Analysis and report generation with MiniGPT-Med
6. Draft report saved for radiologist review
7. Radiologist verifies/edits report
8. Verified report sent to diagnostic centre

## Deployment

### Production Deployment

1. **Update environment variables**
```bash
# Generate a secure secret key
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

2. **Update docker-compose.yml** for production:
- Change `fastapi dev` to `fastapi run` in backend command
- Remove volume mounts for source code
- Configure proper networking and security

3. **Deploy to cloud**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes Deployment
Kubernetes manifests can be generated from the Docker Compose file or created manually for production deployments.

### Environment Variables
See `.env.example` for all configurable environment variables.

## Security Best Practices

1. **Change default passwords** immediately after setup
2. **Use strong SECRET_KEY** for JWT token generation
3. **Enable HTTPS** in production with proper SSL certificates
4. **Configure CORS** appropriately for your domain
5. **Regular backups** of PostgreSQL database and storage directory
6. **User access auditing** through database logs
7. **Secure API endpoints** with rate limiting

## Testing

### Backend Tests
```bash
cd backend
poetry run pytest
```

### Frontend Tests
```bash
cd frontend
pnpm test
```

## Troubleshooting

### Common Issues

**Database connection failed**
- Ensure PostgreSQL is running
- Check DATABASE_URL in .env file
- Verify network connectivity

**DICOM upload fails**
- Check storage directory permissions
- Ensure STORAGE_PATH is correctly configured
- Verify DICOM file format

**Frontend can't connect to backend**
- Verify VITE_API_URL in .env
- Check backend is running on correct port
- Review CORS configuration

**AI processing errors**
- Ensure required AI libraries are installed
- Check GPU availability for PyTorch
- Review logs for specific error messages

## Contributing

This is a proprietary system for @winnersdraw91. For feature requests or bug reports, please contact the development team.

## License

Proprietary - All Rights Reserved

## Support

For support and questions:
- GitHub: @winnersdraw91
- Devin Session: https://app.devin.ai/sessions/ec61b46776684b388ebc7e56e324a1f9

## Acknowledgments

Built with:
- FastAPI
- React
- PostgreSQL
- shadcn/ui
- Cornerstone3D
- MONAI
- PyTorch
