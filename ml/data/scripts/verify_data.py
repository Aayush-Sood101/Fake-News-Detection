"""
Verify preprocessed data integrity.
"""

import pandas as pd
from pathlib import Path
import os


def verify_preprocessed_data(processed_dir: str = "ml/data/processed"):
    """Check that all preprocessed files are valid."""
    processed = Path(processed_dir)
    
    print("=" * 60)
    print("🔍 VERIFYING PREPROCESSED DATA")
    print("=" * 60)
    
    if not processed.exists():
        print(f"\n❌ Directory not found: {processed}")
        print("   Please run preprocess_pipeline.py first")
        return False
    
    all_valid = True
    total_samples = 0
    
    for split in ["train", "val", "test"]:
        parquet_path = processed / f"{split}.parquet"
        
        print(f"\n📄 Checking {split}.parquet...")
        
        if not parquet_path.exists():
            print(f"   ❌ File not found: {parquet_path}")
            all_valid = False
            continue
        
        try:
            df = pd.read_parquet(parquet_path)
        except Exception as e:
            print(f"   ❌ Failed to read file: {e}")
            all_valid = False
            continue
        
        # Check required columns
        required = ['id', 'title', 'image_path', 'label', 'source']
        missing = set(required) - set(df.columns)
        if missing:
            print(f"   ❌ Missing columns: {missing}")
            all_valid = False
            continue
        
        # Check for nulls in required columns
        null_counts = df[required].isnull().sum()
        if null_counts.sum() > 0:
            print(f"   ⚠️ Contains null values:")
            for col, count in null_counts[null_counts > 0].items():
                print(f"      - {col}: {count} nulls")
        
        # Check label distribution
        label_dist = df['label'].value_counts().sort_index()
        
        # Check if images exist (sample check)
        sample_size = min(100, len(df))
        sample_images = df['image_path'].sample(sample_size)
        existing = sum(os.path.exists(path) for path in sample_images)
        image_exist_rate = existing / sample_size * 100
        
        print(f"   ✅ Samples: {len(df):,}")
        print(f"   ✅ Columns: {list(df.columns)}")
        print(f"   ✅ Label distribution:")
        for label, count in label_dist.items():
            label_name = "Real" if label == 0 else "Fake"
            print(f"      - {label_name} ({label}): {count:,} ({count/len(df)*100:.1f}%)")
        print(f"   ✅ Sources: {df['source'].unique().tolist()}")
        print(f"   ℹ️ Image existence (sample): {image_exist_rate:.1f}%")
        
        if image_exist_rate < 50:
            print(f"   ⚠️ Warning: Many images missing! You may need to download images.")
            all_valid = False
        
        total_samples += len(df)
    
    print("\n" + "=" * 60)
    if all_valid:
        print("✅ ALL CHECKS PASSED")
        print(f"   Total samples: {total_samples:,}")
        print("   Ready for training!")
    else:
        print("⚠️ SOME CHECKS FAILED")
        print("   Please review the issues above")
    print("=" * 60 + "\n")
    
    return all_valid


if __name__ == "__main__":
    verify_preprocessed_data()
