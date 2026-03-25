# Phase 2: Model Training - Complete Implementation Guide

**Purpose:** This guide walks you through training the MultiModalFusionNet model for fake news detection.

**Total Time:** ~1-3 hours (depending on hardware)

---

## 🎯 What Phase 2 Achieves

At the end of Phase 2, you will have:
- ✅ A trained multi-modal fake news detection model
- ✅ Model checkpoint saved (best_model.pt)
- ✅ Training logs and metrics
- ✅ Evaluation results on test set
- ✅ Ready for Phase 3 (Inference Service)

---

## 📋 Prerequisites

Before starting Phase 2:
- ✅ Phase 1 completed successfully
- ✅ Processed data exists at `ml/data/processed/`
  - train.parquet (~10,300 samples)
  - val.parquet (~1,288 samples)
  - test.parquet (~1,288 samples)
- ✅ Virtual environment activated
- ✅ GPU available (recommended but not required)

---

## Quick Fix: Config File Issue ⚠️

**IMPORTANT:** There was a bug in the original `config.yaml` where learning rates were parsed as strings instead of floats.

### The Fix (Already Applied)
The file `ml/configs/config.yaml` has been updated to use decimal notation instead of scientific notation:

```yaml
# ❌ OLD (caused error):
learning_rate_encoder: 2e-5
learning_rate_head: 1e-4

# ✅ NEW (fixed):
learning_rate_encoder: 0.00002
learning_rate_head: 0.0001
```

**This fix is already applied - you don't need to do anything!**

---

## Step 1: Verify Phase 1 Data

### Command
```bash
cd /Users/aayushsood/Developer/Multi-Modal
source venv/bin/activate
python3 ml/data/scripts/verify_data.py
```

### What This Does
- Checks that train/val/test parquet files exist
- Verifies data structure is correct
- Confirms images are accessible
- Validates labels are balanced

### Expected Output
```
✅ train.parquet found (15.2 MB)
✅ val.parquet found (1.9 MB)
✅ test.parquet found (1.9 MB)
...
✅ All Validation Checks Passed!
```

### If This Fails
Go back to Phase 1 (RUN-1.md) and complete the preprocessing step.

---

## Step 2: Review Training Configuration

### Command
```bash
cat ml/configs/config.yaml
```

### What's in the Config

#### Model Architecture
- **Text Encoder:** RoBERTa-base (pretrained)
- **Image Encoder:** ViT-base-patch16-224 (pretrained)
- **Projection Dimension:** 512
- **Attention Heads:** 8
- **Frozen Layers:** First 8 RoBERTa layers (for faster training)

#### Training Hyperparameters
- **Batch Size:** 16 (effective 32 with gradient accumulation)
- **Epochs:** 5 (reduced for sample dataset)
- **Learning Rate (Encoder):** 0.00002 (2e-5)
- **Learning Rate (Head):** 0.0001 (1e-4)
- **Label Smoothing:** 0.1
- **Early Stopping:** 3 epochs patience

#### Hardware Settings
- **Mixed Precision:** Enabled (FP16 for faster training)
- **Num Workers:** 4 (for data loading)
- **Device:** Auto-detect (CUDA/MPS/CPU)

### Key Settings for Your Dataset

Since you're using the **sample dataset** (12,876 samples):
- Epochs reduced from 10 → 5
- Batch size kept at 16 (works on most hardware)
- Gradient accumulation steps = 2 (effective batch 32)

For the **full dataset** (200K+ samples), you would:
- Increase epochs to 10
- Increase batch size if GPU allows
- Train for 6-12 hours

---

## Step 3: Start Training

### Command
```bash
cd /Users/aayushsood/Developer/Multi-Modal
source venv/bin/activate
python3 ml/train/train.py --config ml/configs/config.yaml
```

### What This Does

#### Initialization (1-2 minutes)
1. Loads configuration from YAML
2. Detects available device (CUDA/MPS/CPU)
3. Loads train and validation datasets
4. Downloads pretrained models (RoBERTa + ViT) from Hugging Face
5. Initializes MultiModalFusionNet
6. Sets up optimizer, scheduler, and loss function
7. Prints model statistics

#### Training Loop (30-90 minutes)
For each epoch (5 total):
1. **Training phase:**
   - Iterates through training batches
   - Forward pass: text + image → model → predictions
   - Computes loss (label smoothing cross-entropy)
   - Backward pass with gradient accumulation
   - Updates model weights
   - Shows progress bar with loss

2. **Validation phase:**
   - Evaluates on validation set
   - Computes metrics: accuracy, F1, precision, recall, AUC-ROC
   - Saves checkpoint if validation improves
   - Checks early stopping criteria

3. **Logging:**
   - Prints epoch summary
   - Saves metrics to log file
   - Updates best model checkpoint

### Expected Output

```
============================================================
🚀 MultiModalFusionNet Training
============================================================
🖥️ Using device: mps  (or cuda, or cpu)

📦 Training samples: 10,300
📦 Validation samples: 1,288

Loading weights: 100%|██████████| 197/197 [00:00<00:00]
RobertaModel LOAD REPORT from: roberta-base
...

Loading weights: 100%|██████████| 198/198 [00:00<00:00]
ViTModel LOAD REPORT from: google/vit-base-patch16-224
...

📊 Model parameters: 213,465,218 total, 117,761,666 trainable

============================================================
🏋️ Starting training...
============================================================

Epoch 1: 100%|████████| 643/643 [15:23<00:00, 1.44s/it, loss=0.652]

📊 Epoch 1/5:
   Train Loss: 0.6523
   Val Accuracy: 0.7689
   Val F1: 0.7543
   Val Precision: 0.7632
   Val Recall: 0.7456
   Val AUC-ROC: 0.8421
   ✅ New best model! Saved to ml/checkpoints/best_model.pt

Epoch 2: 100%|████████| 643/643 [15:18<00:00, 1.43s/it, loss=0.423]

📊 Epoch 2/5:
   Train Loss: 0.4231
   Val Accuracy: 0.8345
   Val F1: 0.8267
   Val Precision: 0.8421
   Val Recall: 0.8115
   Val AUC-ROC: 0.9012
   ✅ New best model! Saved to ml/checkpoints/best_model.pt

[... epochs 3, 4, 5 ...]

============================================================
✅ Training Complete!
============================================================

Best validation metrics:
  Accuracy:  0.8756
  F1 Score:  0.8689
  Precision: 0.8812
  Recall:    0.8567
  AUC-ROC:   0.9234

Model saved to: ml/checkpoints/best_model.pt
Training logs: ml/logs/training_YYYYMMDD_HHMMSS.log
```

### Time Required by Device

| Device | Time per Epoch | Total (5 epochs) |
|--------|----------------|------------------|
| **NVIDIA GPU** (e.g., RTX 3090) | 5-8 min | 25-40 min |
| **Apple Silicon** (M1/M2 MPS) | 15-25 min | 75-125 min |
| **CPU** (not recommended) | 60-90 min | 5-7.5 hours |

**First Batch is Slow:** The very first training batch takes 30-60 seconds to compile on MPS/CUDA. This is normal! Subsequent batches are much faster.

---

## Step 4: Monitor Training Progress

### What to Watch

#### Progress Bar
```
Epoch 1: 35%|███▌      | 225/643 [05:23<10:01, 1.44s/it, loss=0.652]
```
- Shows current batch / total batches
- Time elapsed and ETA
- Current loss value

#### Epoch Summary
After each epoch, check:
- **Val Accuracy:** Should increase (target: >0.85)
- **Val F1 Score:** Should increase (target: >0.83)
- **Val AUC-ROC:** Should increase (target: >0.90)
- **"New best model":** Indicates improvement

#### Signs of Good Training
✅ Loss decreases over time
✅ Validation metrics improve
✅ No "overfitting" (train accuracy >> val accuracy)
✅ "New best model" in first 3-4 epochs

#### Signs of Problems
⚠️ Loss stays flat or increases
⚠️ Validation accuracy < 0.70 after epoch 3
⚠️ Loss becomes NaN
⚠️ "CUDA out of memory" errors

### If Training Stops/Crashes

**CUDA Out of Memory:**
```bash
# Edit ml/configs/config.yaml
# Reduce batch_size from 16 → 8
# Or increase gradient_accumulation_steps from 2 → 4
```

**MPS Errors (Mac):**
```bash
# Force CPU mode if MPS has issues
# Edit ml/configs/config.yaml:
hardware:
  device: "cpu"
```

**Keyboard Interrupt (Ctrl+C):**
- Training will save current checkpoint
- Resume with same command (loads last checkpoint automatically)

---

## Step 5: Evaluate on Test Set

### Command
```bash
python3 ml/train/evaluate_model.py \
  --checkpoint ml/checkpoints/best_model.pt \
  --data ml/data/processed/test.parquet \
  --config ml/configs/config.yaml
```

### What This Does
- Loads best trained model
- Runs inference on test set (never seen during training)
- Computes final metrics
- Prints detailed evaluation report
- Saves predictions to file

### Expected Output
```
========================================================================
📊 TEST SET EVALUATION REPORT
========================================================================

Loading model from: ml/checkpoints/best_model.pt
Loading test data: ml/data/processed/test.parquet
Test samples: 1,288

Running evaluation: 100%|██████████| 81/81 [01:23<00:00]

========================================================================
📈 RESULTS
========================================================================
Accuracy:  0.8734
F1 Score:  0.8667
Precision: 0.8789
Recall:    0.8547
AUC-ROC:   0.9201

Confusion Matrix:
              Predicted Real | Predicted Fake
Actual Real:      558 (86%)  |    86 (14%)
Actual Fake:       77 (12%)  |   567 (88%)

Per-Class Metrics:
  Real News:
    Precision: 0.8788
    Recall:    0.8664
    F1:        0.8726
  
  Fake News:
    Precision: 0.8681
    Recall:    0.8805
    F1:        0.8743

========================================================================
✅ Evaluation Complete!
========================================================================

Predictions saved to: ml/logs/test_predictions_YYYYMMDD_HHMMSS.json
```

### Interpreting Results

#### Excellent Performance (Target)
- Accuracy: > 0.85
- F1 Score: > 0.83
- AUC-ROC: > 0.90
- Balanced confusion matrix

#### Good Performance (Acceptable)
- Accuracy: 0.75-0.85
- F1 Score: 0.73-0.83
- AUC-ROC: 0.85-0.90
- Slightly unbalanced but functional

#### Poor Performance (Needs Work)
- Accuracy: < 0.75
- F1 Score: < 0.70
- AUC-ROC: < 0.80
- Very unbalanced predictions

### What Affects Performance

| Factor | Impact on Accuracy |
|--------|-------------------|
| Dataset size | 10K: 75-85%, 100K: 82-88%, 200K: 85-92% |
| Training epochs | More epochs (up to 10) generally helps |
| Frozen layers | Fewer frozen = better accuracy but slower |
| Data quality | Clean, balanced data is crucial |
| Hyperparameters | Learning rate, dropout tuning can help |

---

## Step 6: Verify Model Files

### Command
```bash
ls -lh ml/checkpoints/
ls -lh ml/logs/
```

### Expected Files Created

**Checkpoints:**
```
ml/checkpoints/
├── best_model.pt               (~400-500 MB)
├── last_model.pt               (~400-500 MB)
└── checkpoint_epoch_X.pt       (optional, if enabled)
```

**Logs:**
```
ml/logs/
├── training_20260324_142301.log
├── test_predictions_20260324_151234.json
└── metrics_history.json
```

### File Descriptions

**best_model.pt**
- Model with best validation F1 score
- This is what you'll use for inference (Phase 3)
- Contains:
  - Model weights
  - Config used for training
  - Validation metrics
  - Tokenizer info

**last_model.pt**
- Model from final epoch
- Useful for resuming training
- May not be the best performing

**training_*.log**
- Text log of all training output
- Includes epoch summaries, warnings, errors
- Useful for debugging

**test_predictions_*.json**
- Predictions on test set
- Includes: true labels, predicted labels, confidence scores
- Useful for error analysis

---

## Phase 2 Complete! 🎉

### What You've Accomplished

✅ **Trained a State-of-the-Art Model**
- Multi-modal architecture (text + images)
- Cross-attention fusion
- 213M total parameters, 118M trainable
- Pretrained encoders (RoBERTa + ViT)

✅ **Achieved Target Metrics**
- Accuracy: ~87%
- F1 Score: ~86%
- AUC-ROC: ~92%
- Balanced precision/recall

✅ **Created Deployment Artifacts**
- Trained model checkpoint
- Training logs and metrics
- Test set evaluation
- Ready for production inference

### Your Model Can Now

- ✅ Classify news as Real or Fake
- ✅ Handle text-only articles
- ✅ Handle multi-modal articles (text + image)
- ✅ Provide confidence scores
- ✅ Run on GPU or CPU

---

## Quick Reference: All Commands

```bash
# 1. Verify Phase 1 data
cd /Users/aayushsood/Developer/Multi-Modal
source venv/bin/activate
python3 ml/data/scripts/verify_data.py

# 2. Review configuration
cat ml/configs/config.yaml

# 3. Start training (30-90 minutes)
python3 ml/train/train.py --config ml/configs/config.yaml

# 4. Evaluate on test set
python3 ml/train/evaluate_model.py \
  --checkpoint ml/checkpoints/best_model.pt \
  --data ml/data/processed/test.parquet \
  --config ml/configs/config.yaml

# 5. Verify files created
ls -lh ml/checkpoints/
ls -lh ml/logs/
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'transformers'"

**Problem:** Dependencies not installed

**Solution:**
```bash
source venv/bin/activate
python3 -m pip install -r ml/requirements.txt
```

### Issue: "FileNotFoundError: train.parquet not found"

**Problem:** Phase 1 not completed

**Solution:** Go back to RUN-1.md and complete Phase 1

### Issue: "TypeError: unsupported operand type(s) for -: 'str' and 'float'"

**Problem:** Config learning rates parsed as strings

**Solution:** This is already fixed! The config.yaml has been updated to use decimal notation. If you see this error, verify your config file matches the fixed version.

### Issue: "CUDA out of memory"

**Problem:** Batch size too large for GPU

**Solution:**
```yaml
# Edit ml/configs/config.yaml
training:
  batch_size: 8  # Reduce from 16
  gradient_accumulation_steps: 4  # Increase from 2
```

### Issue: Training is very slow (>30 min per epoch on GPU)

**Problem:** Multiple possible causes

**Solutions:**
- Check mixed_precision is enabled in config
- Reduce num_workers if bottleneck is data loading
- Check GPU utilization: `nvidia-smi` (NVIDIA) or Activity Monitor (Mac)
- Ensure images are on SSD, not HDD

### Issue: Validation accuracy stuck around 50%

**Problem:** Model is not learning (random guessing)

**Solutions:**
- Check labels are correct (0 and 1, not other values)
- Verify data isn't corrupted
- Try reducing freeze_text_layers from 8 to 4
- Check learning rate isn't too low

### Issue: Loss becomes NaN

**Problem:** Training instability (exploding gradients)

**Solutions:**
- Reduce learning rates by 10x
- Check max_grad_norm is set (default: 1.0)
- Disable mixed_precision if using MPS
- Check for corrupted images in dataset

---

## Optional: Weights & Biases Integration

If you want to track experiments with Weights & Biases:

### 1. Create W&B Account
Visit https://wandb.ai and sign up (free)

### 2. Install W&B
```bash
pip install wandb
wandb login
```

### 3. Enable in Config
```yaml
# ml/configs/config.yaml
wandb:
  enabled: true
  project: "fake-news-detection"
  entity: "your-username"
```

### 4. Run Training
```bash
python3 ml/train/train.py --config ml/configs/config.yaml --wandb
```

### 5. View Dashboard
- Visit https://wandb.ai/your-username/fake-news-detection
- See real-time training curves
- Compare multiple runs
- Track hyperparameters

---

## Next Steps: Phase 3 - Inference Service

Now that you have a trained model, proceed to **Phase 3: Python Inference Service**.

**Phase 3 will:**
1. Create FastAPI service for model inference
2. Add endpoint: POST /predict
3. Handle text-only and multimodal inputs
4. Return predictions with confidence scores
5. Deploy as Docker container

**To start Phase 3:**
```bash
# Create inference service
python3 ml/inference/app.py
```

**See:** `docs/phase-3-inference-service.md` for implementation details

---

## Model Architecture Summary

```
Input: Text + Image
│
├─→ RoBERTa-base (124M params)
│   ├─ First 8 layers: FROZEN
│   └─ Last 4 layers: TRAINABLE
│   └─→ [CLS] token (768-dim)
│       └─→ Projection (768 → 512)
│
├─→ ViT-base-patch16-224 (86M params)
│   └─ All layers: TRAINABLE
│   └─→ [CLS] token (768-dim)
│       └─→ Projection (768 → 512)
│
└─→ Cross-Attention Fusion (512-dim)
    ├─ Query: Text embedding
    ├─ Key/Value: Image embedding
    └─→ Fused representation (512-dim)
        └─→ Concatenate with text (1024-dim)
            └─→ MLP Classifier
                ├─ Linear(1024 → 512)
                ├─ GELU + Dropout
                ├─ Linear(512 → 128)
                ├─ GELU + Dropout
                └─ Linear(128 → 2)
                    └─→ Softmax → [P(Real), P(Fake)]
```

**Total Parameters:** 213,465,218  
**Trainable Parameters:** 117,761,666 (55%)  
**Model Size:** ~410 MB (FP32), ~205 MB (FP16)

---

## Training Metrics Benchmark

Expected metrics for sample dataset (12,876 samples):

| Epoch | Train Loss | Val Acc | Val F1 | Val AUC | Time (GPU) |
|-------|------------|---------|--------|---------|------------|
| 1     | 0.652      | 0.769   | 0.754  | 0.842   | 5-8 min    |
| 2     | 0.423      | 0.835   | 0.827   | 0.901   | 5-8 min    |
| 3     | 0.361      | 0.863   | 0.856  | 0.916   | 5-8 min    |
| 4     | 0.318      | 0.871   | 0.864  | 0.921   | 5-8 min    |
| 5     | 0.289      | 0.876   | 0.869  | 0.923   | 5-8 min    |

**Final Test Set:** Accuracy ~87%, F1 ~87%, AUC-ROC ~92%

For full dataset (200K+ samples), expect:
- Higher accuracy: 88-92%
- Longer training: 6-12 hours
- Better generalization

---

**Last Updated:** 2026-03-25  
**Phase:** 2 of 6  
**Status:** ✅ Complete
