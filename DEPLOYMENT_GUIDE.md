# PACS System Deployment Guide

## Prerequisites

### Local Deployment
- Docker and Docker Compose installed
- PostgreSQL 15+ (or use Docker container)
- Node.js 18+ and pnpm/npm
- Python 3.12+ with Poetry

### Cloud Deployment (Optional)
- Fly.io account (for backend deployment)
- Cloud storage account (AWS S3, Azure Blob, or GCP Cloud Storage)
- Domain name (optional, for custom URLs)

## Environment Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://pacs_user:pacs_password@localhost:5432/pacs_db

# JWT Authentication
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS (adjust for production)
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Storage
STORAGE_PATH=../storage

# Optional: AI Module Configuration
AI_ENABLED=false  # Set to true when AI dependencies are installed
CUDA_VISIBLE_DEVICES=0  # For GPU support
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:8000
```

For production deployment, update this to your deployed backend URL.

## Local Development Setup

### Step 1: Clone Repository
```bash
git clone https://github.com/winnersdraw91/pacs-v2.git
cd pacs-v2
```

### Step 2: Database Setup

#### Option A: Using Docker
```bash
docker run -d \
  --name pacs-postgres \
  -e POSTGRES_USER=pacs_user \
  -e POSTGRES_PASSWORD=pacs_password \
  -e POSTGRES_DB=pacs_db \
  -p 5432:5432 \
  postgres:15
```

#### Option B: Local PostgreSQL
```bash
# Create database and user
psql -U postgres
CREATE DATABASE pacs_db;
CREATE USER pacs_user WITH PASSWORD 'pacs_password';
GRANT ALL PRIVILEGES ON DATABASE pacs_db TO pacs_user;
```

### Step 3: Backend Setup
```bash
cd backend

# Install dependencies
poetry install

# Initialize database
poetry run python init_db.py

# Run development server
poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend will be available at `http://localhost:8000`

### Step 4: Frontend Setup
```bash
cd frontend

# Install dependencies
pnpm install

# Run development server
pnpm run dev
```

The frontend will be available at `http://localhost:5173`

## Docker Compose Deployment

### Full Stack with Docker Compose
```bash
# From repository root
docker-compose up -d

# Initialize database (first time only)
docker-compose exec backend poetry run python init_db.py

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Services will be available at:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- PostgreSQL: `localhost:5432`

## Production Deployment

### Backend Deployment (Fly.io)

1. **Install Fly CLI**
```bash
curl -L https://fly.io/install.sh | sh
```

2. **Login to Fly.io**
```bash
fly auth login
```

3. **Deploy Backend**
```bash
cd backend

# Create fly.toml if not exists
fly launch --no-deploy

# Set environment variables
fly secrets set SECRET_KEY="your-production-secret-key"
fly secrets set DATABASE_URL="your-production-database-url"
fly secrets set CORS_ORIGINS="https://your-frontend-url.com"

# Deploy
fly deploy
```

4. **Initialize Production Database**
```bash
fly ssh console
poetry run python init_db.py
exit
```

### Frontend Deployment

#### Option A: Using deploy_frontend command (Devin)
```bash
# Build the frontend
cd frontend
pnpm run build

# Deploy (Devin command)
<deploy_frontend dir="frontend/dist"/>
```

#### Option B: Manual Deployment (Vercel/Netlify)

**Vercel:**
```bash
npm install -g vercel
cd frontend
vercel --prod
```

**Netlify:**
```bash
npm install -g netlify-cli
cd frontend
pnpm run build
netlify deploy --prod --dir=dist
```

### Database Migration for Production

```bash
cd backend

# Create migration
poetry run alembic revision --autogenerate -m "description"

# Apply migration
poetry run alembic upgrade head
```

## Post-Deployment Configuration

### 1. Update CORS Settings
In production, update `backend/.env`:
```env
CORS_ORIGINS=https://your-frontend-domain.com
```

### 2. Update Frontend API URL
In `frontend/.env`:
```env
VITE_API_URL=https://your-backend-domain.com
```

### 3. Configure Storage

For production, consider using cloud storage:

**AWS S3:**
```python
# In backend/app/config.py
STORAGE_TYPE = "s3"
AWS_ACCESS_KEY_ID = "your-key"
AWS_SECRET_ACCESS_KEY = "your-secret"
S3_BUCKET_NAME = "pacs-dicom-storage"
```

**Azure Blob Storage:**
```python
STORAGE_TYPE = "azure"
AZURE_STORAGE_CONNECTION_STRING = "your-connection-string"
AZURE_CONTAINER_NAME = "pacs-dicom-storage"
```

### 4. Set Up SSL/TLS
- Use Let's Encrypt for free SSL certificates
- Configure HTTPS for both frontend and backend
- Update CORS to use HTTPS URLs

## Initial System Setup

### Create Admin User
The `init_db.py` script creates default users:
- **Admin**: username=`admin`, password=`admin`
- **Radiologist**: username=`radiologist1`, password=`radio`
- **Technician**: username=`tech1`, password=`tech`

**Important**: Change these passwords immediately in production!

### Create Diagnostic Centres
```bash
# Using the API
curl -X POST http://your-backend-url/centres/ \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Main Diagnostic Centre",
    "address": "123 Medical Street",
    "contact_email": "contact@centre.com",
    "contact_phone": "+1234567890"
  }'
```

### Configure Pricing
```bash
curl -X POST http://your-backend-url/billing/pricing \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "centre_id": 1,
    "modality": "ct",
    "price": 150.0,
    "currency": "usd"
  }'
```

## Monitoring and Maintenance

### Health Checks
- Backend: `GET /health`
- Database: Check connection in logs

### Log Management
```bash
# Docker Compose logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Fly.io logs
fly logs
```

### Backup Strategy

**Database Backups:**
```bash
# Daily backup script
pg_dump -U pacs_user pacs_db > backup_$(date +%Y%m%d).sql

# Restore from backup
psql -U pacs_user pacs_db < backup_20251006.sql
```

**DICOM Storage Backups:**
- Use cloud storage replication
- Regular sync to backup location
- Implement retention policies

### Performance Optimization

1. **Database Indexing**: Already configured in models
2. **Caching**: Consider Redis for frequently accessed data
3. **CDN**: Use CDN for frontend static assets
4. **Image Optimization**: Consider DICOM compression

## Scaling Considerations

### Horizontal Scaling
- Deploy multiple backend instances behind load balancer
- Use managed database (AWS RDS, Azure Database)
- Implement distributed storage (S3, Azure Blob)
- Use message queue (RabbitMQ, Celery) for AI processing

### Vertical Scaling
- Increase server resources for backend
- Optimize database configuration
- Use GPU instances for AI processing

## Troubleshooting

### Backend Won't Start
- Check DATABASE_URL is correct
- Verify PostgreSQL is running
- Check Poetry environment: `poetry env info`
- Review logs: `poetry run uvicorn app.main:app --log-level debug`

### Frontend Build Fails
- Clear node_modules: `rm -rf node_modules && pnpm install`
- Check Node.js version: `node --version` (should be 18+)
- Verify API URL in .env

### DICOM Upload Fails
- Check storage path exists and is writable
- Verify file size limits in nginx/reverse proxy
- Check CORS settings for multipart form data

### AI Modules Not Working
- Install AI dependencies manually:
  ```bash
  poetry run pip install torch torchvision monai torchio transformers
  ```
- Verify CUDA installation for GPU support
- Set AI_ENABLED=true in .env

### Database Connection Issues
- Check firewall rules
- Verify DATABASE_URL format
- Test connection: `psql $DATABASE_URL`

## Security Checklist

- [ ] Change default user passwords
- [ ] Use strong SECRET_KEY in production
- [ ] Enable HTTPS for all endpoints
- [ ] Configure firewall rules
- [ ] Implement rate limiting
- [ ] Enable audit logging
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] API key rotation policy
- [ ] DICOM data anonymization (if required)

## Support and Maintenance

### Regular Maintenance Tasks
- Weekly database vacuum and analyze
- Monthly security updates
- Quarterly user access review
- Regular backup testing
- Performance monitoring and optimization

### Upgrade Path
1. Test in staging environment
2. Backup production database
3. Deploy new version to staging
4. Run database migrations
5. Smoke test critical features
6. Deploy to production
7. Monitor for issues

## Additional Resources

- FastAPI Documentation: https://fastapi.tiangolo.com/
- React Documentation: https://react.dev/
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Docker Documentation: https://docs.docker.com/
- DICOM Standard: https://www.dicomstandard.org/

## Getting Help

For issues or questions:
1. Check TESTING_SUMMARY.md for known issues
2. Review application logs
3. Consult API documentation at `/docs` endpoint
4. Contact system administrator
