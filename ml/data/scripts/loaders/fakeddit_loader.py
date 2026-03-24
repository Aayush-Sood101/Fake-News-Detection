"""
Loader for Fakeddit dataset.
Handles both full dataset and sample subsets.
"""

import pandas as pd
from pathlib import Path
from tqdm import tqdm
import os


def load_fakeddit(base_path: str, use_sample: bool = True) -> pd.DataFrame:
    """
    Load and normalize Fakeddit dataset.
    
    Args:
        base_path: Path to Fakeddit directory
        use_sample: If True, use sample TSV files; otherwise use full dataset
        
    Returns:
        DataFrame with columns: [id, title, body, image_path, label, source]
    """
    base = Path(base_path)
    image_dir = base / "Fakeddit" / "images"
    
    if not (base / "Fakeddit").exists():
        raise FileNotFoundError(
            f"Fakeddit directory not found at {base / 'Fakeddit'}. "
            "Please run download_fakeddit.py first."
        )
    
    # Determine which files to load
    suffix = "_sample" if use_sample else ""
    split_files = [
        f"train{suffix}.tsv",
        f"validate{suffix}.tsv",
        f"test{suffix}.tsv"
    ]
    
    dfs = []
    for split_file in split_files:
        tsv_path = base / "Fakeddit" / "multimodal_only_samples" / split_file
        
        if not tsv_path.exists():
            print(f"⚠️ Skipping {split_file} - file not found")
            continue
        
        print(f"📖 Loading {split_file}...")
        df = pd.read_csv(tsv_path, sep='\t')
        dfs.append(df)
    
    if not dfs:
        raise FileNotFoundError(
            f"No Fakeddit TSV files found. "
            f"Looking for: {split_files} in {base / 'Fakeddit' / 'multimodal_only_samples'}"
        )
    
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
    
    print(f"✅ Loaded {len(normalized):,} samples from Fakeddit")
    
    # Report label distribution
    label_counts = normalized['label'].value_counts()
    print(f"   Real (0): {label_counts.get(0, 0):,}")
    print(f"   Fake (1): {label_counts.get(1, 0):,}")
    
    return normalized
