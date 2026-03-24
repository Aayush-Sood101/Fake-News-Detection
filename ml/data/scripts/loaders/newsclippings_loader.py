"""
Loader for NewsCLIPpings dataset.
"""

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
    
    if not (base / "news_clippings").exists():
        print("⚠️ NewsCLIPpings directory not found. Skipping this dataset.")
        return pd.DataFrame(columns=['id', 'title', 'body', 'image_path', 'label', 'source'])
    
    if not img_dir.exists():
        print("⚠️ VisualNews images directory not found. Skipping NewsCLIPpings.")
        return pd.DataFrame(columns=['id', 'title', 'body', 'image_path', 'label', 'source'])
    
    data_dir = base / "news_clippings" / "data" / "merged_balanced"
    
    if not data_dir.exists():
        print("⚠️ NewsCLIPpings data directory not found. Skipping this dataset.")
        return pd.DataFrame(columns=['id', 'title', 'body', 'image_path', 'label', 'source'])
    
    all_samples = []
    for split_file in ["train.json", "val.json", "test.json"]:
        json_path = data_dir / split_file
        if not json_path.exists():
            print(f"⚠️ Skipping {split_file} - file not found")
            continue
        
        print(f"📖 Loading {split_file}...")
        with open(json_path, 'r') as f:
            samples = json.load(f)
            all_samples.extend(samples)
    
    if not all_samples:
        print("⚠️ No NewsCLIPpings data loaded")
        return pd.DataFrame(columns=['id', 'title', 'body', 'image_path', 'label', 'source'])
    
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
    print(f"✅ Loaded {len(df):,} samples from NewsCLIPpings")
    
    # Report label distribution
    label_counts = df['label'].value_counts()
    print(f"   Real (0): {label_counts.get(0, 0):,}")
    print(f"   Fake (1): {label_counts.get(1, 0):,}")
    
    return df
