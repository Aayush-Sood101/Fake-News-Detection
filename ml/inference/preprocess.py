"""Text and image preprocessing utilities."""

import torch
from transformers import AutoTokenizer
from PIL import Image
import requests
from io import BytesIO
from torchvision import transforms
import logging

logger = logging.getLogger(__name__)


class TextPreprocessor:
    """Preprocessor for text inputs using RoBERTa tokenizer."""
    
    def __init__(self, model_name: str = "roberta-base", max_length: int = 512):
        """
        Initialize text preprocessor.
        
        Args:
            model_name: Hugging Face model name for tokenizer
            max_length: Maximum sequence length
        """
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.max_length = max_length
        logger.info(f"TextPreprocessor initialized with {model_name}")
    
    def preprocess(self, text: str) -> dict:
        """
        Preprocess text input.
        
        Args:
            text: Input text string
            
        Returns:
            Dictionary with input_ids and attention_mask tensors
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        inputs = self.tokenizer(
            text,
            max_length=self.max_length,
            padding="max_length",
            truncation=True,
            return_tensors="pt"
        )
        
        return {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"]
        }


class ImagePreprocessor:
    """Preprocessor for image inputs."""
    
    def __init__(self, timeout: int = 10):
        """
        Initialize image preprocessor.
        
        Args:
            timeout: Timeout in seconds for URL downloads
        """
        self.timeout = timeout
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
        logger.info("ImagePreprocessor initialized")
    
    def preprocess_from_url(self, url: str) -> torch.Tensor:
        """
        Download and preprocess image from URL.
        
        Args:
            url: HTTP/HTTPS URL to image
            
        Returns:
            Preprocessed image tensor (1, 3, 224, 224)
            
        Raises:
            ValueError: If URL is invalid or download fails
            IOError: If image cannot be decoded
        """
        if not url or not url.startswith(("http://", "https://")):
            raise ValueError(f"Invalid image URL: {url}")
        
        try:
            logger.info(f"Downloading image from {url}")
            response = requests.get(
                url, 
                timeout=self.timeout,
                headers={"User-Agent": "FakeNewsDetector/1.0"}
            )
            response.raise_for_status()
            
            image_bytes = response.content
            return self.preprocess_from_bytes(image_bytes)
            
        except requests.exceptions.Timeout:
            logger.error(f"Timeout downloading image from {url}")
            raise ValueError(f"Image download timeout after {self.timeout}s")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download image: {e}")
            raise ValueError(f"Failed to download image: {str(e)}")
    
    def preprocess_from_bytes(self, image_bytes: bytes) -> torch.Tensor:
        """
        Preprocess image from bytes.
        
        Args:
            image_bytes: Raw image bytes
            
        Returns:
            Preprocessed image tensor (1, 3, 224, 224)
            
        Raises:
            IOError: If image cannot be decoded
        """
        try:
            image = Image.open(BytesIO(image_bytes)).convert("RGB")
            image_tensor = self.transform(image).unsqueeze(0)
            logger.debug(f"Image preprocessed: shape={image_tensor.shape}")
            return image_tensor
            
        except Exception as e:
            logger.error(f"Failed to preprocess image: {e}")
            raise IOError(f"Invalid image format: {str(e)}")
