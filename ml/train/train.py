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
from pathlib import Path

from model import MultiModalFusionNet, ModelConfig
from dataset import FakeNewsDataset, collate_fn
from losses import LabelSmoothingCrossEntropy
from ml.train.evaluate_model import evaluate_model

# Optional W&B import
try:
    import wandb
    WANDB_AVAILABLE = True
except ImportError:
    WANDB_AVAILABLE = False


def load_config(config_path: str) -> dict:
    """Load YAML configuration."""
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)


def setup_training(config: dict):
    """Initialize model, datasets, and training components."""
    
    # Device setup
    device_setting = config['hardware'].get('device', 'auto')
    if device_setting == 'auto':
        if torch.cuda.is_available():
            device = torch.device('cuda')
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            device = torch.device('mps')
        else:
            device = torch.device('cpu')
    else:
        device = torch.device(device_setting)
    
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
    
    print(f"📦 Training samples: {len(train_dataset):,}")
    print(f"📦 Validation samples: {len(val_dataset):,}")
    
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
    use_amp = config['hardware']['mixed_precision'] and device.type == 'cuda'
    scaler = torch.amp.GradScaler('cuda') if use_amp else None
    
    return {
        'model': model,
        'train_loader': train_loader,
        'val_loader': val_loader,
        'optimizer': optimizer,
        'scheduler': scheduler,
        'criterion': criterion,
        'scaler': scaler,
        'device': device,
        'config': config,
        'use_amp': use_amp
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
    use_amp = components['use_amp']
    
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
        with torch.amp.autocast(device_type=device.type, enabled=use_amp):
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
        if WANDB_AVAILABLE and wandb.run and step % 100 == 0:
            wandb.log({
                'train/loss': loss.item() * grad_accum_steps,
                'train/lr': scheduler.get_last_lr()[0]
            })
    
    return total_loss / len(train_loader)


def main():
    parser = argparse.ArgumentParser(description='Train MultiModalFusionNet')
    parser.add_argument('--config', type=str, default='ml/configs/config.yaml',
                        help='Path to YAML config file')
    parser.add_argument('--wandb', action='store_true',
                        help='Enable Weights & Biases logging')
    args = parser.parse_args()
    
    # Load configuration
    config = load_config(args.config)
    
    print("=" * 60)
    print("🚀 MultiModalFusionNet Training")
    print("=" * 60)
    
    # Initialize W&B
    if args.wandb and WANDB_AVAILABLE:
        wandb.init(project=config.get('wandb', {}).get('project', 'fake-news-detection'),
                   config=config)
        print("📊 Weights & Biases logging enabled")
    elif args.wandb and not WANDB_AVAILABLE:
        print("⚠️ wandb not installed. Install with: pip install wandb")
    
    # Setup training components
    components = setup_training(config)
    
    # Create checkpoint directory
    checkpoint_dir = Path(config['paths']['checkpoints'])
    checkpoint_dir.mkdir(parents=True, exist_ok=True)
    
    # Training loop
    best_f1 = 0
    patience_counter = 0
    
    print("\n" + "=" * 60)
    print("🏋️ Starting training...")
    print("=" * 60)
    
    for epoch in range(config['training']['epochs']):
        # Train
        train_loss = train_epoch(components, epoch)
        print(f"\n📈 Epoch {epoch+1} - Train Loss: {train_loss:.4f}")
        
        # Evaluate
        metrics = evaluate_model(
            components['model'],
            components['val_loader'],
            components['device']
        )
        
        print(f"📊 Val Metrics - Acc: {metrics['accuracy']:.4f}, "
              f"F1: {metrics['f1']:.4f}, AUC: {metrics['auc_roc']:.4f}")
        
        # Log to wandb
        if WANDB_AVAILABLE and wandb.run:
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
    print(f"💾 Models saved to: {checkpoint_dir}/")
    print(f"   - best_model.pt  (best validation F1)")
    print(f"   - final_model.pt (last epoch)")
    
    if WANDB_AVAILABLE and wandb.run:
        wandb.finish()


if __name__ == '__main__':
    main()
