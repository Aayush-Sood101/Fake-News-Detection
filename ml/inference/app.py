from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .schemas import PredictResponse, HealthResponse
from .predictor import FakeNewsPredictor
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global predictor instance
predictor = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
default_model_path = os.path.abspath(os.path.join(BASE_DIR, "..", "..", "best_model.pt"))
model_path = os.getenv("MODEL_PATH", default_model_path)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle."""
    # Startup
    global predictor
    try:
        logger.info("Loading model...")
        predictor = FakeNewsPredictor(model_path)
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down inference service")


# Initialize FastAPI app
app = FastAPI(
    title="Fake News Detection API",
    description="ML inference service for detecting fake news using multimodal analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    """API information endpoint."""
    return {
        "service": "Fake News Detection API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "predict": "/predict"
        },
        "docs": "/docs"
    }


@app.get("/health", response_model=HealthResponse)
def health():
    """Health check endpoint."""
    return {
        "status": "ok" if predictor is not None else "error",
        "model_loaded": predictor is not None,
        "device": str(predictor.device) if predictor else "unknown"
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(
    title: str = Form(..., description="Article title"),
    body: str = Form("", description="Article body text"),
    image: UploadFile = File(None, description="Article image")
):
    """
    Predict whether news article is REAL or FAKE.
    
    Args:
        title: Article title/headline (required)
        body: Article body text (optional)
        image: Article image file (optional)
        
    Returns:
        Prediction with label, confidence, explanation, and modality
    """
    if predictor is None:
        logger.error("Predictor not initialized")
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Validate title
    if not title or not title.strip():
        raise HTTPException(status_code=400, detail="Title is required")
    
    if len(title) > 1000:
        raise HTTPException(status_code=400, detail="Title too long (max 1000 chars)")
    
    if len(body) > 10000:
        raise HTTPException(status_code=400, detail="Body too long (max 10000 chars)")
    
    # Read image if provided
    image_bytes = None
    if image:
        try:
            image_bytes = await image.read()
            logger.info(f"Received image: {image.filename}, size: {len(image_bytes)} bytes")
        except Exception as e:
            logger.error(f"Failed to read image: {e}")
            raise HTTPException(status_code=400, detail="Failed to read image file")
    
    # Make prediction
    try:
        result = predictor.predict(
            title=title,
            body=body,
            image_bytes=image_bytes
        )
        return result
    except ValueError as e:
        logger.error(f"Prediction validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Prediction failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Prediction failed")