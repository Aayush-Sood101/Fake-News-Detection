# Multi-Modal Fake News Detection System - Complete Technical Documentation

> A comprehensive end-to-end AI platform for detecting fake news by analyzing text, images, and metadata using deep learning fusion models.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [ML Model - Complete Details](#ml-model---complete-details)
4. [Dataset Documentation](#dataset-documentation)
5. [Backend API Service](#backend-api-service)
6. [Frontend Application](#frontend-application)
7. [ML Inference Service](#ml-inference-service)
8. [Data Pipeline](#data-pipeline)
9. [Configuration Reference](#configuration-reference)
10. [Security Features](#security-features)

---

## System Overview

This system classifies news articles as **REAL** or **FAKE** using multimodal deep learning. It accepts:
- **Text-only** inputs (title + optional body)
- **Image-only** inputs
- **Multimodal** inputs (text + image combined)

The system uses a **cross-attention transformer fusion model** that combines features from both modalities, achieving significantly higher accuracy than single-modality approaches.

### Core Capabilities
- Binary classification: Real vs Fake news
- Confidence scores (0.0 - 1.0)
- Human-readable explanations
- User authentication and prediction history
- Feedback collection for model improvement

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS | User interface |
| **Backend** | Node.js 20, Express 5, Sequelize ORM, PostgreSQL | API gateway, auth, storage |
| **ML Service** | Python 3.10+, PyTorch 2.0+, FastAPI | Model inference |
| **ML Models** | RoBERTa-base (text), ViT-base (image) | Feature extraction |

### Port Configuration
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **ML Service**: `http://localhost:8000`

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                        User (Browser)                          │
└──────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼─────────────────────────────────────┐
│               Next.js Frontend (Port 3000)                      │
│  - Article submission form (text + image upload)               │
│  - Results page with confidence score + explanation            │
│  - History dashboard                                            │
└──────────────────────────┬─────────────────────────────────────┘
                           │ REST API calls
┌──────────────────────────▼─────────────────────────────────────┐
│          Node.js + Express API Gateway (Port 5000)              │
│  - Auth (JWT with HTTP-only cookies)                           │
│  - Input validation & sanitization                             │
│  - Image upload handling (Multer)                              │
│  - Forwards requests to Python inference service               │
│  - Stores results in PostgreSQL                                 │
└──────────┬───────────────────────────┬──────────────────────────┘
           │ SQL                        │ HTTP (internal)
┌──────────▼──────────┐    ┌───────────▼────────────────────────┐
│   PostgreSQL DB      │    │   Python FastAPI Inference Service  │
│  - Users             │    │   (Port 8000)                       │
│  - Predictions       │    │   - Loads trained PyTorch model     │
│  - Feedback          │    │   - Tokenizes text (RoBERTa)        │
└─────────────────────┘    │   - Processes image (ViT)           │
                            │   - Runs fusion + classification    │
                            │   - Returns label + confidence      │
                            └───────────────────────────────────┘
```

### Data Flow

1. User submits article (title, optional body, optional image)
2. Frontend sends FormData to Backend API
3. Backend validates input, authenticates user via JWT cookie
4. Backend forwards text + image to ML Service
5. ML Service preprocesses inputs, runs inference, returns prediction
6. Backend stores prediction in PostgreSQL
7. Backend returns result to Frontend
8. Frontend displays result with explanation

---

## ML Model - Complete Details

### MultiModalFusionNet Architecture

The model is a **cross-attention transformer fusion network** that combines text and image features.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     MultiModalFusionNet                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────┐     ┌──────────────────────┐             │
│  │   Text Encoder       │     │   Image Encoder      │             │
│  │   (RoBERTa-base)     │     │   (ViT-base)         │             │
│  │   768-dim output     │     │   768-dim output     │             │
│  │   12 layers          │     │   12 layers          │             │
│  │   8 frozen layers    │     │   All trainable      │             │
│  └──────────┬───────────┘     └──────────┬───────────┘             │
│             │                            │                          │
│             ▼                            ▼                          │
│  ┌──────────────────────┐     ┌──────────────────────┐             │
│  │   Text Projection    │     │   Image Projection   │             │
│  │   768 → 512          │     │   768 → 512          │             │
│  │   GELU + Dropout     │     │   GELU + Dropout     │             │
│  └──────────┬───────────┘     └──────────┬───────────┘             │
│             │                            │                          │
│             │         OR                 │                          │
│             │         ┌──────────────────┴─────────┐               │
│             │         │  No-Image Token             │               │
│             │         │  (Learnable embedding)      │               │
│             │         └──────────────────┬─────────┘               │
│             │                            │                          │
│             ▼                            ▼                          │
│         ┌────────────────────────────────────────────┐             │
│         │           Cross-Attention Fusion            │             │
│         │   Query: Text   |   Key/Value: Image       │             │
│         │   8 attention heads                         │             │
│         │   + Residual connection + LayerNorm        │             │
│         └────────────────────┬───────────────────────┘             │
│                              │                                      │
│                              ▼                                      │
│         ┌────────────────────────────────────────────┐             │
│         │              Concatenation                  │             │
│         │   [text_proj (512) || fused (512)] = 1024  │             │
│         └────────────────────┬───────────────────────┘             │
│                              │                                      │
│                              ▼                                      │
│         ┌────────────────────────────────────────────┐             │
│         │           Classifier MLP                    │             │
│         │   1024 → 512 → GELU → Dropout              │             │
│         │   512 → 128 → GELU → Dropout               │             │
│         │   128 → 2 (num_classes)                    │             │
│         └────────────────────┬───────────────────────┘             │
│                              │                                      │
│                              ▼                                      │
│                      [REAL, FAKE] logits                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Model Configuration Parameters

```yaml
model:
  text_encoder: "roberta-base"           # HuggingFace model name
  image_encoder: "google/vit-base-patch16-224"  # ViT variant
  projection_dim: 512                    # Dimension after projection
  num_attention_heads: 8                 # Cross-attention heads
  num_classes: 2                         # Binary: Real/Fake
  freeze_text_layers: 8                  # Freeze first 8 RoBERTa layers
  classifier_dropout: 0.2                # Dropout in classifier
  encoder_dropout: 0.1                   # Dropout in projection layers
```

### Text Encoder: RoBERTa-base

- **Architecture**: 12 transformer layers, 768 hidden size, 12 attention heads
- **Vocabulary**: 50,265 tokens (BPE tokenization)
- **Input**: Tokenized text with max length 256 tokens
- **Output**: [CLS] token embedding (768-dim)
- **Freezing**: First 8 layers frozen for faster training and regularization
- **Fine-tuning**: Last 4 layers + embeddings remain trainable

### Image Encoder: ViT-base-patch16-224

- **Architecture**: Vision Transformer with 12 layers, 768 hidden size
- **Input**: 224×224 RGB images, divided into 16×16 patches (196 patches)
- **Output**: [CLS] token embedding (768-dim)
- **Preprocessing**: Resize, normalize (ImageNet stats)
- **Training augmentations**: RandomCrop, HorizontalFlip, ColorJitter

### Cross-Attention Fusion

The fusion mechanism allows text to attend to image features:

```
Query = Text_Projected (512-dim)
Key = Image_Projected (512-dim)  
Value = Image_Projected (512-dim)

Attention(Q, K, V) = softmax(Q·K^T / √d_k) · V

Output = LayerNorm(Attention_Output + Text_Projected)  # Residual
```

### No-Image Token

For text-only inputs, a **learnable embedding** (`no_image_token`) replaces the image features:
- Shape: [1, 1, 512]
- Initialized with normal distribution (std=0.02)
- Trained alongside the model to represent "no image"

### Parameter Count

| Component | Total Params | Trainable |
|-----------|-------------|-----------|
| Text Encoder (RoBERTa) | 125M | ~30M (4 layers) |
| Image Encoder (ViT) | 86M | 86M |
| Projection Heads | ~800K | 800K |
| Cross-Attention | ~1M | 1M |
| Classifier MLP | ~600K | 600K |
| **Total** | **~213M** | **~118M** |

### Training Configuration

```yaml
training:
  batch_size: 16
  gradient_accumulation_steps: 2         # Effective batch = 32
  epochs: 5
  learning_rate_encoder: 2e-5            # Lower LR for encoders
  learning_rate_head: 1e-4               # Higher LR for new layers
  warmup_steps: 200
  weight_decay: 0.01
  max_grad_norm: 1.0                     # Gradient clipping
  label_smoothing: 0.1                   # Prevent overconfidence
  early_stopping_patience: 3
```

### Loss Function: Label Smoothing Cross-Entropy

```python
# Instead of hard targets [1, 0] or [0, 1]:
# With smoothing=0.1:
# - Correct class: 1 - 0.1 = 0.9
# - Incorrect class: 0.1 / (num_classes - 1) = 0.1

loss = -sum(smoothed_targets * log_softmax(logits))
```

Benefits:
- Prevents overconfident predictions
- Improves generalization
- Better calibrated confidence scores

### Optimizer: AdamW with Differential Learning Rates

```python
optimizer = AdamW([
    {'params': encoder_params, 'lr': 2e-5},    # Pre-trained encoders
    {'params': head_params, 'lr': 1e-4}        # New layers
], weight_decay=0.01)
```

### Learning Rate Scheduler: CosineAnnealingWarmRestarts

- Warm restarts every epoch
- Smoothly decays learning rate
- Helps escape local minima

### Mixed Precision Training

- Uses `torch.amp.autocast` for FP16 operations
- `GradScaler` for gradient scaling
- ~2x speedup on modern GPUs

### Evaluation Metrics

| Metric | Description |
|--------|-------------|
| **Accuracy** | Overall correct predictions / total |
| **F1 Score** | Harmonic mean of precision and recall |
| **Precision** | True positives / (True positives + False positives) |
| **Recall** | True positives / (True positives + False negatives) |
| **AUC-ROC** | Area under ROC curve |
| **Confusion Matrix** | True/False positives/negatives breakdown |

---

## Dataset Documentation

### Primary Dataset: Fakeddit

**Source**: Reddit posts with images, labeled for fake news detection.  
**Repository**: https://github.com/entitize/Fakeddit

#### Dataset Fields (TSV Format)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique Reddit post ID |
| `title` | string | Post title/headline text |
| `subreddit` | string | Source subreddit name |
| `score` | integer | Reddit upvote score |
| `upvote_ratio` | float | Ratio of upvotes to total votes |
| `num_comments` | integer | Number of comments |
| `created_utc` | timestamp | Post creation time (UTC) |
| `author` | string | Reddit username |
| `clean_title` | string | Preprocessed title |
| `image_url` | string | URL to original image |
| `hasImage` | boolean | Whether post has image |
| `2_way_label` | integer | Binary label: 0=Real, 1=Fake |
| `3_way_label` | integer | 3-class label |
| `6_way_label` | integer | Fine-grained 6-class label |

#### Label Mapping (2-way)

| Value | Meaning | Description |
|-------|---------|-------------|
| 0 | Real | Authentic, factual content |
| 1 | Fake | Misinformation, satire, or manipulated |

#### Sample Sizes

| Split | Samples | Purpose |
|-------|---------|---------|
| Train Sample | ~5,000 | Training data |
| Validate Sample | ~5,000 | Validation/tuning |
| Test Sample | ~5,000 | Final evaluation |
| **Total Sample** | **~10,000** | After filtering |

Full dataset contains ~1 million samples.

#### Image Storage

- Format: JPEG
- Naming: `{id}.jpg`
- Location: `ml/data/raw/fakeddit/Fakeddit/images/`
- Download: Via `image_downloader.py` script

### Secondary Dataset: NewsCLIPpings

**Source**: News articles with image-text mismatches.  
**Repository**: https://github.com/g-luo/news_clippings  
**Focus**: Detecting falsified image-caption pairs.

#### Dataset Fields (JSON Format)

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique sample ID |
| `caption` | string | News article caption |
| `image_id` | string | ID linking to VisualNews |
| `label` | integer | 0=Pristine (real), 1=Falsified (fake) |
| `source` | string | Origin news outlet |

#### Sample Sizes

| Split | Samples |
|-------|---------|
| Train | ~40,000 |
| Validation | ~8,500 |
| Test | ~8,500 |
| **Total** | **~57,000** |

#### Image Dependency

Images come from the **VisualNews** dataset:
- Requires signing academic license agreement
- Images stored separately
- Linked via `image_id` field

### Normalized Schema

After preprocessing, both datasets are merged into a common schema:

```python
{
    'id': str,          # Unique identifier
    'title': str,       # Article headline/caption
    'body': str,        # Article body (empty for Fakeddit)
    'image_path': str,  # Full path to image file
    'label': int,       # 0=Real, 1=Fake
    'source': str       # 'fakeddit' or 'newsclippings'
}
```

### Data Splits

| Split | Ratio | Purpose |
|-------|-------|---------|
| Train | 80% | Model training |
| Validation | 10% | Hyperparameter tuning |
| Test | 10% | Final evaluation |

All splits are **stratified** to maintain label balance.

### Preprocessing Steps

1. **Load TSV/JSON files** from raw directories
2. **Normalize fields** to common schema
3. **Filter invalid samples**:
   - Remove empty titles
   - Remove samples with missing images
4. **Validate images**: Check file existence
5. **Create stratified splits**
6. **Save as Parquet** for efficient loading

---

## Backend API Service

### Framework & Dependencies

- **Express.js 5.2.1**: HTTP server
- **Sequelize 6.37.8**: ORM for PostgreSQL
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **multer**: File upload handling
- **express-validator**: Input validation
- **express-rate-limit**: Rate limiting
- **helmet**: Security headers

### Database Models

#### User Model

```javascript
{
    id: UUID (Primary Key, auto-generated),
    email: STRING (Unique, Not Null),
    password: STRING (Not Null, bcrypt hashed),
    name: STRING (Optional),
    role: STRING (Default: "user", Options: "user", "admin"),
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP
}

// Relationships
User.hasMany(Prediction)
```

#### Prediction Model

```javascript
{
    id: UUID (Primary Key, auto-generated),
    title: TEXT (Not Null),           // Article headline
    body: TEXT (Optional),            // Article content
    imageUrl: TEXT (Optional),        // S3 URL (future)
    label: STRING (Not Null),         // "REAL" or "FAKE"
    confidence: FLOAT (Not Null),     // 0.0 - 1.0
    explanation: TEXT,                // Human-readable explanation
    modality: ENUM ['text_only', 'multimodal'],
    feedback: ENUM ['correct', 'incorrect', null],
    userId: UUID (Foreign Key),
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP
}

// Relationships
Prediction.belongsTo(User)
```

### API Endpoints

#### Authentication

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/auth/signup` | POST | ❌ | 5/15min | User registration |
| `/api/auth/login` | POST | ❌ | 5/15min | User login, returns JWT |
| `/api/auth/logout` | POST | ❌ | 5/15min | Clear JWT cookie |

**Signup Request:**
```json
{
    "email": "user@example.com",
    "password": "securePassword123",
    "name": "John Doe",
    "role": "user"
}
```

**Login Response:**
```json
{
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user"
}
```

#### Predictions

| Endpoint | Method | Auth | Rate Limit | Description |
|----------|--------|------|------------|-------------|
| `/api/predict` | POST | ✅ | 20/15min | Submit prediction |
| `/api/predict/:id` | GET | ✅ | General | Get prediction by ID |
| `/api/predict/:id/feedback` | POST | ✅ | General | Submit feedback |

**Prediction Request (FormData):**
- `title`: string (required, 5-1000 chars)
- `body`: string (optional, max 10000 chars)
- `image`: File (optional, JPEG/PNG/WEBP/GIF, max 5MB)

**Prediction Response:**
```json
{
    "id": 1,
    "label": "FAKE",
    "confidence": 0.92,
    "explanation": "🚨 HIGH CONFIDENCE: This content is likely FAKE...",
    "modality": "multimodal",
    "createdAt": "2024-01-01T12:00:00Z"
}
```

#### History

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/history` | GET | ✅ | User's prediction history |
| `/api/history/stats` | GET | ✅ | User statistics |

**History Query Params:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `label`: "REAL" | "FAKE" (filter)

**Stats Response:**
```json
{
    "totalPredictions": 42,
    "averageConfidence": 0.78,
    "realCount": 25,
    "fakeCount": 17
}
```

#### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Backend + DB + ML service status |

### Middleware Stack

1. **Cookie Parser**: Parse JWT from cookies
2. **Morgan**: HTTP request logging
3. **Helmet**: Security headers (CSP, XSS, etc.)
4. **CORS**: Cross-origin configuration
5. **Express JSON/Form Parser**: Request body parsing
6. **Rate Limiting**: Per-endpoint limits
7. **Authentication**: JWT verification
8. **Input Validation**: express-validator rules

### Rate Limits

| Category | Limit | Window |
|----------|-------|--------|
| API General | 100 requests | 15 minutes |
| Authentication | 5 requests | 15 minutes |
| Predictions | 20 requests | 15 minutes |

---

## Frontend Application

### Framework & Stack

- **Next.js 16**: React framework with App Router
- **React 19**: UI library
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling
- **Axios**: HTTP client
- **react-hook-form**: Form handling

### Directory Structure

```
frontend/src/
├── app/
│   ├── page.tsx           # Landing page
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles
│   ├── predict/page.tsx   # Prediction form
│   ├── history/page.tsx   # User history
│   ├── login/page.tsx     # Login page
│   └── signup/page.tsx    # Signup page
├── components/
│   ├── Header.tsx         # Navigation header
│   ├── Footer.tsx         # Page footer
│   ├── PredictionResult.tsx    # Result display
│   ├── HistoryTable.tsx   # History list
│   ├── StatsCards.tsx     # Statistics cards
│   └── ProtectedRoute.tsx # Auth wrapper
├── contexts/
│   └── AuthContext.tsx    # Auth state management
└── lib/
    └── api.ts             # API client
```

### Authentication Flow

1. User enters credentials on login/signup page
2. Frontend sends POST to backend
3. Backend validates, creates JWT, sets HTTP-only cookie
4. Frontend stores user info in localStorage + context
5. `ProtectedRoute` wrapper checks auth state
6. API calls include credentials (cookies auto-attached)
7. 401 responses redirect to login

### Key Components

#### AuthContext

Global authentication state with:
- `user`: Current user object or null
- `login()`: Authenticate user
- `signup()`: Register user
- `logout()`: Clear session
- Persists to localStorage

#### ProtectedRoute

Wrapper that redirects to `/login` if not authenticated:
```tsx
<ProtectedRoute>
  <PredictPage />
</ProtectedRoute>
```

#### PredictionResult

Displays prediction with:
- Label badge (REAL=green, FAKE=red)
- Confidence progress bar
- Explanation text
- Feedback buttons (correct/incorrect)

### API Client

```typescript
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true  // Send cookies
});

// Auto-redirect on 401
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);
```

---

## ML Inference Service

### Framework

- **FastAPI**: High-performance async web framework
- **Uvicorn**: ASGI server
- **Pydantic**: Request/response validation

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check |
| `/predict` | POST | Make prediction |

### Predict Endpoint

**Request (FormData):**
- `title`: string (required)
- `body`: string (optional)
- `image`: File (optional)

**Response:**
```json
{
    "label": "FAKE",
    "confidence": 0.92,
    "explanation": "🚨 HIGH CONFIDENCE: This content is likely FAKE...",
    "modality": "multimodal"
}
```

### FakeNewsPredictor Class

```python
class FakeNewsPredictor:
    def __init__(self, model_path: str):
        # Auto-detect device (CUDA/MPS/CPU)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Initialize preprocessors
        self.text_preprocessor = TextPreprocessor(model_name="roberta-base")
        self.image_preprocessor = ImagePreprocessor()
        self.explainer = PredictionExplainer()
        
        # Load model
        self.model = MultiModalFusionNet(ModelConfig())
        self.model.load_state_dict(torch.load(model_path))
        self.model.to(self.device)
        self.model.eval()
    
    def predict(self, title, body="", image_bytes=None):
        # Preprocess text
        text_inputs = self.text_preprocessor.preprocess(title + " " + body)
        
        # Preprocess image (if provided)
        pixel_values = None
        modality = "text_only"
        if image_bytes:
            pixel_values = self.image_preprocessor.preprocess_from_bytes(image_bytes)
            modality = "multimodal"
        
        # Run inference
        with torch.no_grad():
            logits = self.model(input_ids, attention_mask, pixel_values)
            probs = torch.softmax(logits, dim=-1)
            pred = torch.argmax(probs, dim=-1).item()
            confidence = probs[0][pred].item()
        
        label = "REAL" if pred == 1 else "FAKE"
        explanation = self.explainer.explain(label, confidence, modality)
        
        return {
            "label": label,
            "confidence": confidence,
            "explanation": explanation,
            "modality": modality
        }
```

### Text Preprocessor

Uses RoBERTa tokenizer:
- Max length: 512 tokens
- Padding: max_length
- Truncation: enabled
- Returns: `input_ids` + `attention_mask` tensors

### Image Preprocessor

Transforms images for ViT:
1. Resize to 224×224
2. Convert to tensor
3. Normalize with ImageNet stats:
   - Mean: [0.485, 0.456, 0.406]
   - Std: [0.229, 0.224, 0.225]
4. Add batch dimension

### Explanation Generator

Generates human-readable explanations based on:
- **Label**: REAL or FAKE
- **Confidence tier**: High (≥0.85), Medium (0.65-0.85), Low (<0.65)
- **Modality**: text_only or multimodal

Example explanations:
- 🚨 **HIGH CONFIDENCE FAKE**: "This content is likely FAKE news. Our model detected strong indicators of misinformation."
- ✅ **HIGH CONFIDENCE REAL**: "This content appears credible and likely authentic."
- 🔍 **MODERATE CONFIDENCE**: "This content seems legitimate based on our analysis. Consider verifying."

---

## Data Pipeline

### Pipeline Steps

1. **Download Fakeddit**
   ```bash
   python ml/data/scripts/download_fakeddit.py
   ```
   - Clones GitHub repository
   - Downloads TSV metadata files

2. **Download Images**
   ```bash
   cd ml/data/raw/fakeddit/Fakeddit
   python image_downloader.py multimodal_only_samples/train_sample.tsv
   python image_downloader.py multimodal_only_samples/validate_sample.tsv
   python image_downloader.py multimodal_only_samples/test_sample.tsv
   ```
   - Downloads images with rate limiting
   - Estimated time: 30-90 minutes

3. **Run Preprocessing**
   ```bash
   python ml/data/scripts/preprocess_pipeline.py
   ```
   - Loads TSV files
   - Normalizes to common schema
   - Filters invalid samples
   - Creates stratified splits
   - Saves as Parquet files

4. **Verify Data**
   ```bash
   python ml/data/scripts/verify_data.py
   ```
   - Checks all columns exist
   - Reports label distribution
   - Validates image paths

### Output Files

```
ml/data/processed/
├── train.parquet     # Training data
├── val.parquet       # Validation data
└── test.parquet      # Test data
```

---

## Configuration Reference

### ML Configuration (config.yaml)

```yaml
# Data paths
data:
  raw_fakeddit: "ml/data/raw/fakeddit"
  raw_newsclippings: "ml/data/raw/newsclippings"
  visualnews_images: "ml/data/raw/newsclippings/visualnews_images"
  processed: "ml/data/processed"
  use_sample: true

# Model configuration
model:
  text_encoder: "roberta-base"
  image_encoder: "google/vit-base-patch16-224"
  projection_dim: 512
  num_attention_heads: 8
  num_classes: 2
  freeze_text_layers: 8
  classifier_dropout: 0.2
  encoder_dropout: 0.1

# Training configuration
training:
  batch_size: 16
  gradient_accumulation_steps: 2
  epochs: 5
  learning_rate_encoder: 0.00002
  learning_rate_head: 0.0001
  warmup_steps: 200
  weight_decay: 0.01
  max_grad_norm: 1.0
  label_smoothing: 0.1
  early_stopping_patience: 3

# Preprocessing
preprocessing:
  max_text_length: 256
  image_size: 224

# Paths
paths:
  checkpoints: "ml/checkpoints"
  logs: "ml/logs"

# Hardware
hardware:
  mixed_precision: true
  num_workers: 4
  device: "auto"

# Experiment tracking
wandb:
  enabled: false
  project: "fake-news-detection"
```

### Backend Environment Variables

```bash
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/fakenews
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fakenews
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d

# ML Service
ML_SERVICE_URL=http://localhost:8000

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Frontend
FRONTEND_URL=http://localhost:3000

# AWS S3 (Optional)
USE_S3=false
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET=fake-news-images
```

### Frontend Environment

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## Security Features

### Authentication
- ✅ JWT tokens with 7-day expiration
- ✅ HTTP-only cookies (prevents XSS)
- ✅ sameSite: strict (CSRF protection)
- ✅ secure: true in production (HTTPS only)
- ✅ Password hashing with bcryptjs

### API Security
- ✅ Helmet security headers
- ✅ CORS with configurable origins
- ✅ Rate limiting on all endpoints
- ✅ Input validation with express-validator
- ✅ File type validation (MIME types)
- ✅ File size limits (5MB max)

### Data Security
- ✅ User isolation (own predictions only)
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ Error details hidden in production

### Best Practices
- ✅ No secrets in code
- ✅ Environment-based configuration
- ✅ Comprehensive .gitignore

---

## Running the System

### 1. Start ML Service

```bash
cd ml
pip install -r requirements.txt
uvicorn inference.app:app --host 0.0.0.0 --port 8000
```

### 2. Start Backend

```bash
cd backend
npm install
npm run dev  # Development with nodemon
```

### 3. Start Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Access Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- ML API Docs: http://localhost:8000/docs

---

## Training the Model

```bash
# 1. Setup data pipeline
python ml/setup_phase1.py

# 2. Download images (manual step)
cd ml/data/raw/fakeddit/Fakeddit
python image_downloader.py multimodal_only_samples/train_sample.tsv

# 3. Run preprocessing
python ml/data/scripts/preprocess_pipeline.py

# 4. Train model
python ml/train/train.py --config ml/configs/config.yaml

# 5. Evaluate model
python ml/train/evaluate_model.py \
    --checkpoint ml/checkpoints/best_model.pt \
    --data ml/data/processed/test.parquet \
    --config ml/configs/config.yaml
```

---

## File Structure Summary

```
Multi-Modal/
├── README.md                    # Project overview
├── explanation.md               # This documentation
├── download_images.sh           # Image download script
├── cookies.txt                  # Dev testing cookie
│
├── backend/                     # Node.js API
│   ├── src/
│   │   ├── server.js           # Entry point
│   │   ├── config/config.json  # Database config
│   │   ├── routes/             # API routes
│   │   ├── controllers/        # Business logic
│   │   ├── models/             # Sequelize models
│   │   ├── middleware/         # Auth, validation, upload
│   │   ├── lib/token.js        # JWT utilities
│   │   └── utils/pythonClient.js  # ML service client
│   └── package.json
│
├── frontend/                    # Next.js app
│   ├── src/
│   │   ├── app/               # Pages (App Router)
│   │   ├── components/        # React components
│   │   ├── contexts/          # State management
│   │   └── lib/api.ts         # API client
│   └── package.json
│
├── ml/                          # Python ML
│   ├── train/
│   │   ├── model.py           # MultiModalFusionNet
│   │   ├── dataset.py         # PyTorch Dataset
│   │   ├── train.py           # Training script
│   │   ├── losses.py          # Custom losses
│   │   └── evaluate_model.py  # Evaluation
│   ├── inference/
│   │   ├── app.py             # FastAPI server
│   │   ├── predictor.py       # Prediction pipeline
│   │   ├── preprocess.py      # Text/image preprocessing
│   │   ├── explainer.py       # Explanation generation
│   │   └── schemas.py         # Pydantic models
│   ├── data/
│   │   ├── raw/               # Downloaded datasets
│   │   ├── processed/         # Parquet files
│   │   └── scripts/           # Pipeline scripts
│   ├── checkpoints/           # Model weights
│   ├── configs/config.yaml    # Training config
│   └── requirements.txt
│
├── docs/                        # Phase documentation
│   ├── phase-1-data-pipeline.md
│   ├── phase-2-model-training.md
│   ├── phase-3-inference-service.md
│   ├── phase-4-backend-api.md
│   ├── phase-5-frontend.md
│   └── phase-6-integration-testing.md
│
└── venv/                        # Python virtual environment
```

---

*Generated from complete codebase analysis.*
