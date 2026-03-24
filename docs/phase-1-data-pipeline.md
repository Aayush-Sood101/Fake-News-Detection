# Phase 1: Data Pipeline & Preprocessing

> **Goal**: Download, clean, merge, and prepare the datasets for training the multimodal fake news detection model.

---

## Overview

This phase establishes the foundation for the entire ML pipeline. We'll download two large-scale datasets (Fakeddit and NewsCLIPpings), normalize their formats, filter out invalid samples, and create stratified train/validation/test splits.

**Estimated Effort**: 2-3 days  
**Prerequisites**: Python 3.10+, 150GB+ free disk space, stable internet connection

---

## 1.1 Project Structure Setup

Create the ML directory structure:

```bash
mkdir -p ml/{train,inference,data/{raw,processed,scripts},checkpoints,configs}
```

Create the initial `requirements.txt` for the ML service:

```txt
# ml/requirements.txt
torch>=2.0.0
torchvision>=0.15.0
transformers>=4.30.0
datasets>=2.12.0
fastapi>=0.100.0
uvicorn>=0.23.0
pillow>=10.0.0
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
pyarrow>=12.0.0
requests>=2.31.0
tqdm>=4.65.0
python-dotenv>=1.0.0
wandb>=0.15.0
pyyaml>=6.0.0
```

---

## 1.2 Download Fakeddit Dataset

The Fakeddit dataset contains ~1 million Reddit posts with text and images labeled for fake news detection.

### 1.2.1 Create Download Script

```python
# ml/data/scripts/download_fakeddit.py
"""
Downloads the Fakeddit multimodal dataset.
Source: https://github.com/entitize/Fakeddit
"""

import os
import subprocess
from pathlib import Path

RAW_DIR = Path("ml/data/raw/fakeddit")

def download_fakeddit():
    """Clone Fakeddit repo and download multimodal subset."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    # Clone the repository (contains TSV metadata)
    if not (RAW_DIR / "Fakeddit").exists():
        subprocess.run([
            "git", "clone", 
            "https://github.com/entitize/Fakeddit.git",
            str(RAW_DIR / "Fakeddit")
        ], check=True)
    
    print("✅ Fakeddit metadata downloaded")
    print("📌 Next step: Download images using their image_downloader.py")
    print("   cd ml/data/raw/fakeddit/Fakeddit")
    print("   python image_downloader.py multimodal_only_samples/train.tsv")
    print("   python image_downloader.py multimodal_only_samples/validate.tsv")
    print("   python image_downloader.py multimodal_only_samples/test.tsv")

if __name__ == "__main__":
    download_fakeddit()
```

### 1.2.2 Image Download Process

The Fakeddit images must be downloaded separately using their provided script. This process takes several hours:

```bash
cd ml/data/raw/fakeddit/Fakeddit
pip install -r requirements.txt

# Download images for each split (parallelizable)
python image_downloader.py multimodal_only_samples/train.tsv --num_processes 8
python image_downloader.py multimodal_only_samples/validate.tsv --num_processes 8
python image_downloader.py multimodal_only_samples/test.tsv --num_processes 8
```

**Expected Output Structure**:
```
ml/data/raw/fakeddit/
├── Fakeddit/
│   ├── multimodal_only_samples/
│   │   ├── train.tsv
│   │   ├── validate.tsv
│   │   └── test.tsv
│   └── images/
│       ├── <image_id>.jpg
│       └── ...
```

---

## 1.3 Download NewsCLIPpings Dataset

NewsCLIPpings focuses specifically on image-text inconsistency detection.

### 1.3.1 Create Download Script

```python
# ml/data/scripts/download_newsclippings.py
"""
Downloads the NewsCLIPpings dataset.
Source: https://github.com/g-luo/news_clippings
Note: Requires separate download of VisualNews images.
"""

import os
import subprocess
from pathlib import Path

RAW_DIR = Path("ml/data/raw/newsclippings")

def download_newsclippings():
    """Clone NewsCLIPpings repo."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    if not (RAW_DIR / "news_clippings").exists():
        subprocess.run([
            "git", "clone",
            "https://github.com/g-luo/news_clippings.git",
            str(RAW_DIR / "news_clippings")
        ], check=True)
    
    print("✅ NewsCLIPpings metadata downloaded")
    print("📌 Next step: Download VisualNews images")
    print("   Follow instructions at: https://github.com/g-luo/news_clippings#data")
    print("   The VisualNews dataset requires signing a license agreement")

if __name__ == "__main__":
    download_newsclippings()
```

### 1.3.2 VisualNews Image Acquisition

VisualNews images require:
1. Visit https://github.com/facebookresearch/VisualNews
2. Fill out the data request form
3. Download and extract images to `ml/data/raw/newsclippings/visualnews_images/`

---

## 1.4 Data Preprocessing Pipeline

### 1.4.1 Fakeddit Loader

```python
# ml/data/scripts/loaders/fakeddit_loader.py
"""Loader for Fakeddit dataset."""

import pandas as pd
from pathlib import Path
from tqdm import tqdm

def load_fakeddit(base_path: str) -> pd.DataFrame:
    """
    Load and normalize Fakeddit dataset.
    
    Args:
        base_path: Path to Fakeddit directory
        
    Returns:
        DataFrame with columns: [id, title, body, image_path, label, source]
    """
    base = Path(base_path)
    image_dir = base / "Fakeddit" / "images"
    
    dfs = []
    for split_file in ["train.tsv", "validate.tsv", "test.tsv"]:
        tsv_path = base / "Fakeddit" / "multimodal_only_samples" / split_file
        if not tsv_path.exists():
            print(f"⚠️ Skipping {split_file} - file not found")
            continue
            
        df = pd.read_csv(tsv_path, sep='\t')
        dfs.append(df)
    
    if not dfs:
        raise FileNotFoundError("No Fakeddit TSV files found")
    
    combined = pd.concat(dfs, ignore_index=True)
    
    # Normalize to standard schema
    normalized = pd.DataFrame({
        'id': combined['id'].astype(str),
        'title': combined['title'].fillna(''),
        'body': '',  # Fakeddit only has titles
        'image_path': combined['id'].apply(
            lambda x: str(image_dir / f"{x}.jpg")
        ),
        'label': combined['2_way_label'].astype(int),  # 0=Real, 1=Fake
        'source': 'fakeddit'
    })
    
    print(f"📊 Loaded {len(normalized)} samples from Fakeddit")
    return normalized
```

### 1.4.2 NewsCLIPpings Loader

```python
# ml/data/scripts/loaders/newsclippings_loader.py
"""Loader for NewsCLIPpings dataset."""

import json
import pandas as pd
from pathlib import Path

def load_newsclippings(base_path: str, visualnews_path: str) -> pd.DataFrame:
    """
    Load and normalize NewsCLIPpings dataset.
    
    Args:
        base_path: Path to news_clippings directory
        visualnews_path: Path to VisualNews images
        
    Returns:
        DataFrame with columns: [id, title, body, image_path, label, source]
    """
    base = Path(base_path)
    img_dir = Path(visualnews_path)
    
    data_dir = base / "news_clippings" / "data" / "merged_balanced"
    
    all_samples = []
    for split_file in ["train.json", "val.json", "test.json"]:
        json_path = data_dir / split_file
        if not json_path.exists():
            print(f"⚠️ Skipping {split_file} - file not found")
            continue
            
        with open(json_path, 'r') as f:
            samples = json.load(f)
            all_samples.extend(samples)
    
    # Convert to normalized schema
    records = []
    for sample in all_samples:
        # NewsCLIPpings uses image_id that maps to VisualNews
        image_path = img_dir / f"{sample['image_id']}.jpg"
        
        records.append({
            'id': f"nc_{sample['id']}",
            'title': sample['caption'],
            'body': '',
            'image_path': str(image_path),
            'label': sample['label'],  # 0=pristine(real), 1=falsified(fake)
            'source': 'newsclippings'
        })
    
    df = pd.DataFrame(records)
    print(f"📊 Loaded {len(df)} samples from NewsCLIPpings")
    return df
```

### 1.4.3 Main Preprocessing Pipeline

```python
# ml/data/scripts/preprocess_pipeline.py
"""
Main preprocessing pipeline that:
1. Loads both datasets
2. Filters invalid samples
3. Merges and balances
4. Creates stratified splits
5. Saves as Parquet files
"""

import os
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from tqdm import tqdm

# Import loaders
from loaders.fakeddit_loader import load_fakeddit
from loaders.newsclippings_loader import load_newsclippings


def filter_valid_samples(df: pd.DataFrame) -> pd.DataFrame:
    """Remove samples with missing images or empty titles."""
    initial_count = len(df)
    
    # Filter empty titles
    df = df[df['title'].str.strip().str.len() > 0]
    
    # Filter missing images
    valid_images = []
    for _, row in tqdm(df.iterrows(), total=len(df), desc="Validating images"):
        valid_images.append(os.path.exists(row['image_path']))
    
    df = df[valid_images]
    
    removed = initial_count - len(df)
    print(f"🗑️ Removed {removed} invalid samples ({removed/initial_count*100:.1f}%)")
    return df


def create_splits(df: pd.DataFrame, output_dir: str):
    """Create stratified train/val/test splits and save as Parquet."""
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    
    # Stratified split: 80% train, 10% val, 10% test
    train_df, temp_df = train_test_split(
        df, 
        test_size=0.2, 
        stratify=df['label'],
        random_state=42
    )
    
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.5,
        stratify=temp_df['label'],
        random_state=42
    )
    
    # Save splits
    train_df.to_parquet(output / "train.parquet", index=False)
    val_df.to_parquet(output / "val.parquet", index=False)
    test_df.to_parquet(output / "test.parquet", index=False)
    
    # Print statistics
    print("\n📊 Dataset Statistics:")
    print(f"   Train: {len(train_df):,} samples")
    print(f"   Val:   {len(val_df):,} samples")
    print(f"   Test:  {len(test_df):,} samples")
    print(f"\n   Label distribution (train):")
    print(f"   - Real (0): {(train_df['label']==0).sum():,}")
    print(f"   - Fake (1): {(train_df['label']==1).sum():,}")


def main():
    """Run the complete preprocessing pipeline."""
    print("=" * 60)
    print("🚀 Starting Data Preprocessing Pipeline")
    print("=" * 60)
    
    # Configuration
    FAKEDDIT_PATH = "ml/data/raw/fakeddit"
    NEWSCLIPPINGS_PATH = "ml/data/raw/newsclippings"
    VISUALNEWS_PATH = "ml/data/raw/newsclippings/visualnews_images"
    OUTPUT_PATH = "ml/data/processed"
    
    # Step 1: Load datasets
    print("\n📥 Loading datasets...")
    df_fakeddit = load_fakeddit(FAKEDDIT_PATH)
    df_newsclip = load_newsclippings(NEWSCLIPPINGS_PATH, VISUALNEWS_PATH)
    
    # Step 2: Merge datasets
    print("\n🔗 Merging datasets...")
    df_combined = pd.concat([df_fakeddit, df_newsclip], ignore_index=True)
    print(f"   Combined: {len(df_combined):,} total samples")
    
    # Step 3: Filter invalid samples
    print("\n🔍 Filtering invalid samples...")
    df_valid = filter_valid_samples(df_combined)
    
    # Step 4: Create and save splits
    print("\n💾 Creating stratified splits...")
    create_splits(df_valid, OUTPUT_PATH)
    
    print("\n✅ Preprocessing complete!")
    print(f"   Output saved to: {OUTPUT_PATH}/")


if __name__ == "__main__":
    main()
```

---

## 1.5 Configuration File

Create a YAML configuration file for all ML settings:

```yaml
# ml/configs/config.yaml

# Data paths
data:
  raw_fakeddit: "ml/data/raw/fakeddit"
  raw_newsclippings: "ml/data/raw/newsclippings"
  visualnews_images: "ml/data/raw/newsclippings/visualnews_images"
  processed: "ml/data/processed"
  
# Model configuration
model:
  text_encoder: "roberta-base"
  image_encoder: "google/vit-base-patch16-224"
  projection_dim: 512
  num_attention_heads: 8
  num_classes: 2
  freeze_text_layers: 8  # Freeze first 8 RoBERTa layers
  classifier_dropout: 0.2

# Training configuration
training:
  batch_size: 32
  gradient_accumulation_steps: 4
  epochs: 10
  learning_rate_encoder: 2e-5
  learning_rate_head: 1e-4
  warmup_steps: 500
  weight_decay: 0.01
  max_grad_norm: 1.0
  label_smoothing: 0.1
  early_stopping_patience: 3
  
# Data processing
preprocessing:
  max_text_length: 256
  image_size: 224
  
# Paths
paths:
  checkpoints: "ml/checkpoints"
  logs: "ml/logs"
  
# Hardware
hardware:
  mixed_precision: true
  num_workers: 4
```

---

## 1.6 Verification Script

Create a script to verify the preprocessing was successful:

```python
# ml/data/scripts/verify_data.py
"""Verify preprocessed data integrity."""

import pandas as pd
from pathlib import Path

def verify_preprocessed_data(processed_dir: str = "ml/data/processed"):
    """Check that all preprocessed files are valid."""
    processed = Path(processed_dir)
    
    print("🔍 Verifying preprocessed data...")
    
    for split in ["train", "val", "test"]:
        parquet_path = processed / f"{split}.parquet"
        
        if not parquet_path.exists():
            print(f"❌ Missing: {parquet_path}")
            continue
            
        df = pd.read_parquet(parquet_path)
        
        # Check required columns
        required = ['id', 'title', 'image_path', 'label', 'source']
        missing = set(required) - set(df.columvns)
        if missing:
            print(f"❌ {split}: Missing columns: {missing}")
            continue
            
        # Check for nulls
        null_counts = df[required].isnull().sum()
        if null_counts.sum() > 0:
            print(f"⚠️ {split}: Contains null values")
            print(null_counts[null_counts > 0])
            
        # Check label distribution
        label_dist = df['label'].value_counts()
        
        print(f"✅ {split}.parquet:")
        print(f"   Samples: {len(df):,}")
        print(f"   Real (0): {label_dist.get(0, 0):,}")
        print(f"   Fake (1): {label_dist.get(1, 0):,}")
        print(f"   Sources: {df['source'].unique().tolist()}")
        print()

if __name__ == "__main__":
    verify_preprocessed_data()
```

---

## 1.7 Deliverables Checklist

After completing Phase 1, you should have:

- [ ] ML directory structure created (`ml/train/`, `ml/inference/`, etc.)
- [ ] `requirements.txt` with all Python dependencies
- [ ] Fakeddit TSV files downloaded
- [ ] Fakeddit images downloaded (at least multimodal subset)
- [ ] NewsCLIPpings JSON files downloaded
- [ ] VisualNews images obtained
- [ ] `preprocess_pipeline.py` script completed
- [ ] Preprocessed Parquet files in `ml/data/processed/`:
  - `train.parquet` (~200K+ samples)
  - `val.parquet` (~25K+ samples)
  - `test.parquet` (~25K+ samples)
- [ ] `config.yaml` with all hyperparameters
- [ ] Data verification script passing

---

## 1.8 Common Issues & Solutions

### Issue: Image download fails frequently
**Solution**: Use retry logic and lower parallelism:
```bash
python image_downloader.py train.tsv --num_processes 4 --timeout 30
```

### Issue: Out of disk space
**Solution**: Download only multimodal_only_samples subset, not full Fakeddit dataset

### Issue: VisualNews access denied
**Solution**: Ensure you've signed the academic license agreement on their website

### Issue: Parquet files are too large
**Solution**: Split by source dataset and load incrementally during training

---

## Next Phase

Once the data pipeline is complete and verified, proceed to **Phase 2: Model Architecture & Training**.
