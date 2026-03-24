# Phase 3: Python Inference Service

> **Goal**: Build a FastAPI-based inference service that loads the trained model and exposes prediction endpoints for the backend to consume.

---

## Overview

This phase creates the Python inference microservice that:
- Loads the trained PyTorch model
- Exposes a REST API via FastAPI
- Handles text tokenization and image preprocessing
- Returns predictions with confidence scores and explanations

**Estimated Effort**: 1-2 days  
**Prerequisites**: Phase 2 completed (`best_model.pt` exists)  
**Port**: 8000 (internal, not exposed to public)

---

## 3.1 Inference Service Structure

```
ml/inference/
├── app.py              # FastAPI application entry point
├── predictor.py        # Prediction pipeline class
├── preprocess.py       # Text and image preprocessing utilities
├── schemas.py          # Pydantic request/response models
└── explainer.py        # Explanation generation logic
```

---

## 3.2 Pydantic Schemas

Define request and response models for type safety and validation:

```python
# ml/inference/schemas.py
"""Pydantic schemas for API request/response validation."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional


class PredictRequest(BaseModel):
    """Request schema for prediction endpoint."""
    
    title: str = Field(
        ..., 
        min_length=1, 
        max_length=1000,
        description="Article title/headline"
    )
    body: str = Field(
        default="",
        max_length=10000,
        description="Article body text (optional)"
    )
    image_url: Optional[str] = Field(
        default=None,
        description="URL to article image (optional)"
    )
    
    @field_validator('title')
    @classmethod
    def title_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Title cannot be empty or whitespace only')
        return v.strip()
    
    class Config:
        json_schema_extra = {
            "example": {
                "title": "Breaking: Major Scientific Discovery Announced",
                "body": "Scientists at MIT have discovered...",
                "image_url": "https://example.com/image.jpg"
            }
        }


class PredictResponse(BaseModel):
    """Response schema for prediction endpoint."""
    
    label: str = Field(
        ...,
        description="Prediction label: 'REAL' or 'FAKE'"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score (0-1)"
    )
    explanation: str = Field(
        ...,
        description="Human-readable explanation of the prediction"
    )
    modality: str = Field(
        ...,
        description="Input modality used: 'text_only' or 'multimodal'"
    )
    
    class Config:
        json_schema_extra = {
            "example": {
                "label": "FAKE",
                "confidence": 0.87,
                "explanation": "High confidence of misinformation...",
                "modality": "multimodal"
            }
        }


class HealthResponse(BaseModel):
    """Health check response."""
    
    status: str
    model_loaded: bool
    device: str
```

---

## 3.3 Preprocessing Utilities

```python
# ml/inference/preprocess.py
"""Text and image preprocessing for inference."""

import torch
import requests
from PIL import Image
from io import BytesIO
from transformers import RobertaTokenizer, ViTImageProcessor
from torchvision import transforms
from typing import Optional, Tuple, Dict
import logging

logger = logging.getLogger(__name__)


class TextPreprocessor:
    """Handles text tokenization for RoBERTa."""
    
    def __init__(
        self,
        model_name: str = "roberta-base",
        max_length: int = 256
    ):
        self.tokenizer = RobertaTokenizer.from_pretrained(model_name)
        self.max_length = max_length
    
    def preprocess(
        self, 
        title: str, 
        body: str = ""
    ) -> Dict[str, torch.Tensor]:
        """
        Tokenize title and body text.
        
        Args:
            title: Article title
            body: Article body (optional)
            
        Returns:
            Dictionary with input_ids and attention_mask tensors
        """
        # Combine title and body
        if body.strip():
            text = f"{title} {self.tokenizer.sep_token} {body}"
        else:
            text = title
        
        # Tokenize
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        return {
            'input_ids': encoding['input_ids'],
            'attention_mask': encoding['attention_mask']
        }


class ImagePreprocessor:
    """Handles image loading and transformation for ViT."""
    
    def __init__(
        self,
        model_name: str = "google/vit-base-patch16-224",
        image_size: int = 224,
        timeout: int = 10
    ):
        self.image_processor = ViTImageProcessor.from_pretrained(model_name)
        self.image_size = image_size
        self.timeout = timeout
        
        self.transform = transforms.Compose([
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    
    def preprocess(self, image_url: str) -> Optional[torch.Tensor]:
        """
        Download and preprocess image from URL.
        
        Args:
            image_url: URL to image
            
        Returns:
            Tensor of shape [1, 3, 224, 224] or None if failed
        """
        try:
            # Download image
            response = requests.get(
                image_url,
                timeout=self.timeout,
                stream=True,
                headers={'User-Agent': 'FakeNewsDetector/1.0'}
            )
            response.raise_for_status()
            
            # Load and convert to RGB
            img = Image.open(BytesIO(response.content)).convert('RGB')
            
            # Apply transforms
            tensor = self.transform(img)
            
            # Add batch dimension
            return tensor.unsqueeze(0)
            
        except requests.RequestException as e:
            logger.warning(f"Failed to download image from {image_url}: {e}")
            return None
        except Exception as e:
            logger.warning(f"Failed to process image: {e}")
            return None
    
    def preprocess_local(self, image_path: str) -> Optional[torch.Tensor]:
        """Preprocess local image file."""
        try:
            img = Image.open(image_path).convert('RGB')
            tensor = self.transform(img)
            return tensor.unsqueeze(0)
        except Exception as e:
            logger.warning(f"Failed to load local image {image_path}: {e}")
            return None
```

---

## 3.4 Explanation Generator

```python
# ml/inference/explainer.py
"""Generate human-readable explanations for predictions."""

from typing import Dict


class PredictionExplainer:
    """
    Generates explanations based on prediction confidence
    and input modality.
    """
    
    # Explanation templates
    TEMPLATES = {
        'FAKE': {
            'high': (
                "Strong signals of misinformation detected. "
                "{modality_detail} "
                "The content exhibits patterns commonly associated with fake news, "
                "including potentially misleading claims or sensationalized language."
            ),
            'medium': (
                "Likely contains misinformation. "
                "{modality_detail} "
                "Several indicators suggest this content may not be fully accurate. "
                "Consider verifying with trusted sources."
            ),
            'low': (
                "Possibly fake, but confidence is low. "
                "{modality_detail} "
                "Some signals suggest potential misinformation, but the evidence is not conclusive. "
                "Manual verification recommended."
            )
        },
        'REAL': {
            'high': (
                "Content appears to be legitimate. "
                "{modality_detail} "
                "The text and presentation are consistent with factual reporting standards."
            ),
            'medium': (
                "Content likely genuine. "
                "{modality_detail} "
                "Most indicators suggest this is accurate information, though independent verification is always recommended."
            ),
            'low': (
                "Possibly legitimate, but confidence is moderate. "
                "{modality_detail} "
                "The content shows some characteristics of genuine news, but certainty is limited."
            )
        }
    }
    
    MODALITY_DETAILS = {
        'multimodal': {
            'FAKE': "Analysis of both text content and associated image revealed inconsistencies.",
            'REAL': "Both text and image content align with credible news patterns."
        },
        'text_only': {
            'FAKE': "Text analysis identified concerning patterns in the language and claims.",
            'REAL': "Text analysis found the writing style consistent with factual reporting."
        }
    }
    
    def generate(
        self,
        label: str,
        confidence: float,
        has_image: bool
    ) -> str:
        """
        Generate explanation for a prediction.
        
        Args:
            label: 'REAL' or 'FAKE'
            confidence: Confidence score (0-1)
            has_image: Whether image was used in prediction
            
        Returns:
            Human-readable explanation string
        """
        # Determine confidence tier
        if confidence >= 0.85:
            tier = 'high'
        elif confidence >= 0.65:
            tier = 'medium'
        else:
            tier = 'low'
        
        # Get modality type
        modality = 'multimodal' if has_image else 'text_only'
        
        # Get modality detail
        modality_detail = self.MODALITY_DETAILS[modality][label]
        
        # Build explanation
        template = self.TEMPLATES[label][tier]
        explanation = template.format(modality_detail=modality_detail)
        
        return explanation
```

---

## 3.5 Predictor Class

```python
# ml/inference/predictor.py
"""
Main prediction pipeline that orchestrates preprocessing,
model inference, and post-processing.
"""

import os
import torch
import logging
from typing import Dict, Optional
from pathlib import Path

# Import model (from train module)
import sys
sys.path.insert(0, str(Path(__file__).parent.parent / 'train'))
from model import MultiModalFusionNet, ModelConfig

from preprocess import TextPreprocessor, ImagePreprocessor
from explainer import PredictionExplainer
from schemas import PredictResponse

logger = logging.getLogger(__name__)


class FakeNewsPredictor:
    """
    End-to-end fake news prediction pipeline.
    
    Handles:
    - Model loading and device management
    - Text and image preprocessing
    - Inference
    - Post-processing and explanation generation
    """
    
    def __init__(
        self,
        model_path: str,
        config: Optional[Dict] = None,
        device: Optional[str] = None
    ):
        """
        Initialize the predictor.
        
        Args:
            model_path: Path to trained model checkpoint (.pt file)
            config: Model configuration dictionary
            device: 'cuda', 'cpu', or None for auto-detect
        """
        # Device setup
        if device:
            self.device = torch.device(device)
        else:
            self.device = torch.device(
                'cuda' if torch.cuda.is_available() else 'cpu'
            )
        
        logger.info(f"Using device: {self.device}")
        
        # Default config
        self.config = config or {
            'text_encoder': 'roberta-base',
            'image_encoder': 'google/vit-base-patch16-224',
            'projection_dim': 512,
            'num_attention_heads': 8,
            'freeze_text_layers': 8,
            'classifier_dropout': 0.2,
            'max_text_length': 256
        }
        
        # Initialize preprocessors
        self.text_preprocessor = TextPreprocessor(
            model_name=self.config['text_encoder'],
            max_length=self.config['max_text_length']
        )
        
        self.image_preprocessor = ImagePreprocessor(
            model_name=self.config['image_encoder']
        )
        
        # Initialize explainer
        self.explainer = PredictionExplainer()
        
        # Load model
        self._load_model(model_path)
        
        logger.info("FakeNewsPredictor initialized successfully")
    
    def _load_model(self, model_path: str):
        """Load the trained model from checkpoint."""
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model checkpoint not found: {model_path}")
        
        # Create model config
        model_config = ModelConfig(
            text_encoder=self.config['text_encoder'],
            image_encoder=self.config['image_encoder'],
            projection_dim=self.config['projection_dim'],
            num_attention_heads=self.config['num_attention_heads'],
            freeze_text_layers=self.config['freeze_text_layers'],
            classifier_dropout=self.config['classifier_dropout']
        )
        
        # Initialize model
        self.model = MultiModalFusionNet(model_config)
        
        # Load weights
        state_dict = torch.load(model_path, map_location=self.device)
        self.model.load_state_dict(state_dict)
        
        # Move to device and set eval mode
        self.model.to(self.device)
        self.model.eval()
        
        logger.info(f"Model loaded from {model_path}")
    
    @torch.no_grad()
    def predict(
        self,
        title: str,
        body: str = "",
        image_url: Optional[str] = None
    ) -> PredictResponse:
        """
        Run prediction on input.
        
        Args:
            title: Article title
            body: Article body (optional)
            image_url: URL to article image (optional)
            
        Returns:
            PredictResponse with label, confidence, explanation, and modality
        """
        # Preprocess text
        text_inputs = self.text_preprocessor.preprocess(title, body)
        input_ids = text_inputs['input_ids'].to(self.device)
        attention_mask = text_inputs['attention_mask'].to(self.device)
        
        # Preprocess image (if provided)
        pixel_values = None
        has_image = False
        
        if image_url:
            pixel_values = self.image_preprocessor.preprocess(image_url)
            if pixel_values is not None:
                pixel_values = pixel_values.to(self.device)
                has_image = True
        
        # Run inference
        logits = self.model(
            input_ids=input_ids,
            attention_mask=attention_mask,
            pixel_values=pixel_values
        )
        
        # Post-process
        probs = torch.softmax(logits, dim=-1)
        pred_class = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][pred_class].item()
        
        # Determine label
        label = "FAKE" if pred_class == 1 else "REAL"
        
        # Determine modality
        modality = "multimodal" if has_image else "text_only"
        
        # Generate explanation
        explanation = self.explainer.generate(
            label=label,
            confidence=confidence,
            has_image=has_image
        )
        
        return PredictResponse(
            label=label,
            confidence=round(confidence, 4),
            explanation=explanation,
            modality=modality
        )
    
    def get_device(self) -> str:
        """Return current device as string."""
        return str(self.device)
```

---

## 3.6 FastAPI Application

```python
# ml/inference/app.py
"""
FastAPI application for fake news detection inference.

This is an INTERNAL service - should not be exposed to public internet.
All external traffic should go through the Node.js backend.
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from schemas import PredictRequest, PredictResponse, HealthResponse
from predictor import FakeNewsPredictor

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global predictor instance
predictor: FakeNewsPredictor = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager for FastAPI app.
    Loads model on startup, cleans up on shutdown.
    """
    global predictor
    
    # Startup: Load model
    model_path = os.getenv('MODEL_PATH', 'ml/checkpoints/best_model.pt')
    device = os.getenv('DEVICE', None)  # Auto-detect if not specified
    
    try:
        logger.info("Loading model...")
        predictor = FakeNewsPredictor(
            model_path=model_path,
            device=device
        )
        logger.info("Model loaded successfully!")
    except FileNotFoundError as e:
        logger.error(f"Model not found: {e}")
        logger.error("Please ensure the model is trained before starting inference service")
        raise
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise
    
    yield
    
    # Shutdown: Cleanup
    logger.info("Shutting down inference service...")
    predictor = None


# Create FastAPI app
app = FastAPI(
    title="Fake News Detection Inference API",
    description="Internal API for multimodal fake news classification",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware (internal only - restrict in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000"],  # Only allow backend
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint.
    Returns model status and device information.
    """
    return HealthResponse(
        status="ok" if predictor else "not_ready",
        model_loaded=predictor is not None,
        device=predictor.get_device() if predictor else "none"
    )


@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """
    Run fake news prediction on submitted article.
    
    Accepts:
    - title (required): Article title/headline
    - body (optional): Article body text
    - image_url (optional): URL to associated image
    
    Returns:
    - label: "REAL" or "FAKE"
    - confidence: 0.0-1.0 confidence score
    - explanation: Human-readable explanation
    - modality: "text_only" or "multimodal"
    """
    if predictor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model not loaded. Service is starting up."
        )
    
    try:
        result = predictor.predict(
            title=request.title,
            body=request.body,
            image_url=request.image_url
        )
        
        logger.info(
            f"Prediction: {result.label} ({result.confidence:.2%}) "
            f"[{result.modality}]"
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction failed: {str(e)}"
        )


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "service": "Fake News Detection Inference API",
        "version": "1.0.0",
        "endpoints": {
            "/health": "GET - Health check",
            "/predict": "POST - Run prediction"
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 8000))
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
```

---

## 3.7 Environment Configuration

```bash
# ml/.env
MODEL_PATH=ml/checkpoints/best_model.pt
DEVICE=cuda
PORT=8000
```

---

## 3.8 Docker Configuration

```dockerfile
# docker/Dockerfile.ml
FROM nvidia/cuda:11.8-cudnn8-runtime-ubuntu22.04

# Install Python
RUN apt-get update && apt-get install -y \
    python3.10 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install dependencies
COPY ml/requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy ML code
COPY ml/ ./ml/

# Copy trained model (should exist after training)
# COPY ml/checkpoints/best_model.pt ./ml/checkpoints/

# Environment variables
ENV MODEL_PATH=ml/checkpoints/best_model.pt
ENV DEVICE=cuda
ENV PORT=8000

# Expose port
EXPOSE 8000

# Run the inference service
CMD ["python3", "-m", "uvicorn", "ml.inference.app:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 3.9 Running the Service

### Local Development

```bash
# Navigate to project root
cd fake-news-detector

# Ensure model exists
ls ml/checkpoints/best_model.pt

# Start inference service
cd ml
python -m uvicorn inference.app:app --host 0.0.0.0 --port 8000 --reload
```

### Test the API

```bash
# Health check
curl http://localhost:8000/health

# Test prediction (text only)
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"title": "Scientists discover new planet", "body": "NASA announced today..."}'

# Test prediction (with image)
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Breaking news headline",
    "body": "Article body text here",
    "image_url": "https://example.com/image.jpg"
  }'
```

### Expected Response

```json
{
  "label": "REAL",
  "confidence": 0.8734,
  "explanation": "Content appears to be legitimate. Both text and image content align with credible news patterns. The text and presentation are consistent with factual reporting standards.",
  "modality": "multimodal"
}
```

---

## 3.10 API Documentation

Once running, FastAPI automatically generates interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

---

## 3.11 Deliverables Checklist

After completing Phase 3, you should have:

- [ ] `ml/inference/app.py` - FastAPI application
- [ ] `ml/inference/predictor.py` - Prediction pipeline
- [ ] `ml/inference/preprocess.py` - Text and image preprocessing
- [ ] `ml/inference/schemas.py` - Pydantic schemas
- [ ] `ml/inference/explainer.py` - Explanation generator
- [ ] `ml/.env` - Environment configuration
- [ ] `docker/Dockerfile.ml` - Docker configuration
- [ ] Service running and responding to:
  - `GET /health` → Returns `{"status": "ok"}`
  - `POST /predict` → Returns predictions
- [ ] API documentation accessible at `/docs`

---

## 3.12 Troubleshooting

### Issue: Model not found error
**Solution**: Ensure `ml/checkpoints/best_model.pt` exists from Phase 2 training

### Issue: CUDA out of memory during inference
**Solution**: Set `DEVICE=cpu` in `.env` for inference (slower but uses less memory)

### Issue: Image download timeout
**Solution**: Increase timeout in `ImagePreprocessor` or ensure network connectivity

### Issue: Import errors for model.py
**Solution**: Ensure `ml/train/` is in Python path or use relative imports properly

---

## Next Phase

Once the inference service is running and tested, proceed to **Phase 4: Node.js Backend API Gateway**.
