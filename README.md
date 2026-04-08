# 🔍 Multi-Modal Fake News Detection System

> An end-to-end AI-powered platform that detects fake news by jointly analyzing **text**, **images**, and **metadata** using deep learning fusion models. Built with Next.js (frontend), Node.js + Express (backend API gateway), and Python (ML training & inference).

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Directory Structure](#directory-structure)
4. [Tech Stack](#tech-stack)
5. [Datasets](#datasets)
6. [ML Model — Training & Architecture](#ml-model--training--architecture)
7. [Backend — Node.js + Express](#backend--nodejs--express)
8. [Frontend — Next.js](#frontend--nextjs)
9. [Python Inference Service](#python-inference-service)
10. [Data Pipeline](#data-pipeline)
11. [API Reference](#api-reference)
12. [Environment Variables](#environment-variables)
13. [Setup & Installation](#setup--installation)
14. [Implementation Phases](#implementation-phases)
15. [Key Implementation Details](#key-implementation-details)

---

## Project Overview

This system takes a **news article** (title + body text) and an optional **associated image**, and classifies it as **REAL** or **FAKE** with a confidence score and explanation. The model fuses features from both modalities using a cross-attention transformer, making it significantly more accurate than text-only or image-only approaches.

### Core Capabilities
- Classify news as Real / Fake with a confidence percentage
- Accept text-only, image-only, or both (multimodal) inputs
- Return highlighted explanation of what signals triggered the classification
- Store prediction history per user
- Admin dashboard with aggregated statistics

---

## System Architecture

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
│  - Auth (JWT)                                                   │
│  - Input validation & sanitization                             │
│  - Image upload handling (Multer → S3)                         │
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

---

## Directory Structure

```
fake-news-detector/
│
├── frontend/                        # Next.js application
│   ├── app/
│   │   ├── page.tsx                 # Landing / submission page
│   │   ├── result/page.tsx          # Result display page
│   │   ├── history/page.tsx         # User history
│   │   └── admin/page.tsx           # Admin dashboard
│   ├── components/
│   │   ├── ArticleForm.tsx          # Input form component
│   │   ├── ResultCard.tsx           # Prediction result card
│   │   ├── ConfidenceBar.tsx        # Visual confidence indicator
│   │   └── ImageUpload.tsx          # Drag-and-drop image uploader
│   ├── lib/
│   │   └── api.ts                   # Axios API client
│   └── public/
│
├── backend/                         # Node.js + Express API gateway
│   ├── src/
│   │   ├── server.js                # Entry point
│   │   ├── routes/
│   │   │   ├── predict.js           # POST /api/predict
│   │   │   ├── auth.js              # POST /api/auth/login|register
│   │   │   └── history.js           # GET /api/history
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification
│   │   │   ├── upload.js            # Multer config
│   │   │   └── validate.js          # Input validation
│   │   ├── controllers/
│   │   │   └── predict.js           # Core prediction logic
│   │   ├── models/
│   │   │   ├── User.js              # Sequelize User model
│   │   │   └── Prediction.js        # Sequelize Prediction model
│   │   └── utils/
│   │       ├── s3.js                # AWS S3 helper
│   │       └── pythonClient.js      # HTTP client for inference service
│   └── package.json
│
├── ml/                              # Python ML service
│   ├── train/
│   │   ├── train.py                 # Main training script
│   │   ├── dataset.py               # PyTorch Dataset classes
│   │   ├── model.py                 # Model architecture definition
│   │   ├── losses.py                # Custom loss functions
│   │   └── evaluate.py              # Evaluation + metrics
│   ├── inference/
│   │   ├── app.py                   # FastAPI inference server
│   │   ├── predictor.py             # Prediction pipeline
│   │   └── preprocess.py            # Text + image preprocessing
│   ├── data/
│   │   ├── raw/                     # Downloaded raw datasets
│   │   ├── processed/               # Cleaned, tokenized data
│   │   └── scripts/
│   │       ├── download_fakeddit.py
│   │       ├── download_newsclippings.py
│   │       └── preprocess_pipeline.py
│   ├── checkpoints/                 # Saved model weights (.pt files)
│   ├── configs/
│   │   └── config.yaml              # Hyperparameters & paths
│   └── requirements.txt
│
├── docker/
│   ├── docker-compose.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.ml
│   └── Dockerfile.frontend
│
└── README.md
```

---

## Tech Stack

### Frontend
| Tool | Version | Purpose |
|------|---------|---------|
| **Next.js** | 14+ (App Router) | React framework, SSR, routing |
| **TypeScript** | 5+ | Type safety |
| **Tailwind CSS** | 3+ | Styling |
| **Axios** | Latest | HTTP client for API calls |
| **React Dropzone** | Latest | Image drag-and-drop upload |
| **Recharts** | Latest | Admin dashboard charts |
| **shadcn/ui** | Latest | UI component library |

### Backend (API Gateway)
| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | 20 LTS | Runtime |
| **Express.js** | 4+ | HTTP server & routing |
| **Sequelize** | 6+ | ORM for PostgreSQL |
| **PostgreSQL** | 15+ | Primary database |
| **Multer** | Latest | Multipart file uploads |
| **AWS SDK (S3)** | v3 | Image storage |
| **jsonwebtoken** | Latest | JWT auth |
| **bcryptjs** | Latest | Password hashing |
| **axios** | Latest | Internal HTTP to Python service |
| **express-validator** | Latest | Input validation |
| **cors / helmet** | Latest | Security middleware |

### ML / Python Inference Service
| Tool | Version | Purpose |
|------|---------|---------|
| **Python** | 3.10 - 3.13 | Language |
| **PyTorch** | 2.0+ | Deep learning framework |
| **HuggingFace Transformers** | 4.30+ | RoBERTa, ViT pretrained models |
| **HuggingFace Datasets** | Latest | Dataset loading utilities |
| **FastAPI** | Latest | Inference REST API |
| **Uvicorn** | Latest | ASGI server |
| **Pillow (PIL)** | Latest | Image loading & transforms |
| **torchvision** | 0.15+ | Image augmentation |
| **scikit-learn** | Latest | Metrics (F1, ROC-AUC) |
| **pandas / numpy** | Latest | Data manipulation |
| **Weights & Biases (wandb)** | Latest | Experiment tracking |
| **ONNX** | Latest | Model optimization (optional) |

### Infrastructure
| Tool | Purpose |
|------|---------|
| **Docker + Docker Compose** | Containerization of all services |
| **AWS S3** | Image file storage |
| **Redis** | Optional: caching frequent predictions |

---

## Datasets

### Primary Dataset 1 — Fakeddit

- **Source**: Reddit posts across 22 subreddits
- **Download**: `https://github.com/entitize/Fakeddit`
- **Size**: ~1 million samples (use the 2-way or 3-way split subsets for training)
- **Modalities**: Title text + image + metadata (subreddit, score, upvote_ratio, num_comments)
- **Labels**: `0` = Real, `1` = Fake (2-way classification)
- **Format**: TSV files for splits + separate image download script
- **Why use it**: Largest publicly available multimodal fake news dataset; covers diverse topics; includes metadata signals

**Files you will use:**
```
multimodal_only_samples/     ← Samples that have BOTH text and image
  train.tsv
  validate.tsv
  test.tsv
images/                      ← Downloaded separately using their image_downloader.py
```

**Key columns in TSV:**
```
id, author, title, num_comments, score, upvote_ratio, image_url,
created_utc, domain, subreddit, 2_way_label, 3_way_label, 6_way_label
```

---

### Primary Dataset 2 — NewsCLIPpings

- **Source**: VisualNews dataset + automatically mined mismatched image-text pairs
- **Download**: `https://github.com/g-luo/news_clippings`
- **Size**: ~71,000 image-text pairs
- **Modalities**: News caption (text) + image
- **Labels**: `pristine` (real/matched) vs `falsified` (fake/mismatched)
- **Format**: JSON splits + images from VisualNews
- **Why use it**: Specifically targets **image-text inconsistency**, which is the most common form of visual fake news (real image used with misleading caption)

**Files you will use:**
```
news_clippings/data/
  merged_balanced/
    train.json
    val.json
    test.json
```

**JSON entry structure:**
```json
{
  "id": 12345,
  "image_id": "abc123",
  "caption": "Article headline or caption text...",
  "label": 0,           // 0 = pristine (real), 1 = falsified (fake)
  "falsified_by": "..."  // only present for fake samples
}
```

---

### Dataset Split Strategy

Train the model using **both datasets combined**:

```
Total training data:
  - Fakeddit (multimodal subset): ~200K samples
  - NewsCLIPpings:                ~57K samples
  ----------------------------------------
  Combined train set:             ~257K samples
  Validation set:                 ~30K samples (stratified)
  Test set:                       ~30K samples (stratified)
```

Balance classes using **weighted random sampling** during training to handle label imbalance.

---

## ML Model — Training & Architecture

### Model Architecture: MultiModalFusionNet

```
Input A: Article Title + Body Text
         │
         ▼
    [RoBERTa-base Encoder]         ← Frozen first 8 layers, fine-tune last 4
    Hidden size: 768
    Output: [CLS] token embedding
         │
         ▼
    Text Projection Layer
    Linear(768 → 512) + GELU + Dropout(0.1)
         │
         └──────────────────────────┐
                                    │
Input B: Associated Image           │
         │                          │
         ▼                          │
    [ViT-base/16 Encoder]           │  ← from HuggingFace: google/vit-base-patch16-224
    Patch size: 16x16               │
    Output: [CLS] token embedding   │
    Hidden size: 768                │
         │                          │
         ▼                          │
    Image Projection Layer          │
    Linear(768 → 512) + GELU + Dropout(0.1)
         │                          │
         └──────────────────────────┤
                                    │
                          ┌─────────▼──────────┐
                          │  Cross-Attention    │
                          │  Fusion Module      │
                          │                     │
                          │  Q = text_emb       │
                          │  K = V = img_emb    │
                          │  MultiheadAttn(     │
                          │    embed_dim=512,   │
                          │    num_heads=8      │
                          │  )                  │
                          │  + residual + norm  │
                          └─────────┬──────────┘
                                    │
                          Concatenate(
                            text_proj + fused_cross_attn
                          ) → dim 1024
                                    │
                          ┌─────────▼──────────┐
                          │   MLP Classifier    │
                          │  Linear(1024→512)   │
                          │  GELU + Dropout     │
                          │  Linear(512→128)    │
                          │  GELU + Dropout     │
                          │  Linear(128→2)      │
                          └─────────┬──────────┘
                                    │
                          Softmax → [P(Real), P(Fake)]
```

> **Text-only fallback**: If no image is provided, the image embedding is replaced with a **learned zero-image token** (a trained embedding that acts as "no image signal"). This allows the same model to handle both text-only and multimodal inputs.

---

### model.py — Key Code Sketch

```python
class MultiModalFusionNet(nn.Module):
    def __init__(self, config):
        super().__init__()
        # Text encoder
        self.text_encoder = RobertaModel.from_pretrained("roberta-base")
        # Freeze early layers
        for i, layer in enumerate(self.text_encoder.encoder.layer):
            if i < 8:
                for param in layer.parameters():
                    param.requires_grad = False

        # Image encoder
        self.image_encoder = ViTModel.from_pretrained("google/vit-base-patch16-224")

        # Projection heads
        self.text_proj = nn.Sequential(nn.Linear(768, 512), nn.GELU(), nn.Dropout(0.1))
        self.image_proj = nn.Sequential(nn.Linear(768, 512), nn.GELU(), nn.Dropout(0.1))

        # Cross-attention fusion
        self.cross_attn = nn.MultiheadAttention(embed_dim=512, num_heads=8, batch_first=True)
        self.norm = nn.LayerNorm(512)

        # No-image token (learnable)
        self.no_image_token = nn.Parameter(torch.zeros(1, 512))

        # Classifier MLP
        self.classifier = nn.Sequential(
            nn.Linear(1024, 512), nn.GELU(), nn.Dropout(0.2),
            nn.Linear(512, 128), nn.GELU(), nn.Dropout(0.2),
            nn.Linear(128, 2)
        )

    def forward(self, input_ids, attention_mask, pixel_values=None):
        # Text encoding
        text_out = self.text_encoder(input_ids=input_ids, attention_mask=attention_mask)
        text_cls = text_out.last_hidden_state[:, 0, :]  # [CLS] token
        text_proj = self.text_proj(text_cls).unsqueeze(1)  # [B, 1, 512]

        # Image encoding (or no-image fallback)
        if pixel_values is not None:
            img_out = self.image_encoder(pixel_values=pixel_values)
            img_cls = img_out.last_hidden_state[:, 0, :]
            img_proj = self.image_proj(img_cls).unsqueeze(1)  # [B, 1, 512]
        else:
            img_proj = self.no_image_token.expand(text_proj.size(0), 1, -1)

        # Cross-attention: text attends to image
        fused, _ = self.cross_attn(query=text_proj, key=img_proj, value=img_proj)
        fused = self.norm(fused + text_proj).squeeze(1)  # residual + [B, 512]

        # Concatenate text + fused
        combined = torch.cat([text_proj.squeeze(1), fused], dim=-1)  # [B, 1024]
        return self.classifier(combined)
```

---

### Training Configuration

| Hyperparameter | Value |
|---|---|
| Optimizer | AdamW |
| Learning rate | 2e-5 (encoders), 1e-4 (projection + classifier) |
| LR scheduler | Cosine annealing with warmup (500 steps) |
| Batch size | 32 (gradient accumulation × 4 = effective 128) |
| Epochs | 10 (early stopping patience = 3) |
| Loss function | CrossEntropyLoss with label smoothing (0.1) |
| Mixed precision | fp16 via `torch.cuda.amp` |
| Max text length | 256 tokens |
| Image size | 224 × 224 |
| Dropout | 0.1 (encoders), 0.2 (classifier) |

---

### Training Script — train.py Key Logic

```python
# Pseudocode for training loop
for epoch in range(config.epochs):
    model.train()
    for batch in train_loader:
        with torch.cuda.amp.autocast():
            logits = model(
                input_ids=batch["input_ids"],
                attention_mask=batch["attention_mask"],
                pixel_values=batch.get("pixel_values")  # None for text-only samples
            )
            loss = criterion(logits, batch["labels"])

        scaler.scale(loss).backward()

        if (step + 1) % config.grad_accum_steps == 0:
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            scaler.step(optimizer)
            scaler.update()
            scheduler.step()
            optimizer.zero_grad()

        wandb.log({"train/loss": loss.item(), "train/lr": scheduler.get_last_lr()[0]})

    val_metrics = evaluate(model, val_loader)
    if val_metrics["f1"] > best_f1:
        torch.save(model.state_dict(), "checkpoints/best_model.pt")
```

---

### dataset.py — Dataset Class Sketch

```python
class FakeNewsDataset(Dataset):
    def __init__(self, data_df, tokenizer, image_transform, img_dir, split="train"):
        self.data = data_df
        self.tokenizer = tokenizer
        self.transform = image_transform
        self.img_dir = img_dir

    def __getitem__(self, idx):
        row = self.data.iloc[idx]

        # Tokenize text (title + body concatenated with [SEP])
        encoding = self.tokenizer(
            row["title"], row.get("body", ""),
            max_length=256, padding="max_length",
            truncation=True, return_tensors="pt"
        )

        # Load image if available
        pixel_values = None
        img_path = os.path.join(self.img_dir, f"{row['id']}.jpg")
        if os.path.exists(img_path):
            img = Image.open(img_path).convert("RGB")
            pixel_values = self.transform(img)

        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "pixel_values": pixel_values,  # None if no image
            "labels": torch.tensor(row["label"], dtype=torch.long)
        }
```

---

### Image Preprocessing / Augmentation

```python
train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.RandomCrop(224),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(brightness=0.2, contrast=0.2),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])

val_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                         std=[0.229, 0.224, 0.225])
])
```

---

### Expected Model Performance (Target Benchmarks)

| Metric | Text-only Baseline | Multimodal (This Model) |
|---|---|---|
| Accuracy | ~82% | ~89% |
| F1 Score | ~81% | ~88% |
| AUC-ROC | ~0.87 | ~0.94 |
| Precision | ~80% | ~87% |
| Recall | ~82% | ~89% |

---

## Backend — Node.js + Express

### Responsibilities
- Receive article text + optional image from the Next.js frontend
- Validate and sanitize all input
- Upload image to S3 and generate a public URL
- Forward the request to the Python inference service via internal HTTP call
- Store the prediction result in PostgreSQL
- Return the result to the frontend
- Handle user auth (register, login, JWT refresh)

---

### Core Route: POST /api/predict

```javascript
// routes/predict.js (simplified)
router.post("/predict",
  authMiddleware,
  upload.single("image"),          // Multer handles multipart
  validatePredictInput,            // express-validator checks
  async (req, res) => {
    const { title, body } = req.body;
    const imageFile = req.file;

    // 1. Upload image to S3 (if provided)
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadToS3(imageFile);
    }

    // 2. Call Python inference service
    const inferenceResponse = await pythonClient.post("/predict", {
      title,
      body: body || "",
      image_url: imageUrl
    });

    const { label, confidence, explanation } = inferenceResponse.data;

    // 3. Save to DB
    await Prediction.create({
      userId: req.user.id,
      title,
      imageUrl,
      label,
      confidence,
      explanation,
      createdAt: new Date()
    });

    // 4. Return to frontend
    return res.json({ label, confidence, explanation, imageUrl });
  }
);
```

---

### Database Schema

**Users Table**
```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,       -- bcrypt hash
  name        VARCHAR(100),
  role        VARCHAR(20) DEFAULT 'user',  -- 'user' | 'admin'
  created_at  TIMESTAMP DEFAULT NOW()
);
```

**Predictions Table**
```sql
CREATE TABLE predictions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  body          TEXT,
  image_url     TEXT,
  label         VARCHAR(10) NOT NULL,    -- 'REAL' | 'FAKE'
  confidence    FLOAT NOT NULL,          -- 0.0 to 1.0
  explanation   TEXT,
  feedback      VARCHAR(10),             -- 'correct' | 'incorrect' | NULL
  created_at    TIMESTAMP DEFAULT NOW()
);
```

---

### Multer + S3 Upload Config

```javascript
// middleware/upload.js
const multer = require("multer");
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },  // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    cb(null, allowed.includes(file.mimetype));
  }
});

// utils/s3.js
const uploadToS3 = async (file) => {
  const key = `uploads/${Date.now()}-${uuidv4()}.jpg`;
  await s3Client.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  }));
  return `https://${process.env.S3_BUCKET}.s3.amazonaws.com/${key}`;
};
```

---

## Frontend — Next.js

### Pages Overview

| Route | Component | Description |
|---|---|---|
| `/` | `app/page.tsx` | Article submission form |
| `/result/[id]` | `app/result/page.tsx` | Prediction result display |
| `/history` | `app/history/page.tsx` | User's past predictions |
| `/admin` | `app/admin/page.tsx` | Admin analytics dashboard |
| `/login` | `app/login/page.tsx` | Login / Register |

---

### ArticleForm Component Logic

```typescript
// components/ArticleForm.tsx (simplified)
const ArticleForm = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("body", body);
    if (image) formData.append("image", image);

    const res = await axios.post("/api/predict", formData, {
      headers: { "Content-Type": "multipart/form-data",
                 "Authorization": `Bearer ${getToken()}` }
    });
    router.push(`/result/${res.data.id}`);
  };
  // ...
};
```

---

### Result Display

The result page shows:
- **Verdict badge**: `FAKE` (red) or `REAL` (green)
- **Confidence bar**: percentage with color gradient
- **Explanation text**: natural language from the model
- **Modality indicator**: whether text-only or multimodal was used
- **Feedback buttons**: thumbs up / down to flag incorrect predictions

---

## Python Inference Service

### FastAPI App — app.py

```python
# inference/app.py
from fastapi import FastAPI
from pydantic import BaseModel
from predictor import FakeNewsPredictor

app = FastAPI()
predictor = FakeNewsPredictor(model_path="best_model.pt")

class PredictRequest(BaseModel):
    title: str
    body: str = ""
    image_url: str | None = None

@app.post("/predict")
async def predict(request: PredictRequest):
    result = predictor.predict(
        title=request.title,
        body=request.body,
        image_url=request.image_url
    )
    return {
        "label": result["label"],          # "REAL" or "FAKE"
        "confidence": result["confidence"], # float 0-1
        "explanation": result["explanation"]
    }

@app.get("/health")
def health():
    return {"status": "ok"}
```

---

### Predictor Pipeline — predictor.py

```python
class FakeNewsPredictor:
    def __init__(self, model_path):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.tokenizer = RobertaTokenizer.from_pretrained("roberta-base")
        self.image_processor = ViTFeatureExtractor.from_pretrained("google/vit-base-patch16-224")
        self.model = MultiModalFusionNet(config)
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.eval()

    def predict(self, title, body, image_url=None):
        # Tokenize
        text = f"{title} {self.tokenizer.sep_token} {body}"
        encoding = self.tokenizer(text, return_tensors="pt",
                                  max_length=256, truncation=True, padding="max_length")

        # Load image if URL provided
        pixel_values = None
        if image_url:
            img = Image.open(requests.get(image_url, stream=True).raw).convert("RGB")
            pixel_values = self.image_processor(img, return_tensors="pt")["pixel_values"]

        # Inference
        with torch.no_grad():
            logits = self.model(
                input_ids=encoding["input_ids"].to(self.device),
                attention_mask=encoding["attention_mask"].to(self.device),
                pixel_values=pixel_values.to(self.device) if pixel_values is not None else None
            )
            probs = torch.softmax(logits, dim=-1)
            pred_class = torch.argmax(probs, dim=-1).item()
            confidence = probs[0][pred_class].item()

        label = "FAKE" if pred_class == 1 else "REAL"
        explanation = self._generate_explanation(label, confidence, image_url is not None)
        return {"label": label, "confidence": round(confidence, 4), "explanation": explanation}
```

---

## Data Pipeline

### Step 1: Download Datasets

```bash
# Fakeddit
git clone https://github.com/entitize/Fakeddit
cd Fakeddit
python image_downloader.py multimodal_only_samples/train.tsv

# NewsCLIPpings (requires VisualNews images)
git clone https://github.com/g-luo/news_clippings
# Follow their README to download VisualNews images
```

### Step 2: Preprocess Pipeline

Run `ml/data/scripts/preprocess_pipeline.py` which:
1. Loads raw TSV/JSON files from both datasets
2. Filters out samples with missing images or empty titles
3. Normalizes labels to `0` (real) and `1` (fake)
4. Merges both datasets into a unified DataFrame
5. Performs stratified train/val/test split (80/10/10)
6. Saves processed splits as Parquet files in `ml/data/processed/`

```python
# preprocess_pipeline.py — key steps
df_fakeddit = load_fakeddit("data/raw/fakeddit/")
df_newsclip = load_newsclippings("data/raw/newsclippings/")

# Normalize columns to: [id, title, body, image_path, label, source_dataset]
df = pd.concat([df_fakeddit, df_newsclip], ignore_index=True)
df = df.dropna(subset=["title"])
df = df[df["image_path"].apply(os.path.exists)]  # only rows with valid images

train, temp = train_test_split(df, test_size=0.2, stratify=df["label"])
val, test   = train_test_split(temp, test_size=0.5, stratify=temp["label"])

train.to_parquet("data/processed/train.parquet")
val.to_parquet("data/processed/val.parquet")
test.to_parquet("data/processed/test.parquet")
```

---

## API Reference

### Auth Endpoints

| Method | URL | Body | Response |
|---|---|---|---|
| POST | `/api/auth/register` | `{ email, password, name }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |

### Prediction Endpoints

| Method | URL | Headers | Body | Response |
|---|---|---|---|---|
| POST | `/api/predict` | `Authorization: Bearer <jwt>` | FormData: `title`, `body`, `image` (optional) | `{ id, label, confidence, explanation, imageUrl }` |
| GET | `/api/history` | `Authorization: Bearer <jwt>` | — | `{ predictions: [...] }` |
| POST | `/api/predict/:id/feedback` | `Authorization: Bearer <jwt>` | `{ feedback: "correct" \| "incorrect" }` | `{ success: true }` |

### Python Inference (Internal Only)

| Method | URL | Body | Response |
|---|---|---|---|
| POST | `http://ml:8000/predict` | `{ title, body, image_url? }` | `{ label, confidence, explanation }` |
| GET | `http://ml:8000/health` | — | `{ status: "ok" }` |

---

## Environment Variables

### Backend (.env)
```env
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/fakenews
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET=fake-news-images
ML_SERVICE_URL=http://localhost:8000
NODE_ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### ML Service (.env)
```env
MODEL_PATH=best_model.pt
DEVICE=cuda
PORT=8000
```

---

## Setup & Installation

### Prerequisites
- Node.js 20+
- Python 3.10 - 3.13
- PostgreSQL 15+
- CUDA-capable GPU (strongly recommended for training; inference can run on CPU)
- Docker (optional but recommended)

---

### With Docker (Recommended)

```bash
git clone https://github.com/your-org/fake-news-detector.git
cd fake-news-detector

cp backend/.env.example backend/.env       # fill in values
cp frontend/.env.example frontend/.env.local

docker-compose -f docker/docker-compose.yml up --build
```

Services will be available at:
- Frontend: `http://localhost:3000`
- Backend:  `http://localhost:5000`
- ML API:   `http://localhost:8000`

---

### Manual Setup

**1. Backend**
```bash
cd backend
npm install
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npm run dev
```

**2. Frontend**
```bash
cd frontend
npm install
npm run dev
```

**3. ML Service**
```bash
cd ml
pip install -r requirements.txt
# Download and preprocess data first (see Data Pipeline section)
python train/train.py --config configs/config.yaml
uvicorn inference.app:app --host 0.0.0.0 --port 8000 --reload
```

Alternative from repo root (recommended for consistent imports):
```bash
uvicorn ml.inference.app:app --host 0.0.0.0 --port 8000 --reload
```

---

### docker-compose.yml Structure

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: fakenews
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password

  backend:
    build: { context: .., dockerfile: docker/Dockerfile.backend }
    ports: ["5000:5000"]
    depends_on: [postgres]
    env_file: backend/.env

  ml:
    build: { context: .., dockerfile: docker/Dockerfile.ml }
    ports: ["8000:8000"]
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  frontend:
    build: { context: .., dockerfile: docker/Dockerfile.frontend }
    ports: ["3000:3000"]
    depends_on: [backend]
```

---

## Implementation Phases

### Phase 1 — Data & Training
- [ ] Download Fakeddit and NewsCLIPpings datasets
- [ ] Run `preprocess_pipeline.py` to clean and merge datasets
- [ ] Implement `FakeNewsDataset` in `dataset.py`
- [ ] Build `MultiModalFusionNet` in `model.py`
- [ ] Run training with W&B logging
- [ ] Evaluate on test set and save best checkpoint

### Phase 2 — Inference Service
- [ ] Build `FakeNewsPredictor` class in `predictor.py`
- [ ] Wrap with FastAPI in `app.py`
- [ ] Add `/health` and `/predict` endpoints
- [ ] Dockerize with CUDA support

### Phase 3 — Backend API
- [ ] Setup Express server + PostgreSQL + Sequelize
- [ ] Implement auth (register, login, JWT)
- [ ] Implement `/api/predict` route (Multer + S3 + Python forwarding)
- [ ] Implement `/api/history` and feedback routes

### Phase 4 — Frontend
- [ ] Build article submission form with image upload
- [ ] Build result page with confidence visualization
- [ ] Build history page
- [ ] Build admin dashboard with aggregated stats

### Phase 5 — Integration & Deploy
- [ ] Wire all services with Docker Compose
- [ ] Add rate limiting, CORS, helmet to backend
- [ ] End-to-end testing
- [ ] Deploy (e.g., AWS EC2 for ML, Vercel for frontend, RDS for DB)

---

## Key Implementation Details

### Handling Text-Only vs Multimodal Input
The model supports articles submitted without images. When no image is uploaded:
- The Node.js backend sends `image_url: null` to the Python service
- The predictor skips image loading and passes `pixel_values=None`
- The model uses the `no_image_token` learnable embedding in place of the image

### Collate Function for Mixed Batches
Since some samples have images and some don't, a custom `collate_fn` is required in the DataLoader:

```python
def collate_fn(batch):
    input_ids = torch.stack([b["input_ids"] for b in batch])
    attention_mask = torch.stack([b["attention_mask"] for b in batch])
    labels = torch.stack([b["labels"] for b in batch])

    # Stack images only if all items in batch have images
    pixel_values = None
    imgs = [b["pixel_values"] for b in batch if b["pixel_values"] is not None]
    if len(imgs) == len(batch):
        pixel_values = torch.stack(imgs)

    return {"input_ids": input_ids, "attention_mask": attention_mask,
            "pixel_values": pixel_values, "labels": labels}
```

### Confidence Explanation Generation
The `_generate_explanation` method in the predictor generates a natural language explanation based on confidence tier and modality used:
- High confidence FAKE (>90%): "Strong signals of misinformation detected in both text content and image context."
- Medium confidence FAKE (70–90%): "Likely fake — text contains misleading claims. Image context is inconsistent with the caption."
- Low confidence FAKE (50–70%): "Possibly fake, but confidence is low. Manual review recommended."
- REAL variants follow the same pattern in reverse.

### Rate Limiting (Backend)
```javascript
const rateLimit = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 50,                     // 50 requests per window per IP
  message: "Too many requests, please try again later."
});
app.use("/api/predict", limiter);
```

---

## Notes for the Implementing Agent

1. **Train before deploying**: The `best_model.pt` file must exist at the project root before the inference service can start. Run `python ml/train/train.py` first and place/copy the final model at `<repo-root>/best_model.pt`. Training on a GPU takes approximately 6–12 hours for the full combined dataset.

2. **Image downloads are large**: The Fakeddit image dataset is ~100GB. Use the `multimodal_only_samples` subset and only download images referenced in those TSV files.

3. **NewsCLIPpings requires VisualNews**: Follow the NewsCLIPpings repo instructions carefully to obtain the VisualNews image dataset first.

4. **Model checkpoint format**: Save with `torch.save(model.state_dict(), path)`, NOT `torch.save(model, path)`. Load with `model.load_state_dict(torch.load(path, map_location=device))`.

5. **S3 is required for production**: For local development, you can skip S3 and store images locally. Change the `uploadToS3` utility to save to `backend/uploads/` and serve via a static middleware.

6. **The Python service is internal**: It must never be exposed to the public internet. All external traffic goes through the Node.js backend.

7. **W&B is optional**: If not available, remove `wandb.log()` calls and replace with `print()` statements or use TensorBoard instead.