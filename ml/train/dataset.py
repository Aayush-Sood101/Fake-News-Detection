"""
PyTorch Dataset for multimodal fake news detection.
Handles both text-only and text+image samples.
"""

import os
import torch
from torch.utils.data import Dataset
import pandas as pd
from PIL import Image
from transformers import RobertaTokenizer, ViTImageProcessor
from torchvision import transforms
from typing import Optional, Dict, Any


class FakeNewsDataset(Dataset):
    """
    Dataset for multimodal fake news detection.
    
    Supports:
    - Text-only samples (image_path missing or invalid)
    - Multimodal samples (text + image)
    """
    
    def __init__(
        self,
        parquet_path: str,
        tokenizer: RobertaTokenizer,
        image_processor: ViTImageProcessor,
        max_length: int = 256,
        image_size: int = 224,
        split: str = "train"
    ):
        self.data = pd.read_parquet(parquet_path)
        self.tokenizer = tokenizer
        self.image_processor = image_processor
        self.max_length = max_length
        self.split = split
        
        # Define image transforms
        if split == "train":
            self.image_transform = transforms.Compose([
                transforms.Resize((256, 256)),
                transforms.RandomCrop(image_size),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.ColorJitter(
                    brightness=0.2, 
                    contrast=0.2,
                    saturation=0.1
                ),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
        else:
            self.image_transform = transforms.Compose([
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                )
            ])
    
    def __len__(self) -> int:
        return len(self.data)
    
    def __getitem__(self, idx: int) -> Dict[str, Any]:
        row = self.data.iloc[idx]
        
        # Tokenize text
        text = self._prepare_text(row['title'], row.get('body', ''))
        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )
        
        # Load and transform image (if available)
        pixel_values = self._load_image(row['image_path'])
        
        return {
            'input_ids': encoding['input_ids'].squeeze(0),
            'attention_mask': encoding['attention_mask'].squeeze(0),
            'pixel_values': pixel_values,  # Can be None
            'labels': torch.tensor(row['label'], dtype=torch.long),
            'has_image': pixel_values is not None
        }
    
    def _prepare_text(self, title: str, body: str) -> str:
        """Combine title and body with separator."""
        title = str(title).strip() if pd.notna(title) else ""
        body = str(body).strip() if pd.notna(body) else ""
        
        if body:
            return f"{title} {self.tokenizer.sep_token} {body}"
        return title
    
    def _load_image(self, image_path: str) -> Optional[torch.Tensor]:
        """Load and transform image, return None if unavailable."""
        try:
            if not os.path.exists(image_path):
                return None
            
            img = Image.open(image_path).convert('RGB')
            return self.image_transform(img)
        except Exception as e:
            # Log but don't crash - treat as text-only sample
            print(f"⚠️ Error loading image {image_path}: {e}")
            return None


def collate_fn(batch: list) -> Dict[str, torch.Tensor]:
    """
    Custom collate function to handle mixed batches
    where some samples have images and some don't.
    """
    input_ids = torch.stack([item['input_ids'] for item in batch])
    attention_mask = torch.stack([item['attention_mask'] for item in batch])
    labels = torch.stack([item['labels'] for item in batch])
    
    # Handle images - only stack if ALL items have images
    has_images = [item['has_image'] for item in batch]
    
    if all(has_images):
        pixel_values = torch.stack([item['pixel_values'] for item in batch])
    else:
        # Mixed batch or all text-only - set to None
        # Model will use no_image_token for missing images
        pixel_values = None
    
    return {
        'input_ids': input_ids,
        'attention_mask': attention_mask,
        'pixel_values': pixel_values,
        'labels': labels,
        'batch_has_images': all(has_images)
    }
