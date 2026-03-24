"""
Download Fakeddit multimodal dataset (SAMPLE VERSION).
This downloads only a small subset for quick development/testing.
Source: https://github.com/entitize/Fakeddit
"""

import os
import subprocess
import sys
from pathlib import Path
import pandas as pd
from tqdm import tqdm

RAW_DIR = Path("ml/data/raw/fakeddit")
SAMPLE_SIZE = 5000  # Download only 5000 samples for quick testing

# Google Drive file IDs for the TSV files
GDRIVE_FOLDER_ID = "1jU7qgDqU1je9Y0PMKJ_f31yXRo5uWGFm"
GDRIVE_TSV_URL = "https://drive.google.com/drive/folders/1jU7qgDqU1je9Y0PMKJ_f31yXRo5uWGFm?usp=sharing"


def download_fakeddit_metadata():
    """Clone Fakeddit repo to get TSV metadata files."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    repo_path = RAW_DIR / "Fakeddit"
    
    if repo_path.exists():
        print("✅ Fakeddit repository already exists")
        return
    
    print("📥 Cloning Fakeddit repository...")
    try:
        subprocess.run([
            "git", "clone", 
            "--depth", "1",  # Shallow clone to save time
            "https://github.com/entitize/Fakeddit.git",
            str(repo_path)
        ], check=True)
        print("✅ Fakeddit metadata downloaded")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to clone repository: {e}")
        raise


def download_tsv_instructions():
    """Print instructions for downloading TSV files from Google Drive."""
    print("\n" + "=" * 70)
    print("📥 MANUAL STEP REQUIRED: Download TSV Metadata Files")
    print("=" * 70)
    print("\nThe Fakeddit TSV files must be downloaded manually from Google Drive.")
    print(f"\n1. Visit: {GDRIVE_TSV_URL}")
    print("\n2. Download the 'multimodal_only_samples' folder")
    print("   - This folder contains: train.tsv, validate.tsv, test.tsv")
    print("   - Total size: ~500MB")
    print()
    print("3. Extract/move the files to:")
    print(f"   {RAW_DIR / 'Fakeddit' / 'multimodal_only_samples'}/")
    print()
    print("Expected structure:")
    print("   ml/data/raw/fakeddit/Fakeddit/multimodal_only_samples/")
    print("   ├── train.tsv")
    print("   ├── validate.tsv")
    print("   └── test.tsv")
    print()
    print("=" * 70)
    print("\n⏸️  Please complete the download, then re-run this script.")
    print("   Command: python3 ml/data/scripts/download_fakeddit.py")
    print("=" * 70)


def create_sample_subset():
    """Create a smaller sample of the dataset for development."""
    repo_path = RAW_DIR / "Fakeddit"
    multimodal_path = repo_path / "multimodal_only_samples"
    
    if not multimodal_path.exists() or not list(multimodal_path.glob("*.tsv")):
        download_tsv_instructions()
        return False
    
    print(f"\n📊 Creating sample subset ({SAMPLE_SIZE} samples per split)...")
    
    # Map of split names to possible file names
    split_files = {
        "train": ["multimodal_train.tsv", "train.tsv"],
        "validate": ["multimodal_validate.tsv", "validate.tsv"],
        "test": ["multimodal_test_public.tsv", "test.tsv", "multimodal_test.tsv"]
    }
    
    for split, possible_names in split_files.items():
        # Try to find the file with any of the possible names
        tsv_file = None
        for name in possible_names:
            candidate = multimodal_path / name
            if candidate.exists():
                tsv_file = candidate
                break
        
        if not tsv_file:
            print(f"⚠️  {split} TSV not found (tried: {possible_names}), skipping...")
            continue
        
        # Read and sample
        print(f"   Reading {tsv_file.name}...")
        df = pd.read_csv(tsv_file, sep='\t', nrows=SAMPLE_SIZE * 2)  # Read more for filtering
        
        # Balance the dataset (equal real/fake)
        if '2_way_label' in df.columns:
            df_real = df[df['2_way_label'] == 0].head(SAMPLE_SIZE // 2)
            df_fake = df[df['2_way_label'] == 1].head(SAMPLE_SIZE // 2)
            df_sample = pd.concat([df_real, df_fake]).sample(frac=1).reset_index(drop=True)
        else:
            df_sample = df.head(SAMPLE_SIZE)
        
        # Save sample
        sample_file = multimodal_path / f"{split}_sample.tsv"
        df_sample.to_csv(sample_file, sep='\t', index=False)
        print(f"   ✅ Created {split}_sample.tsv with {len(df_sample)} samples")
    
    print("\n✅ Sample subsets created")
    return True


def print_image_download_instructions():
    """Print instructions for downloading images."""
    repo_path = RAW_DIR / "Fakeddit"
    
    print("\n" + "=" * 70)
    print("📸 NEXT STEP: Download Images for Sample Dataset")
    print("=" * 70)
    print("\nTo download images for the sample dataset, run these commands:\n")
    print(f"cd {repo_path}")
    print()
    print("# Download images for each sample split (this will take some time)")
    print("python3 image_downloader.py multimodal_only_samples/train_sample.tsv")
    print("python3 image_downloader.py multimodal_only_samples/validate_sample.tsv")
    print("python3 image_downloader.py multimodal_only_samples/test_sample.tsv")
    print()
    print("OR use the helper script from project root:")
    print("./download_images.sh")
    print()
    print("NOTE: Image downloading may take 30-90 minutes depending on your internet speed.")
    print("Images are downloaded sequentially (one at a time).")
    print("Some images may fail to download (broken links), which is normal.")
    print("=" * 70)


def main():
    """Run the complete download pipeline."""
    print("=" * 70)
    print("🚀 Fakeddit Dataset Download (Sample Version)")
    print("=" * 70)
    
    # Step 1: Download metadata (git repo)
    print("\n[Step 1/3] Downloading metadata repository...")
    download_fakeddit_metadata()
    
    # Step 2: Download TSV files (manual from Google Drive)
    print("\n[Step 2/3] Checking for TSV metadata files...")
    tsv_created = create_sample_subset()
    
    # Step 3: Print image download instructions (only if TSV files exist)
    if tsv_created:
        print("\n[Step 3/3] Image download instructions...")
        print_image_download_instructions()
        print("\n✅ Script completed! Follow the instructions above to download images.\n")
    else:
        print("\n⏸️  Please download TSV files first, then re-run this script.\n")


if __name__ == "__main__":
    main()
