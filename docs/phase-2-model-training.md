# Phase 2: Model Architecture & Training

> **Goal**: Implement the MultiModalFusionNet architecture, create PyTorch Dataset classes, and train the model on the preprocessed data.

---

## Overview

This phase focuses on building the deep learning components: the model architecture that fuses text and image features using cross-attention, dataset classes for efficient data loading, and the training pipeline with proper logging and checkpointing.

**Estimated Effort**: 3-5 days  
**Prerequisites**: Phase 1 completed, CUDA-capable GPU with 16GB+ VRAM  
**Expected Output**: Trained model checkpoint (`best_model.pt`)

---

## 2.1 Dataset Class Implementation

### 2.1.1 Custom PyTorch Dataset

```python
# ml/train/dataset.py
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
```

### 2.1.2 Custom Collate Function

```python
# ml/train/dataset.py (continued)

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
```

---

## 2.2 Model Architecture

### 2.2.1 MultiModalFusionNet

```python
# ml/train/model.py
"""
MultiModalFusionNet: Cross-attention fusion of text and image features
for fake news detection.
"""

import torch
import torch.nn as nn
from transformers import RobertaModel, ViTModel
from dataclasses import dataclass
from typing import Optional


@dataclass
class ModelConfig:
    """Configuration for MultiModalFusionNet."""
    text_encoder: str = "roberta-base"
    image_encoder: str = "google/vit-base-patch16-224"
    projection_dim: int = 512
    num_attention_heads: int = 8
    num_classes: int = 2
    freeze_text_layers: int = 8
    classifier_dropout: float = 0.2
    encoder_dropout: float = 0.1


class MultiModalFusionNet(nn.Module):
    """
    Multimodal fusion network for fake news detection.
    
    Architecture:
    1. RoBERTa encodes text → [CLS] token → projection
    2. ViT encodes image → [CLS] token → projection
    3. Cross-attention: text attends to image
    4. Concatenate text + fused features
    5. MLP classifier → Real/Fake
    """
    
    def __init__(self, config: ModelConfig):
        super().__init__()
        self.config = config
        
        # === Text Encoder (RoBERTa) ===
        self.text_encoder = RobertaModel.from_pretrained(config.text_encoder)
        
        # Freeze early layers (first N layers)
        self._freeze_text_encoder_layers(config.freeze_text_layers)
        
        # === Image Encoder (ViT) ===
        self.image_encoder = ViTModel.from_pretrained(config.image_encoder)
        
        # === Projection Heads ===
        hidden_size = 768  # Both RoBERTa-base and ViT-base use 768
        
        self.text_projection = nn.Sequential(
            nn.Linear(hidden_size, config.projection_dim),
            nn.GELU(),
            nn.Dropout(config.encoder_dropout)
        )
        
        self.image_projection = nn.Sequential(
            nn.Linear(hidden_size, config.projection_dim),
            nn.GELU(),
            nn.Dropout(config.encoder_dropout)
        )
        
        # === Cross-Attention Fusion ===
        self.cross_attention = nn.MultiheadAttention(
            embed_dim=config.projection_dim,
            num_heads=config.num_attention_heads,
            dropout=config.encoder_dropout,
            batch_first=True
        )
        self.fusion_norm = nn.LayerNorm(config.projection_dim)
        
        # === No-Image Token (learnable embedding) ===
        self.no_image_token = nn.Parameter(
            torch.zeros(1, 1, config.projection_dim)
        )
        nn.init.normal_(self.no_image_token, std=0.02)
        
        # === Classifier MLP ===
        classifier_input_dim = config.projection_dim * 2  # text + fused
        
        self.classifier = nn.Sequential(
            nn.Linear(classifier_input_dim, config.projection_dim),
            nn.GELU(),
            nn.Dropout(config.classifier_dropout),
            nn.Linear(config.projection_dim, 128),
            nn.GELU(),
            nn.Dropout(config.classifier_dropout),
            nn.Linear(128, config.num_classes)
        )
    
    def _freeze_text_encoder_layers(self, num_layers: int):
        """Freeze the first N layers of the text encoder."""
        # Freeze embeddings
        for param in self.text_encoder.embeddings.parameters():
            param.requires_grad = False
        
        # Freeze first N transformer layers
        for i, layer in enumerate(self.text_encoder.encoder.layer):
            if i < num_layers:
                for param in layer.parameters():
                    param.requires_grad = False
    
    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
        pixel_values: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            input_ids: [batch_size, seq_len] - tokenized text
            attention_mask: [batch_size, seq_len] - attention mask for text
            pixel_values: [batch_size, 3, 224, 224] - images (optional)
            
        Returns:
            logits: [batch_size, num_classes]
        """
        batch_size = input_ids.size(0)
        
        # === Text Encoding ===
        text_outputs = self.text_encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        # Use [CLS] token representation
        text_cls = text_outputs.last_hidden_state[:, 0, :]  # [B, 768]
        text_proj = self.text_projection(text_cls)  # [B, 512]
        text_proj = text_proj.unsqueeze(1)  # [B, 1, 512]
        
        # === Image Encoding ===
        if pixel_values is not None:
            image_outputs = self.image_encoder(pixel_values=pixel_values)
            image_cls = image_outputs.last_hidden_state[:, 0, :]  # [B, 768]
            image_proj = self.image_projection(image_cls)  # [B, 512]
            image_proj = image_proj.unsqueeze(1)  # [B, 1, 512]
        else:
            # Use learned no-image token
            image_proj = self.no_image_token.expand(batch_size, -1, -1)
        
        # === Cross-Attention Fusion ===
        # Query: text, Key/Value: image
        fused, _ = self.cross_attention(
            query=text_proj,
            key=image_proj,
            value=image_proj
        )
        # Residual connection + LayerNorm
        fused = self.fusion_norm(fused + text_proj)  # [B, 1, 512]
        fused = fused.squeeze(1)  # [B, 512]
        
        # === Classification ===
        # Concatenate text representation with fused representation
        combined = torch.cat([text_proj.squeeze(1), fused], dim=-1)  # [B, 1024]
        logits = self.classifier(combined)  # [B, num_classes]
        
        return logits
    
    def get_trainable_params(self) -> int:
        """Count trainable parameters."""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
    
    def get_total_params(self) -> int:
        """Count total parameters."""
        return sum(p.numel() for p in self.parameters())
```

---

## 2.3 Loss Functions

```python
# ml/train/losses.py
"""Custom loss functions for training."""

import torch
import torch.nn as nn
import torch.nn.functional as F


class LabelSmoothingCrossEntropy(nn.Module):
    """
    Cross-entropy loss with label smoothing.
    
    Label smoothing helps prevent overconfident predictions
    and improves generalization.
    """
    
    def __init__(self, smoothing: float = 0.1, reduction: str = 'mean'):
        super().__init__()
        self.smoothing = smoothing
        self.reduction = reduction
    
    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        """
        Args:
            logits: [batch_size, num_classes]
            targets: [batch_size] - class indices
        """
        num_classes = logits.size(-1)
        
        # Create smoothed targets
        with torch.no_grad():
            smooth_targets = torch.zeros_like(logits)
            smooth_targets.fill_(self.smoothing / (num_classes - 1))
            smooth_targets.scatter_(1, targets.unsqueeze(1), 1 - self.smoothing)
        
        # Compute cross-entropy
        log_probs = F.log_softmax(logits, dim=-1)
        loss = -torch.sum(smooth_targets * log_probs, dim=-1)
        
        if self.reduction == 'mean':
            return loss.mean()
        elif self.reduction == 'sum':
            return loss.sum()
        return loss


class FocalLoss(nn.Module):
    """
    Focal loss for handling class imbalance.
    
    Down-weights easy examples and focuses on hard examples.
    """
    
    def __init__(self, alpha: float = 0.25, gamma: float = 2.0):
        super().__init__()
        self.alpha = alpha
        self.gamma = gamma
    
    def forward(self, logits: torch.Tensor, targets: torch.Tensor) -> torch.Tensor:
        ce_loss = F.cross_entropy(logits, targets, reduction='none')
        pt = torch.exp(-ce_loss)
        focal_loss = self.alpha * (1 - pt) ** self.gamma * ce_loss
        return focal_loss.mean()
```

---

## 2.4 Training Pipeline

### 2.4.1 Training Script

```python
# ml/train/train.py
"""
Main training script for MultiModalFusionNet.
"""

import os
import yaml
import argparse
import torch
import torch.nn as nn
from torch.utils.data import DataLoader
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingWarmRestarts
from transformers import RobertaTokenizer, ViTImageProcessor
from tqdm import tqdm
import wandb
from pathlib import Path

from model import MultiModalFusionNet, ModelConfig
from dataset import FakeNewsDataset, collate_fn
from losses import LabelSmoothingCrossEntropy
from evaluate import evaluate_model


def load_config(config_path: str) -> dict:
    """Load YAML configuration."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def setup_training(config: dict):
    """Initialize model, datasets, and training components."""
    
    # Device setup
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"🖥️ Using device: {device}")
    
    # Initialize tokenizer and image processor
    tokenizer = RobertaTokenizer.from_pretrained(config['model']['text_encoder'])
    image_processor = ViTImageProcessor.from_pretrained(config['model']['image_encoder'])
    
    # Create datasets
    train_dataset = FakeNewsDataset(
        parquet_path=f"{config['data']['processed']}/train.parquet",
        tokenizer=tokenizer,
        image_processor=image_processor,
        max_length=config['preprocessing']['max_text_length'],
        split='train'
    )
    
    val_dataset = FakeNewsDataset(
        parquet_path=f"{config['data']['processed']}/val.parquet",
        tokenizer=tokenizer,
        image_processor=image_processor,
        max_length=config['preprocessing']['max_text_length'],
        split='val'
    )
    
    # Create dataloaders
    train_loader = DataLoader(
        train_dataset,
        batch_size=config['training']['batch_size'],
        shuffle=True,
        collate_fn=collate_fn,
        num_workers=config['hardware']['num_workers'],
        pin_memory=True
    )
    
    val_loader = DataLoader(
        val_dataset,
        batch_size=config['training']['batch_size'] * 2,
        shuffle=False,
        collate_fn=collate_fn,
        num_workers=config['hardware']['num_workers'],
        pin_memory=True
    )
    
    # Initialize model
    model_config = ModelConfig(
        text_encoder=config['model']['text_encoder'],
        image_encoder=config['model']['image_encoder'],
        projection_dim=config['model']['projection_dim'],
        num_attention_heads=config['model']['num_attention_heads'],
        freeze_text_layers=config['model']['freeze_text_layers'],
        classifier_dropout=config['model']['classifier_dropout']
    )
    
    model = MultiModalFusionNet(model_config).to(device)
    
    print(f"📊 Model parameters: {model.get_total_params():,} total, "
          f"{model.get_trainable_params():,} trainable")
    
    # Optimizer with different LRs for encoder vs head
    encoder_params = list(model.text_encoder.parameters()) + \
                     list(model.image_encoder.parameters())
    head_params = list(model.text_projection.parameters()) + \
                  list(model.image_projection.parameters()) + \
                  list(model.cross_attention.parameters()) + \
                  list(model.classifier.parameters()) + \
                  [model.no_image_token]
    
    optimizer = AdamW([
        {'params': encoder_params, 'lr': config['training']['learning_rate_encoder']},
        {'params': head_params, 'lr': config['training']['learning_rate_head']}
    ], weight_decay=config['training']['weight_decay'])
    
    # Learning rate scheduler
    total_steps = len(train_loader) * config['training']['epochs']
    scheduler = CosineAnnealingWarmRestarts(
        optimizer,
        T_0=total_steps // config['training']['epochs'],
        T_mult=1
    )
    
    # Loss function
    criterion = LabelSmoothingCrossEntropy(
        smoothing=config['training']['label_smoothing']
    )
    
    # Mixed precision scaler
    scaler = torch.cuda.amp.GradScaler() if config['hardware']['mixed_precision'] else None
    
    return {
        'model': model,
        'train_loader': train_loader,
        'val_loader': val_loader,
        'optimizer': optimizer,
        'scheduler': scheduler,
        'criterion': criterion,
        'scaler': scaler,
        'device': device,
        'config': config
    }


def train_epoch(components: dict, epoch: int) -> float:
    """Train for one epoch."""
    model = components['model']
    train_loader = components['train_loader']
    optimizer = components['optimizer']
    scheduler = components['scheduler']
    criterion = components['criterion']
    scaler = components['scaler']
    device = components['device']
    config = components['config']
    
    model.train()
    total_loss = 0
    grad_accum_steps = config['training']['gradient_accumulation_steps']
    
    pbar = tqdm(train_loader, desc=f"Epoch {epoch+1}")
    
    for step, batch in enumerate(pbar):
        # Move to device
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['labels'].to(device)
        pixel_values = batch['pixel_values']
        if pixel_values is not None:
            pixel_values = pixel_values.to(device)
        
        # Forward pass with mixed precision
        with torch.cuda.amp.autocast(enabled=scaler is not None):
            logits = model(input_ids, attention_mask, pixel_values)
            loss = criterion(logits, labels)
            loss = loss / grad_accum_steps
        
        # Backward pass
        if scaler:
            scaler.scale(loss).backward()
        else:
            loss.backward()
        
        # Gradient accumulation
        if (step + 1) % grad_accum_steps == 0:
            if scaler:
                scaler.unscale_(optimizer)
                torch.nn.utils.clip_grad_norm_(
                    model.parameters(), 
                    config['training']['max_grad_norm']
                )
                scaler.step(optimizer)
                scaler.update()
            else:
                torch.nn.utils.clip_grad_norm_(
                    model.parameters(),
                    config['training']['max_grad_norm']
                )
                optimizer.step()
            
            scheduler.step()
            optimizer.zero_grad()
        
        total_loss += loss.item() * grad_accum_steps
        pbar.set_postfix({'loss': f'{loss.item() * grad_accum_steps:.4f}'})
        
        # Log to wandb
        if wandb.run and step % 100 == 0:
            wandb.log({
                'train/loss': loss.item() * grad_accum_steps,
                'train/lr': scheduler.get_last_lr()[0]
            })
    
    return total_loss / len(train_loader)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', type=str, default='ml/configs/config.yaml')
    parser.add_argument('--wandb', action='store_true', help='Enable W&B logging')
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    # Initialize W&B
    if args.wandb:
        wandb.init(project='fake-news-detection', config=config)
    
    # Setup training components
    components = setup_training(config)
    
    # Create checkpoint directory
    checkpoint_dir = Path(config['paths']['checkpoints'])
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    
    # Training loop
    best_f1 = 0
    patience_counter = 0
    
    for epoch in range(config['training']['epochs']):
        # Train
        train_loss = train_epoch(components, epoch)
        print(f"📈 Epoch {epoch+1} - Train Loss: {train_loss:.4f}")
        
        # Evaluate
        metrics = evaluate_model(
            components['model'],
            components['val_loader'],
            components['device']
        )
        
        print(f"📊 Val Metrics - Acc: {metrics['accuracy']:.4f}, "
              f"F1: {metrics['f1']:.4f}, AUC: {metrics['auc_roc']:.4f}")
        
        # Log to wandb
        if wandb.run:
            wandb.log({
                'epoch': epoch + 1,
                'train/epoch_loss': train_loss,
                'val/accuracy': metrics['accuracy'],
                'val/f1': metrics['f1'],
                'val/auc_roc': metrics['auc_roc'],
                'val/precision': metrics['precision'],
                'val/recall': metrics['recall']
            })
        
        # Save best model
        if metrics['f1'] > best_f1:
            best_f1 = metrics['f1']
            patience_counter = 0
            torch.save(
                components['model'].state_dict(),
                checkpoint_dir / 'best_model.pt'
            )
            print(f"💾 Saved best model with F1: {best_f1:.4f}")
        else:
            patience_counter += 1
        
        # Early stopping
        if patience_counter >= config['training']['early_stopping_patience']:
            print(f"⏹️ Early stopping at epoch {epoch+1}")
            break
    
    # Save final model
    torch.save(
        components['model'].state_dict(),
        checkpoint_dir / 'final_model.pt'
    )
    
    print(f"\n✅ Training complete! Best F1: {best_f1:.4f}")
    
    if wandb.run:
        wandb.finish()


if __name__ == '__main__':
    main()
```

---

## 2.5 Evaluation Module

```python
# ml/train/evaluate.py
"""Model evaluation and metrics computation."""

import torch
import numpy as np
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, 
    recall_score, roc_auc_score, confusion_matrix
)
from tqdm import tqdm
from typing import Dict


@torch.no_grad()
def evaluate_model(
    model: torch.nn.Module,
    dataloader: torch.utils.data.DataLoader,
    device: torch.device
) -> Dict[str, float]:
    """
    Evaluate model on a dataset.
    
    Returns:
        Dictionary with accuracy, f1, precision, recall, auc_roc
    """
    model.eval()
    
    all_preds = []
    all_probs = []
    all_labels = []
    
    for batch in tqdm(dataloader, desc="Evaluating"):
        input_ids = batch['input_ids'].to(device)
        attention_mask = batch['attention_mask'].to(device)
        labels = batch['labels'].to(device)
        pixel_values = batch['pixel_values']
        if pixel_values is not None:
            pixel_values = pixel_values.to(device)
        
        logits = model(input_ids, attention_mask, pixel_values)
        probs = torch.softmax(logits, dim=-1)
        preds = torch.argmax(probs, dim=-1)
        
        all_preds.extend(preds.cpu().numpy())
        all_probs.extend(probs[:, 1].cpu().numpy())  # Prob of class 1 (fake)
        all_labels.extend(labels.cpu().numpy())
    
    all_preds = np.array(all_preds)
    all_probs = np.array(all_probs)
    all_labels = np.array(all_labels)
    
    return {
        'accuracy': accuracy_score(all_labels, all_preds),
        'f1': f1_score(all_labels, all_preds, average='binary'),
        'precision': precision_score(all_labels, all_preds, average='binary'),
        'recall': recall_score(all_labels, all_preds, average='binary'),
        'auc_roc': roc_auc_score(all_labels, all_probs),
        'confusion_matrix': confusion_matrix(all_labels, all_preds).tolist()
    }


def run_test_evaluation(
    model_path: str,
    test_parquet: str,
    config: dict
) -> Dict[str, float]:
    """Run full evaluation on test set and print detailed report."""
    # Load model
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    model_config = ModelConfig(
        text_encoder=config['model']['text_encoder'],
        image_encoder=config['model']['image_encoder'],
        projection_dim=config['model']['projection_dim'],
        num_attention_heads=config['model']['num_attention_heads'],
        freeze_text_layers=config['model']['freeze_text_layers'],
        classifier_dropout=config['model']['classifier_dropout']
    )
    
    model = MultiModalFusionNet(model_config)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.to(device)
    model.eval()
    
    # Create test dataloader
    tokenizer = RobertaTokenizer.from_pretrained(config['model']['text_encoder'])
    image_processor = ViTImageProcessor.from_pretrained(config['model']['image_encoder'])
    
    test_dataset = FakeNewsDataset(
        parquet_path=test_parquet,
        tokenizer=tokenizer,
        image_processor=image_processor,
        max_length=config['preprocessing']['max_text_length'],
        split='test'
    )
    
    test_loader = DataLoader(
        test_dataset,
        batch_size=config['training']['batch_size'] * 2,
        shuffle=False,
        collate_fn=collate_fn,
        num_workers=config['hardware']['num_workers']
    )
    
    metrics = evaluate_model(model, test_loader, device)
    
    # Print detailed report
    print("\n" + "=" * 50)
    print("📊 TEST SET EVALUATION REPORT")
    print("=" * 50)
    print(f"Accuracy:  {metrics['accuracy']:.4f}")
    print(f"F1 Score:  {metrics['f1']:.4f}")
    print(f"Precision: {metrics['precision']:.4f}")
    print(f"Recall:    {metrics['recall']:.4f}")
    print(f"AUC-ROC:   {metrics['auc_roc']:.4f}")
    print("\nConfusion Matrix:")
    cm = metrics['confusion_matrix']
    print(f"  Pred Real | Pred Fake")
    print(f"Real: {cm[0][0]:5d} | {cm[0][1]:5d}")
    print(f"Fake: {cm[1][0]:5d} | {cm[1][1]:5d}")
    print("=" * 50)
    
    return metrics
```

---

## 2.6 Training Execution

### 2.6.1 Run Training

```bash
# Navigate to ML directory
cd ml

# Install dependencies
pip install -r requirements.txt

# Run training with W&B logging
python train/train.py --config configs/config.yaml --wandb

# Or without W&B
python train/train.py --config configs/config.yaml
```

### 2.6.2 Monitor Training

With W&B enabled:
- Visit https://wandb.ai to view real-time training curves
- Monitor loss, accuracy, F1, and AUC-ROC per epoch

Without W&B, training progress is printed to console.

---

## 2.7 Deliverables Checklist

After completing Phase 2, you should have:

- [ ] `ml/train/dataset.py` - FakeNewsDataset and collate_fn
- [ ] `ml/train/model.py` - MultiModalFusionNet architecture
- [ ] `ml/train/losses.py` - LabelSmoothingCrossEntropy
- [ ] `ml/train/train.py` - Training pipeline
- [ ] `ml/train/evaluate.py` - Evaluation metrics
- [ ] Trained model checkpoint: `ml/checkpoints/best_model.pt`
- [ ] Training completed with:
  - Validation F1 > 0.85
  - Validation AUC-ROC > 0.90
- [ ] Test set evaluation report saved

---

## 2.8 Expected Training Metrics

| Epoch | Train Loss | Val Accuracy | Val F1 | Val AUC |
|-------|------------|--------------|--------|---------|
| 1     | ~0.65      | ~0.78        | ~0.76  | ~0.85   |
| 3     | ~0.45      | ~0.84        | ~0.83  | ~0.90   |
| 5     | ~0.35      | ~0.87        | ~0.86  | ~0.92   |
| 10    | ~0.25      | ~0.89        | ~0.88  | ~0.94   |

---

## 2.9 Troubleshooting

### Issue: CUDA out of memory
**Solution**: Reduce batch_size in config.yaml, increase gradient_accumulation_steps

### Issue: Loss not decreasing
**Solution**: Check data loading, ensure images are properly normalized

### Issue: Poor validation performance
**Solution**: Increase freeze_text_layers, add more dropout, check for data leakage

### Issue: Training is very slow
**Solution**: Enable mixed_precision, increase num_workers, use SSD storage

---

## Next Phase

Once the model is trained and achieving target metrics, proceed to **Phase 3: Python Inference Service**.
