"""Model evaluation and metrics computation."""

import torch
import numpy as np
from torch.utils.data import DataLoader
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, 
    recall_score, roc_auc_score, confusion_matrix
)
from tqdm import tqdm
from typing import Dict

try:
    from .model import MultiModalFusionNet, ModelConfig
    from .dataset import FakeNewsDataset, collate_fn
except ImportError:
    from model import MultiModalFusionNet, ModelConfig
    from dataset import FakeNewsDataset, collate_fn


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
    from transformers import RobertaTokenizer, ViTImageProcessor
    
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


if __name__ == '__main__':
    import argparse
    import yaml
    
    parser = argparse.ArgumentParser(description='Evaluate trained model on test set')
    parser.add_argument('--checkpoint', type=str, required=True,
                        help='Path to model checkpoint')
    parser.add_argument('--data', type=str, required=True,
                        help='Path to test parquet file')
    parser.add_argument('--config', type=str, required=True,
                        help='Path to config YAML file')
    
    args = parser.parse_args()
    
    # Load config
    with open(args.config, 'r') as f:
        config = yaml.safe_load(f)
    
    print("\n" + "=" * 70)
    print("📊 Model Evaluation")
    print("=" * 70)
    print(f"Checkpoint: {args.checkpoint}")
    print(f"Test data:  {args.data}")
    print(f"Config:     {args.config}")
    print()
    
    # Check if checkpoint exists
    import os
    if not os.path.exists(args.checkpoint):
        print(f"❌ Error: Checkpoint not found at {args.checkpoint}")
        print(f"\nDid you complete training? The checkpoint should be created after training.")
        print(f"Run: python3 ml/train/train.py --config {args.config}")
        exit(1)
    
    if not os.path.exists(args.data):
        print(f"❌ Error: Test data not found at {args.data}")
        print(f"\nDid you complete Phase 1 preprocessing?")
        exit(1)
    
    # Run evaluation
    try:
        metrics = run_test_evaluation(args.checkpoint, args.data, config)
        print("\n✅ Evaluation complete!")
    except Exception as e:
        print(f"\n❌ Error during evaluation: {e}")
        import traceback
        traceback.print_exc()
        exit(1)

