# Running Phase 4 (Backend) & Phase 5 (Frontend)

This guide explains how to run the backend API (Phase 4) and the frontend application (Phase 5).

---

## Prerequisites

- **Node.js** 18+ installed
- **PostgreSQL** database running
- **Python 3.9+** with virtual environment

---

## Quick Start (All Services)

Run these commands in separate terminal windows:

```bash
# Terminal 1 - ML Service (Phase 3) - REQUIRED for predictions
cd ml/inference
source ../venv/bin/activate  # or: source venv/bin/activate (from project root)
uvicorn app:app --host 0.0.0.0 --port 8000

# Terminal 2 - Backend (Phase 4)
cd backend
npm run dev

# Terminal 3 - Frontend (Phase 5)
cd frontend
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## Phase 3: ML Inference Service (Required for Predictions)

### 1. Navigate to inference directory

```bash
cd ml/inference
```

### 2. Activate Python virtual environment

```bash
source ../../venv/bin/activate
# OR from project root:
source venv/bin/activate
```

### 3. Start the ML service

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

The ML service will be available at: **http://localhost:8000**

### 4. Verify ML service is running

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status":"ok","model_loaded":true,"device":"cpu"}
```

---

## Phase 4: Backend API

### 1. Navigate to backend directory

```bash
cd backend
```

### 2. Install dependencies (if not already installed)

```bash
npm install
```

### 3. Configure environment variables

Create or edit `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/fakenews
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fakenews
DB_USER=YOUR_USER
DB_PASSWORD=YOUR_PASSWORD

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d

# ML Service Configuration
ML_SERVICE_URL=http://localhost:8000

# Upload Configuration
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

### 4. Create the database (if not exists)

```bash
psql -U postgres -c "CREATE DATABASE fakenews;"
```

### 5. Start the backend server

```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

The backend will be available at: **http://localhost:5000**

### 6. Verify backend is running

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "backend": "running",
  "database": "connected",
  "ml_service": "ok"
}
```

---

## Phase 5: Frontend Application

### 1. Navigate to frontend directory

```bash
cd frontend
```

### 2. Install dependencies (if not already installed)

```bash
npm install
```

### 3. Configure environment variables

The `.env.local` file should already exist with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Start the frontend

```bash
# Development mode
npm run dev

# OR Production build
npm run build
npm start
```

The frontend will be available at: **http://localhost:3000**

---

## Running Both Services Together

### Option 1: Two terminal windows

**Terminal 1 (Backend):**
```bash
cd backend && npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
```

### Option 2: Using a process manager (recommended)

You can use tools like `concurrently` or `pm2` to run both:

```bash
# Install concurrently globally
npm install -g concurrently

# From the project root
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

---

## Full Stack Start Order

For the complete application to work, start services in this order:

1. **PostgreSQL database** (must be running)
2. **ML Service** (Phase 3) - `cd ml && python -m uvicorn src.api.main:app --reload --port 8000`
3. **Backend API** (Phase 4) - `cd backend && npm run dev`
4. **Frontend** (Phase 5) - `cd frontend && npm run dev`

---

## API Endpoints (Backend)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/signup` | Create new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/logout` | Logout user | No |
| POST | `/api/predict` | Submit article for prediction | Yes |
| GET | `/api/predict/:id` | Get specific prediction | Yes |
| POST | `/api/predict/:id/feedback` | Submit feedback on prediction | Yes |
| GET | `/api/history` | Get user's prediction history | Yes |
| GET | `/api/history/stats` | Get user's statistics | Yes |
| GET | `/api/health` | Health check endpoint | No |

---

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Main prediction form (requires login) |
| `/login` | User login page |
| `/signup` | User registration page |
| `/history` | Prediction history and statistics (requires login) |

---

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database credentials in `.env`
- Ensure port 5000 is not in use

### Frontend shows "Unauthorized"
- Make sure backend is running
- Clear browser cookies and try logging in again
- Check browser console for CORS errors

### Predictions fail
- Verify ML service (Phase 3) is running on port 8000
- Check backend logs for connection errors
- Test ML service directly: `curl http://localhost:8000/health`

### CORS issues
- Ensure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check that `credentials: true` is set in frontend API calls

---

## Environment Summary

| Service | Default Port | URL |
|---------|-------------|-----|
| PostgreSQL | 5432 | localhost |
| ML Service | 8000 | http://localhost:8000 |
| Backend API | 5000 | http://localhost:5000 |
| Frontend | 3000 | http://localhost:3000 |
