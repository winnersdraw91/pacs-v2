# PACS System API Documentation

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-backend-url.com`

## Authentication

All protected endpoints require JWT authentication using Bearer token in the Authorization header.

### Get Authentication Token
**Endpoint**: `POST /auth/token`

**Request Body** (form-data):
```
username: string
password: string
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin"
```

### Get Current User
**Endpoint**: `GET /auth/me`

**Headers**: `Authorization: Bearer {token}`

**Response**:
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@pacs.com",
  "full_name": "System Administrator",
  "role": "admin",
  "centre_id": null,
  "is_active": true,
  "created_at": "2025-10-06T17:04:07.089288"
}
```

### Register New User
**Endpoint**: `POST /auth/register`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {admin_token}`

**Request Body**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securepassword",
  "full_name": "New User",
  "role": "technician",
  "centre_id": 1
}
```

**Response**: User object

---

## Users API

### List Users
**Endpoint**: `GET /users/`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)
- `role` (optional): Filter by role (admin, radiologist, technician, diagnostic_centre)

**Response**:
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@pacs.com",
    "full_name": "System Administrator",
    "role": "admin",
    "centre_id": null,
    "is_active": true,
    "created_at": "2025-10-06T17:04:07.089288"
  }
]
```

### Get User by ID
**Endpoint**: `GET /users/{user_id}`

**Headers**: `Authorization: Bearer {token}`

**Response**: User object

### Update User
**Endpoint**: `PATCH /users/{user_id}`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {admin_token}`

**Request Body**:
```json
{
  "email": "newemail@example.com",
  "full_name": "Updated Name",
  "is_active": true
}
```

**Response**: Updated user object

### Deactivate User
**Endpoint**: `PATCH /users/{user_id}/deactivate`

**Headers**: `Authorization: Bearer {admin_token}`

**Response**: Updated user object with `is_active: false`

---

## Studies API

### Upload Study
**Endpoint**: `POST /studies/upload`

**Headers**: 
- `Content-Type: multipart/form-data`
- `Authorization: Bearer {token}`

**Request Body** (multipart/form-data):
```
patient_name: John Doe
patient_age: 45
patient_gender: M
modality: ct
study_type: CT Scan - Chest
study_description: Routine chest examination
is_urgent: false
dicom_files: [file1.dcm, file2.dcm, file3.dcm]
```

**Response**:
```json
{
  "id": 1,
  "study_id": "X3LUIDBH",
  "patient_name": "John Doe",
  "patient_age": 45,
  "patient_gender": "M",
  "modality": "ct",
  "study_type": "CT Scan - Chest",
  "study_description": "Routine chest examination",
  "is_urgent": false,
  "status": "uploaded",
  "centre_id": 1,
  "created_by_id": 3,
  "assigned_radiologist_id": null,
  "dicom_files_path": "/storage/Demo Centre/X3LUIDBH",
  "num_instances": 3,
  "created_at": "2025-10-06T17:28:54.670008"
}
```

**Example**:
```bash
curl -X POST http://localhost:8000/studies/upload \
  -H "Authorization: Bearer {token}" \
  -F "patient_name=John Doe" \
  -F "patient_age=45" \
  -F "patient_gender=M" \
  -F "modality=ct" \
  -F "study_type=CT Scan - Chest" \
  -F "study_description=Routine examination" \
  -F "is_urgent=false" \
  -F "dicom_files=@/path/to/file1.dcm" \
  -F "dicom_files=@/path/to/file2.dcm"
```

### List Studies
**Endpoint**: `GET /studies/`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)
- `centre_id` (optional): Filter by diagnostic centre
- `status` (optional): Filter by status (uploaded, assigned, in_review, report_generated, verified)
- `modality` (optional): Filter by modality (ct, xray, mri, ultrasound, pet)

**Response**: Array of study objects

### Get Study by ID
**Endpoint**: `GET /studies/{study_id}`

**Headers**: `Authorization: Bearer {token}`

**Response**: Study object

### Get Study by Study ID (8-digit alphanumeric)
**Endpoint**: `GET /studies/study_id/{study_id}`

**Headers**: `Authorization: Bearer {token}`

**Example**: `GET /studies/study_id/X3LUIDBH`

**Response**: Study object

### Assign Study to Radiologist
**Endpoint**: `PATCH /studies/{study_id}/assign`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {token}`

**Request Body**:
```json
{
  "radiologist_id": 2
}
```

**Response**: Updated study object

### Get DICOM Instance
**Endpoint**: `GET /studies/{study_id}/instance/{instance_number}`

**Headers**: `Authorization: Bearer {token}`

**Response**: DICOM file (binary)

**Example**: `GET /studies/1/instance/0` returns the first DICOM file

---

## Reports API

### Create Report
**Endpoint**: `POST /reports/`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {radiologist_token}`

**Request Body**:
```json
{
  "study_id": 1,
  "findings": "CT scan of the chest shows clear lung fields bilaterally. No consolidation, pleural effusion, or pneumothorax. Heart size is within normal limits. Mediastinal contours are unremarkable.",
  "impression": "Normal chest CT study. No acute cardiopulmonary findings.",
  "report_type": "Preliminary Report",
  "is_ai_generated": false
}
```

**Response**:
```json
{
  "id": 1,
  "study_id": 1,
  "findings": "CT scan of the chest...",
  "impression": "Normal chest CT study...",
  "report_type": "Preliminary Report",
  "is_ai_generated": false,
  "is_verified": false,
  "created_at": "2025-10-06T18:47:10.068556",
  "verified_at": null
}
```

### List Reports
**Endpoint**: `GET /reports/`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)

**Response**: Array of report objects

### Get Report by ID
**Endpoint**: `GET /reports/{report_id}`

**Headers**: `Authorization: Bearer {token}`

**Response**: Report object

### Verify Report
**Endpoint**: `PATCH /reports/{report_id}/verify`

**Headers**: `Authorization: Bearer {radiologist_token}`

**Response**: 
```json
{
  "id": 1,
  "study_id": 1,
  "findings": "CT scan of the chest...",
  "impression": "Normal chest CT study...",
  "report_type": "Preliminary Report",
  "is_ai_generated": false,
  "is_verified": true,
  "created_at": "2025-10-06T18:47:10.068556",
  "verified_at": "2025-10-06T18:47:27.327797"
}
```

### Update Report
**Endpoint**: `PATCH /reports/{report_id}`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {radiologist_token}`

**Request Body**:
```json
{
  "findings": "Updated findings text",
  "impression": "Updated impression text"
}
```

**Response**: Updated report object

---

## AI API

### Trigger AI Processing
**Endpoint**: `POST /ai/process-study/{study_id}`

**Headers**: `Authorization: Bearer {token}`

**Description**: Triggers background AI processing for a study. AI will analyze the DICOM images and generate a preliminary report.

**Response**:
```json
{
  "message": "AI processing triggered",
  "study_id": "X3LUIDBH"
}
```

**Note**: This is an asynchronous operation. The AI report will be available via the reports API once processing is complete.

### Analyze Study with AI
**Endpoint**: `POST /ai/analyze-study/{study_id}`

**Headers**: `Authorization: Bearer {token}`

**Description**: Synchronously analyzes a study using AI modules (MONAI, TorchIO) and returns immediate results.

**Response**:
```json
{
  "study_id": 1,
  "analysis_complete": true,
  "preprocessing": {
    "success": true,
    "image_shape": [1, 256, 256],
    "device": "cpu"
  },
  "anatomical_structures": {
    "success": true,
    "structures_detected": 5,
    "structures": [...]
  },
  "pathology_findings": {
    "success": true,
    "modality": "CT",
    "findings": [...],
    "statistics": {...}
  },
  "torchio_processing": {
    "success": true,
    "processed_shape": [1, 256, 256, 1]
  }
}
```

### Get AI Report
**Endpoint**: `GET /ai/report/{study_id}`

**Headers**: `Authorization: Bearer {token}`

**Description**: Retrieves the AI-generated report for a study.

**Response**: Report object with `is_ai_generated: true`

**Note**: Returns 404 if no AI report exists for the study. AI reports are unverified by default and require radiologist review.

---

## Billing API

### Create Pricing Configuration
**Endpoint**: `POST /billing/pricing`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {admin_token}`

**Request Body**:
```json
{
  "centre_id": 1,
  "modality": "ct",
  "price": 150.0,
  "currency": "usd"
}
```

**Response**:
```json
{
  "id": 1,
  "centre_id": 1,
  "modality": "ct",
  "price": 150.0,
  "currency": "usd",
  "created_at": "2025-10-06T17:04:07.321123"
}
```

### List Pricing Configurations
**Endpoint**: `GET /billing/pricing`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `centre_id` (optional): Filter by diagnostic centre
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)

**Response**:
```json
[
  {
    "id": 1,
    "centre_id": 1,
    "modality": "ct",
    "price": 150.0,
    "currency": "usd",
    "created_at": "2025-10-06T17:04:07.321123"
  }
]
```

### Update Pricing Configuration
**Endpoint**: `PATCH /billing/pricing/{pricing_id}`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {admin_token}`

**Request Body**:
```json
{
  "price": 175.0,
  "currency": "usd"
}
```

**Response**: Updated pricing configuration object

### Create Billing Record
**Endpoint**: `POST /billing/`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {admin_token}`

**Request Body**:
```json
{
  "study_id": 1,
  "amount": 150.0,
  "currency": "usd"
}
```

**Response**:
```json
{
  "id": 1,
  "study_id": 1,
  "amount": 150.0,
  "currency": "usd",
  "status": "pending",
  "invoice_number": "INV14191298",
  "invoice_date": "2025-10-06T18:48:32.209969",
  "created_at": "2025-10-06T18:48:32.209973"
}
```

### List Billing Records
**Endpoint**: `GET /billing/`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `centre_id` (optional): Filter by diagnostic centre
- `status` (optional): Filter by status (pending, paid, cancelled)
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)

**Response**: Array of billing objects

### Get Billing by ID
**Endpoint**: `GET /billing/{billing_id}`

**Headers**: `Authorization: Bearer {token}`

**Response**: Billing object

### Update Billing Status
**Endpoint**: `PATCH /billing/{billing_id}/status`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {admin_token}`

**Query Parameters**:
- `status`: New status (pending, paid, cancelled)

**Response**: Updated billing object

---

## Diagnostic Centres API

### Create Centre
**Endpoint**: `POST /centres/`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {admin_token}`

**Request Body**:
```json
{
  "name": "Main Diagnostic Centre",
  "address": "123 Medical Street, City",
  "contact_email": "contact@centre.com",
  "contact_phone": "+1234567890"
}
```

**Response**:
```json
{
  "id": 1,
  "name": "Main Diagnostic Centre",
  "address": "123 Medical Street, City",
  "contact_email": "contact@centre.com",
  "contact_phone": "+1234567890",
  "is_active": true,
  "created_at": "2025-10-06T17:04:07.087857"
}
```

### List Centres
**Endpoint**: `GET /centres/`

**Headers**: `Authorization: Bearer {token}`

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum number of records to return (default: 100)
- `is_active` (optional): Filter by active status (true/false)

**Response**: Array of centre objects

### Get Centre by ID
**Endpoint**: `GET /centres/{centre_id}`

**Headers**: `Authorization: Bearer {token}`

**Response**: Centre object

### Update Centre
**Endpoint**: `PATCH /centres/{centre_id}`

**Headers**: 
- `Content-Type: application/json`
- `Authorization: Bearer {admin_token}`

**Request Body**:
```json
{
  "name": "Updated Centre Name",
  "address": "New Address",
  "contact_email": "newemail@centre.com",
  "contact_phone": "+9876543210"
}
```

**Response**: Updated centre object

### Deactivate Centre
**Endpoint**: `PATCH /centres/{centre_id}/deactivate`

**Headers**: `Authorization: Bearer {admin_token}`

**Response**: Updated centre object with `is_active: false`

---

## Health Check

### Health Check
**Endpoint**: `GET /health`

**Description**: Returns the health status of the API

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0"
}
```

---

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "detail": "Invalid request data"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not authorized to perform this action"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 422 Validation Error
```json
{
  "detail": [
    {
      "loc": ["body", "field_name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "detail": "AI functionality not available. AI dependencies not installed."
}
```

---

## Data Models

### User Roles
- `admin`: Full system access, manage all users and centres
- `radiologist`: View all studies, create and verify reports
- `technician`: Upload studies, view studies from own centre
- `diagnostic_centre`: Manage centre users, view centre studies

### Study Modalities
- `ct`: CT Scan
- `xray`: X-ray
- `mri`: MRI
- `ultrasound`: Ultrasound
- `pet`: PET Scan

### Study Status
- `uploaded`: Study uploaded, awaiting assignment
- `assigned`: Study assigned to radiologist
- `in_review`: Radiologist reviewing study
- `report_generated`: Report created, awaiting verification
- `verified`: Report verified and complete

### Currency Codes
- `usd`: US Dollar
- `inr`: Indian Rupee
- `aed`: UAE Dirham

### Billing Status
- `pending`: Invoice created, payment pending
- `paid`: Invoice paid
- `cancelled`: Invoice cancelled

---

## Rate Limiting

**Note**: Rate limiting is not currently implemented but should be added for production:
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user
- DICOM uploads limited to 10 per minute per user

---

## Interactive API Documentation

FastAPI provides interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These interfaces allow you to:
- View all available endpoints
- See request/response schemas
- Test endpoints directly in the browser
- View authentication requirements

---

## Best Practices

### Authentication
- Always include the Authorization header with Bearer token
- Tokens expire after 30 minutes (configurable)
- Request new token when expired

### File Uploads
- Use `multipart/form-data` for DICOM uploads
- Maximum file size: 100MB per file (configurable)
- Supported formats: .dcm, .dicom

### Pagination
- Use `skip` and `limit` parameters for large result sets
- Default limit is 100 records
- Maximum limit is 1000 records

### Error Handling
- Always check response status codes
- Parse error details from response body
- Implement retry logic for 5xx errors

### Security
- Never commit authentication tokens
- Use HTTPS in production
- Rotate tokens regularly
- Implement proper CORS policies

---

## Code Examples

### Python Example
```python
import requests

# Login
response = requests.post(
    "http://localhost:8000/auth/token",
    data={"username": "admin", "password": "admin"}
)
token = response.json()["access_token"]

# Upload Study
headers = {"Authorization": f"Bearer {token}"}
files = {"dicom_files": open("scan.dcm", "rb")}
data = {
    "patient_name": "John Doe",
    "patient_age": 45,
    "patient_gender": "M",
    "modality": "ct",
    "study_type": "CT Scan - Chest",
    "study_description": "Routine examination",
    "is_urgent": False
}
response = requests.post(
    "http://localhost:8000/studies/upload",
    headers=headers,
    files=files,
    data=data
)
study = response.json()
print(f"Study ID: {study['study_id']}")
```

### JavaScript Example
```javascript
// Login
const loginResponse = await fetch('http://localhost:8000/auth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: 'username=admin&password=admin'
});
const { access_token } = await loginResponse.json();

// Get Studies
const studiesResponse = await fetch('http://localhost:8000/studies/', {
  headers: { 'Authorization': `Bearer ${access_token}` }
});
const studies = await studiesResponse.json();
console.log(`Found ${studies.length} studies`);
```

### cURL Examples
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin" | jq -r .access_token)

# List Studies
curl -X GET http://localhost:8000/studies/ \
  -H "Authorization: Bearer $TOKEN"

# Create Report
curl -X POST http://localhost:8000/reports/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "study_id": 1,
    "findings": "Normal findings",
    "impression": "No abnormalities detected",
    "report_type": "Final Report",
    "is_ai_generated": false
  }'
```

---

## Support

For questions or issues:
- Check the interactive documentation at `/docs`
- Review error messages in response bodies
- Consult the DEPLOYMENT_GUIDE.md for setup issues
- Review TESTING_SUMMARY.md for known issues
