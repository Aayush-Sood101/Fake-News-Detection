# How to Run Phase 3 & 4

**Last Updated:** March 29, 2026  
**Status:** Production Ready ✅

---

## Overview

This guide explains how to run Phase 3 (Python ML Inference Service) and Phase 4 (Node.js Backend API) of the Fake News Detection system.

**Architecture:**
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Frontend      │ ───────▶│  Node.js API    │ ───────▶│  Python ML      │
│  (Phase 5)      │         │   (Phase 4)     │         │  Service (P3)   │
│  Port: 3000     │         │   Port: 5000    │         │  Port: 8000     │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │   PostgreSQL    │
                            │   Port: 5432    │
                            └─────────────────┘
```

---

## Prerequisites

### System Requirements

- **Python:** 3.10+ (tested with 3.14)
- **Node.js:** 18+ (tested with latest)
- **PostgreSQL:** 15+
- **Operating System:** macOS, Linux, or Windows with WSL

### Check Installations

```bash
# Check Python version
python3 --version  # Should be 3.10+

# Check Node.js version
node --version     # Should be 18+

# Check npm version
npm --version

# Check PostgreSQL
psql --version     # Should be 15+
```

---

## Installation & Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd Multi-Modal
```

### Step 2: Install Python Dependencies

```bash
# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On macOS/Linux
# OR
venv\Scripts\activate     # On Windows

# Install ML dependencies
cd ml
pip install -r requirements.txt
cd ..
```

### Step 3: Install Node.js Dependencies

```bash
cd backend
npm install
cd ..
```

### Step 4: Setup PostgreSQL Database

#### Start PostgreSQL Service

```bash
# On macOS with Homebrew
brew services start postgresql@15

# On Linux (Ubuntu/Debian)
sudo systemctl start postgresql

# On Windows
# Start PostgreSQL from Services or pgAdmin
```

#### Create Database and User

```bash
# Connect to PostgreSQL
psql -U postgres

# Or if postgres user doesn't exist, create it first
createuser -s postgres
psql -U postgres

# Inside psql, run:
CREATE DATABASE fakenews;
ALTER USER postgres WITH PASSWORD 'your_secure_password';
\q
```

### Step 5: Configure Environment Variables

Create `backend/.env` file:

```bash
cd backend
cat > .env << 'EOF'
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/fakenews
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fakenews
DB_USER=postgres
DB_PASSWORD=your_secure_password

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

# AWS S3 Configuration (optional)
USE_S3=false
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET=fake-news-images
EOF
```

**Important:** Replace `your_secure_password` and `JWT_SECRET` with actual secure values.

### Step 6: Verify Model Checkpoint

Ensure the trained model exists:

```bash
ls -lh ml/checkpoints/best_model.pt
# Should show a file around 800MB
```

If the model doesn't exist, you need to run Phase 2 (training) first.

---

## Running the Services

### Option A: Run All Services (Recommended)

Use three separate terminal windows/tabs:

#### Terminal 1: Start PostgreSQL (if not running)

```bash
# On macOS with Homebrew
brew services start postgresql@15

# On Linux
sudo systemctl start postgresql

# Verify it's running
psql -U postgres -d fakenews -c "SELECT 1;"
```

#### Terminal 2: Start ML Inference Service (Phase 3)

```bash
cd Multi-Modal

# Activate virtual environment
source venv/bin/activate

# Navigate to inference directory
cd ml/inference

# Start the ML service
python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

# You should see:
# ✅ Model loaded successfully
# ✅ Uvicorn running on http://0.0.0.0:8000
```

**Wait for model to load** (~5-10 seconds on first start)

#### Terminal 3: Start Backend API (Phase 4)

```bash
cd Multi-Modal/backend

# Start the backend
npm run dev

# You should see:
# ✅ Database synced
# ✅ ML service is healthy
# 🚀 Server running on port 5000
```

---

### Option B: Run Services with Production Settings

#### Phase 3 (ML Service) - Production

```bash
cd Multi-Modal
source venv/bin/activate
cd ml/inference

# Run with production settings (no reload, multiple workers)
python -m uvicorn app:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --log-level info

# Or with gunicorn for better production performance
gunicorn app:app \
  --worker-class uvicorn.workers.UvicornWorker \
  --workers 4 \
  --bind 0.0.0.0:8000 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
```

#### Phase 4 (Backend) - Production

```bash
cd Multi-Modal/backend

# Update .env
NODE_ENV=production

# Run with node (not nodemon)
npm start

# Or with PM2 for process management
pm2 start src/server.js --name fake-news-backend
pm2 logs fake-news-backend
```

---

## Verifying the Services

### Check Service Health

```bash
# Check ML Service (Phase 3)
curl http://localhost:8000/health
# Expected: {"status":"ok","model_loaded":true,"device":"cpu"}

# Check Backend API (Phase 4)
curl http://localhost:5000/api/health
# Expected: {"status":"ok","backend":"running","database":"connected","ml_service":"ok"}

# View API Documentation (Phase 3)
open http://localhost:8000/docs
# Opens interactive Swagger documentation
```

### Quick Test

```bash
# 1. Register a user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123",
    "name": "Test User",
    "role": "user"
  }' -c cookies.txt

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpass123"
  }' -b cookies.txt -c cookies.txt

# 3. Make a prediction
curl -X POST http://localhost:5000/api/predict \
  -b cookies.txt \
  -F "title=Breaking News: Major Discovery Announced" \
  -F "body=Scientists have made a groundbreaking discovery today."

# Expected response:
# {
#   "id": 1,
#   "label": "REAL" or "FAKE",
#   "confidence": 0.xxxx,
#   "explanation": "...",
#   "modality": "text_only"
# }
```

---

## Common Issues & Solutions

### Issue 1: ML Service - Model Not Found

**Error:** `FileNotFoundError: best_model.pt`

**Solution:**
```bash
# Verify model exists
ls -lh ml/checkpoints/best_model.pt

# If missing, run Phase 2 training first
cd ml
python train/train.py
```

### Issue 2: Backend - Database Connection Failed

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux

# Verify it's running
psql -U postgres -c "SELECT version();"

# Check credentials in backend/.env match your database
```

### Issue 3: Backend - ML Service Unavailable

**Error:** `ML service is unavailable`

**Solution:**
```bash
# Ensure ML service is running on port 8000
curl http://localhost:8000/health

# If not running, start it:
cd ml/inference
source ../../venv/bin/activate
python -m uvicorn app:app --port 8000
```

### Issue 4: Port Already in Use

**Error:** `Address already in use`

**Solution:**
```bash
# Find process using the port
lsof -i :8000  # For ML service
lsof -i :5000  # For backend

# Kill the process
kill -9 <PID>

# Or use a different port
# Phase 3: python -m uvicorn app:app --port 8001
# Phase 4: PORT=5001 npm run dev
```

### Issue 5: Module Import Errors (Phase 3)

**Error:** `ModuleNotFoundError: No module named 'transformers'`

**Solution:**
```bash
# Ensure virtual environment is activated
source venv/bin/activate

# Reinstall dependencies
cd ml
pip install -r requirements.txt

# Verify installation
pip list | grep transformers
```

### Issue 6: JWT Authentication Fails

**Error:** `Invalid token` or `No token provided`

**Solution:**
```bash
# Ensure cookies are being saved and sent
# Use -c to save cookies, -b to send them
curl ... -c cookies.txt  # Save
curl ... -b cookies.txt  # Send

# Check JWT_SECRET is set in backend/.env
grep JWT_SECRET backend/.env
```

---

## API Endpoints Reference

### Phase 3 (ML Service) - Port 8000

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | / | API information |
| GET | /health | Health check |
| GET | /docs | Interactive API documentation |
| POST | /predict | Make prediction |

### Phase 4 (Backend) - Port 5000

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | / | No | Service information |
| GET | /api/health | No | Health check |
| **Authentication** |
| POST | /api/auth/signup | No | Register user |
| POST | /api/auth/login | No | Login user |
| POST | /api/auth/logout | No | Logout user |
| **Predictions** |
| POST | /api/predict | Yes | Create prediction |
| GET | /api/predict/:id | Yes | Get prediction |
| POST | /api/predict/:id/feedback | Yes | Submit feedback |
| **History** |
| GET | /api/history | Yes | Get predictions |
| GET | /api/history/stats | Yes | Get statistics |

---

## Development Tips

### Hot Reload

Both services support hot reload in development mode:

- **Phase 3:** `--reload` flag automatically reloads on code changes
- **Phase 4:** `nodemon` automatically restarts on code changes

### Logging

View logs in real-time:

```bash
# Phase 3 - Python logs in terminal
# Look for INFO/ERROR messages

# Phase 4 - Morgan HTTP logs
# Every request is logged automatically
```

### Database Inspection

```bash
# Connect to database
psql -U postgres -d fakenews

# View tables
\dt

# View predictions
SELECT id, title, label, confidence, modality FROM "Predictions" LIMIT 5;

# View users
SELECT id, email, name, role FROM "Users";

# Exit
\q
```

### Clear Database (Reset)

```bash
# Drop and recreate database
psql -U postgres -c "DROP DATABASE fakenews;"
psql -U postgres -c "CREATE DATABASE fakenews;"

# Backend will recreate tables on next start
npm run dev
```

---

## Environment Variables Reference

### Backend (.env)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | No | 5000 | Backend server port |
| NODE_ENV | No | development | Environment mode |
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| DB_HOST | Yes | localhost | Database host |
| DB_PORT | Yes | 5432 | Database port |
| DB_NAME | Yes | fakenews | Database name |
| DB_USER | Yes | postgres | Database user |
| DB_PASSWORD | Yes | - | Database password |
| JWT_SECRET | Yes | - | JWT signing secret |
| JWT_EXPIRES_IN | No | 7d | Token expiration |
| ML_SERVICE_URL | No | http://localhost:8000 | ML service URL |
| UPLOAD_DIR | No | ./uploads | Upload directory |
| MAX_FILE_SIZE | No | 5242880 | Max file size (5MB) |
| FRONTEND_URL | No | http://localhost:3000 | Frontend URL for CORS |

---

## Performance Tuning

### Phase 3 (ML Service)

**Use GPU if available:**
```python
# In predictor.py, it automatically detects:
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
```

**Multiple Workers:**
```bash
# For production, use multiple workers
python -m uvicorn app:app --workers 4
```

**Expected Performance:**
- Model loading: ~5 seconds
- Text-only prediction: ~200ms
- Multimodal prediction: ~300ms

### Phase 4 (Backend)

**Database Connection Pooling:**
Already configured in Sequelize models.

**Expected Performance:**
- Health check: <10ms
- Authentication: <50ms
- Prediction (with ML): ~250-350ms
- History queries: <20ms

---

## Stopping the Services

### Development Mode

Just press `Ctrl+C` in each terminal window.

### Production Mode (PM2)

```bash
# Stop backend
pm2 stop fake-news-backend

# Stop all PM2 processes
pm2 stop all

# View status
pm2 list
```

### Stop PostgreSQL

```bash
# macOS
brew services stop postgresql@15

# Linux
sudo systemctl stop postgresql
```

---

## Next Steps

Once Phase 3 & 4 are running successfully:

1. **Phase 5:** Build the React frontend
2. **Phase 6:** Run integration tests
3. **Production:** Deploy to cloud (AWS, GCP, Azure)

---

## Getting Help

### Documentation

- Phase 3 Spec: `docs/phase-3-inference-service.md`
- Phase 4 Spec: `docs/phase-4-backend-api.md`
- Test Results: `TEST_RESULTS.md`
- Issues Found: `observations.md`

### Logs Location

- **Phase 3:** Terminal output or redirect to file
- **Phase 4:** Terminal output (morgan logs)
- **PostgreSQL:** `/usr/local/var/postgresql@15/server.log` (macOS)

### Common Commands

```bash
# Check if services are running
curl http://localhost:8000/health  # ML Service
curl http://localhost:5000/api/health  # Backend

# View database
psql -U postgres -d fakenews

# Restart services
# Just Ctrl+C and restart with commands above

# Check logs
tail -f backend/logs/*.log  # If file logging enabled
```

---

## Security Checklist for Production

- [ ] Change JWT_SECRET to a strong random value
- [ ] Set strong database password
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Enable database backups
- [ ] Set up monitoring and alerting
- [ ] Review and adjust rate limits
- [ ] Configure CORS for production domains
- [ ] Set up log aggregation

---

## Quick Reference

```bash
# Start everything (3 terminals)

# Terminal 1: Database
brew services start postgresql@15

# Terminal 2: ML Service
cd ml/inference && source ../../venv/bin/activate
python -m uvicorn app:app --port 8000 --reload

# Terminal 3: Backend
cd backend
npm run dev

# Test
curl http://localhost:8000/health
curl http://localhost:5000/api/health
```

**Services will be running at:**
- 🤖 ML Inference: http://localhost:8000
- 🌐 Backend API: http://localhost:5000
- 📚 API Docs: http://localhost:8000/docs
- 💾 Database: localhost:5432

---

**Last Updated:** March 29, 2026  
**Maintainer:** Development Team  
**Status:** ✅ Production Ready
