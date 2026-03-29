import torch
import sys
import os
import logging

# add parent path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from train.model import MultiModalFusionNet, ModelConfig
from preprocess import TextPreprocessor, ImagePreprocessor
from explainer import PredictionExplainer

logger = logging.getLogger(__name__)


class FakeNewsPredictor:
    """Main predictor class for fake news detection."""
    
    def __init__(self, model_path: str):
        """
        Initialize predictor with model and preprocessors.
        
        Args:
            model_path: Path to trained model checkpoint
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Using device: {self.device}")

        # Initialize preprocessors
        self.text_preprocessor = TextPreprocessor(model_name="roberta-base", max_length=512)
        self.image_preprocessor = ImagePreprocessor(timeout=10)
        self.explainer = PredictionExplainer()

        # Load model
        config = ModelConfig()
        self.model = MultiModalFusionNet(config)

        # Load weights
        self.model.load_state_dict(
            torch.load(model_path, map_location=self.device)
        )

        self.model.to(self.device)
        self.model.eval()
        logger.info(f"Model loaded successfully from {model_path}")

    def predict(self, title: str, body: str = "", image_url: str = None, image_bytes: bytes = None) -> dict:
        """
        Make a prediction on news article.
        
        Args:
            title: Article title (required)
            body: Article body text (optional)
            image_url: URL to article image (optional)
            image_bytes: Raw image bytes (optional)
            
        Returns:
            Dictionary with label, confidence, explanation, modality
        """
        # Combine text
        text = title.strip()
        if body:
            text = text + " " + body.strip()
        
        logger.info(f"Making prediction for text length: {len(text)}")

        # Preprocess text
        try:
            text_inputs = self.text_preprocessor.preprocess(text)
            input_ids = text_inputs["input_ids"].to(self.device)
            attention_mask = text_inputs["attention_mask"].to(self.device)
        except Exception as e:
            logger.error(f"Text preprocessing failed: {e}")
            raise ValueError(f"Text preprocessing failed: {str(e)}")

        # Preprocess image
        pixel_values = None
        modality = "text_only"
        
        if image_url:
            try:
                logger.info(f"Processing image from URL")
                pixel_values = self.image_preprocessor.preprocess_from_url(image_url)
                pixel_values = pixel_values.to(self.device)
                modality = "multimodal"
            except Exception as e:
                logger.warning(f"Failed to process image from URL: {e}")
                pixel_values = None
                
        elif image_bytes:
            try:
                logger.info(f"Processing image from bytes")
                pixel_values = self.image_preprocessor.preprocess_from_bytes(image_bytes)
                pixel_values = pixel_values.to(self.device)
                modality = "multimodal"
            except Exception as e:
                logger.warning(f"Failed to process image from bytes: {e}")
                pixel_values = None

        # Run inference
        with torch.no_grad():
            logits = self.model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                pixel_values=pixel_values
            )

        # Get prediction
        probs = torch.softmax(logits, dim=-1)
        pred = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][pred].item()

        label = "REAL" if pred == 1 else "FAKE"
        
        # Generate explanation
        explanation = self.explainer.explain(label, confidence, modality)
        
        logger.info(f"Prediction: {label} (confidence: {confidence:.4f}, modality: {modality})")

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "explanation": explanation,
            "modality": modality
        }