"""Pydantic schemas for API request/response validation."""

from pydantic import BaseModel, Field, field_validator, ConfigDict
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
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Breaking: Major Scientific Discovery Announced",
                "body": "Scientists at MIT have discovered...",
                "image_url": "https://example.com/image.jpg"
            }
        }
    )


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
        description="Modality used: 'text_only' or 'multimodal'"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "label": "FAKE",
                "confidence": 0.92,
                "explanation": "🚨 HIGH CONFIDENCE: This content is likely FAKE...",
                "modality": "multimodal"
            }
        }
    )


class HealthResponse(BaseModel):
    """Response schema for health check endpoint."""
    
    status: str = Field(
        ...,
        description="Service status: 'ok' or 'error'"
    )
    model_loaded: bool = Field(
        ...,
        description="Whether the model is loaded and ready"
    )
    device: str = Field(
        ...,
        description="Device being used for inference (cpu/cuda)"
    )
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "status": "ok",
                "model_loaded": True,
                "device": "cpu"
            }
        }
    )
