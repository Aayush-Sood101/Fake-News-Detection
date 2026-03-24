"""
Download NewsCLIPpings dataset (SAMPLE VERSION).
This provides instructions for downloading a subset.
Source: https://github.com/g-luo/news_clippings
"""

import os
import subprocess
from pathlib import Path

RAW_DIR = Path("ml/data/raw/newsclippings")


def download_newsclippings_metadata():
    """Clone NewsCLIPpings repository."""
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    repo_path = RAW_DIR / "news_clippings"
    
    if repo_path.exists():
        print("✅ NewsCLIPpings repository already exists")
        return
    
    print("📥 Cloning NewsCLIPpings repository...")
    try:
        subprocess.run([
            "git", "clone",
            "--depth", "1",
            "https://github.com/g-luo/news_clippings.git",
            str(repo_path)
        ], check=True)
        print("✅ NewsCLIPpings metadata downloaded")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to clone repository: {e}")
        raise


def print_visualnews_instructions():
    """Print instructions for obtaining VisualNews images."""
    print("\n" + "=" * 70)
    print("📸 IMPORTANT: VisualNews Dataset Required")
    print("=" * 70)
    print("\nNewsCLIPpings requires the VisualNews image dataset.")
    print("\nTo obtain VisualNews images:")
    print("\n1. Visit: https://github.com/facebookresearch/VisualNews")
    print("2. Fill out the data request form (academic license required)")
    print("3. Download the image dataset")
    print("4. Extract images to: ml/data/raw/newsclippings/visualnews_images/")
    print()
    print("ALTERNATIVE for quick testing:")
    print("You can skip NewsCLIPpings and train only on Fakeddit samples.")
    print("The model will still work, just with less training data.")
    print("=" * 70)


def main():
    """Run the download pipeline."""
    print("=" * 70)
    print("🚀 NewsCLIPpings Dataset Setup")
    print("=" * 70)
    
    print("\n[Step 1/1] Downloading metadata...")
    download_newsclippings_metadata()
    
    print_visualnews_instructions()
    
    print("\n✅ Metadata downloaded. Follow instructions above for images.\n")


if __name__ == "__main__":
    main()
