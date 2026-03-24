"""
Main preprocessing pipeline that:
1. Loads both datasets
2. Filters invalid samples
3. Merges and balances
4. Creates stratified splits
5. Saves as Parquet files
"""

import os
import sys
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from tqdm import tqdm

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from loaders.fakeddit_loader import load_fakeddit
from loaders.newsclippings_loader import load_newsclippings


def filter_valid_samples(df: pd.DataFrame) -> pd.DataFrame:
    """Remove samples with missing images or empty titles."""
    initial_count = len(df)
    
    print("\n🔍 Filtering invalid samples...")
    
    # Filter empty titles
    df = df[df['title'].str.strip().str.len() > 0]
    print(f"   After title filter: {len(df):,} samples")
    
    # Filter missing images
    print("   Checking image files...")
    valid_images = []
    for _, row in tqdm(df.iterrows(), total=len(df), desc="   Validating images"):
        valid_images.append(os.path.exists(row['image_path']))
    
    df = df[valid_images].reset_index(drop=True)
    
    removed = initial_count - len(df)
    print(f"\n   ✅ Removed {removed:,} invalid samples ({removed/initial_count*100:.1f}%)")
    print(f"   ✅ Kept {len(df):,} valid samples")
    
    return df


def create_splits(df: pd.DataFrame, output_dir: str):
    """Create stratified train/val/test splits and save as Parquet."""
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    
    print("\n📊 Creating stratified splits...")
    
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
    print("   Saving Parquet files...")
    train_df.to_parquet(output / "train.parquet", index=False)
    val_df.to_parquet(output / "val.parquet", index=False)
    test_df.to_parquet(output / "test.parquet", index=False)
    
    # Print statistics
    print("\n" + "=" * 60)
    print("📊 DATASET STATISTICS")
    print("=" * 60)
    print(f"\n✅ Train: {len(train_df):,} samples")
    print(f"   - Real (0): {(train_df['label']==0).sum():,}")
    print(f"   - Fake (1): {(train_df['label']==1).sum():,}")
    
    print(f"\n✅ Validation: {len(val_df):,} samples")
    print(f"   - Real (0): {(val_df['label']==0).sum():,}")
    print(f"   - Fake (1): {(val_df['label']==1).sum():,}")
    
    print(f"\n✅ Test: {len(test_df):,} samples")
    print(f"   - Real (0): {(test_df['label']==0).sum():,}")
    print(f"   - Fake (1): {(test_df['label']==1).sum():,}")
    
    print(f"\n✅ Total: {len(df):,} samples")
    print("=" * 60)


def main():
    """Run the complete preprocessing pipeline."""
    print("=" * 60)
    print("🚀 PREPROCESSING PIPELINE")
    print("=" * 60)
    
    # Configuration
    FAKEDDIT_PATH = "ml/data/raw/fakeddit"
    NEWSCLIPPINGS_PATH = "ml/data/raw/newsclippings"
    VISUALNEWS_PATH = "ml/data/raw/newsclippings/visualnews_images"
    OUTPUT_PATH = "ml/data/processed"
    USE_SAMPLE = True  # Use sample datasets by default
    
    # Step 1: Load datasets
    print("\n[Step 1/4] Loading datasets...")
    print(f"   Using sample datasets: {USE_SAMPLE}")
    
    df_fakeddit = load_fakeddit(FAKEDDIT_PATH, use_sample=USE_SAMPLE)
    
    # Try to load NewsCLIPpings (optional)
    try:
        df_newsclip = load_newsclippings(NEWSCLIPPINGS_PATH, VISUALNEWS_PATH)
    except Exception as e:
        print(f"⚠️ Could not load NewsCLIPpings: {e}")
        df_newsclip = pd.DataFrame(columns=['id', 'title', 'body', 'image_path', 'label', 'source'])
    
    # Step 2: Merge datasets
    print("\n[Step 2/4] Merging datasets...")
    if len(df_newsclip) > 0:
        df_combined = pd.concat([df_fakeddit, df_newsclip], ignore_index=True)
        print(f"   ✅ Combined: {len(df_combined):,} total samples")
        print(f"      - Fakeddit: {len(df_fakeddit):,}")
        print(f"      - NewsCLIPpings: {len(df_newsclip):,}")
    else:
        df_combined = df_fakeddit
        print(f"   ℹ️ Using only Fakeddit: {len(df_combined):,} samples")
    
    # Step 3: Filter invalid samples
    print("\n[Step 3/4] Filtering invalid samples...")
    df_valid = filter_valid_samples(df_combined)
    
    # Step 4: Create and save splits
    print("\n[Step 4/4] Creating stratified splits...")
    create_splits(df_valid, OUTPUT_PATH)
    
    print("\n" + "=" * 60)
    print("✅ PREPROCESSING COMPLETE!")
    print("=" * 60)
    print(f"\n📁 Output saved to: {OUTPUT_PATH}/")
    print("   - train.parquet")
    print("   - val.parquet")
    print("   - test.parquet")
    print("\n🎯 You can now proceed to Phase 2: Model Training")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
