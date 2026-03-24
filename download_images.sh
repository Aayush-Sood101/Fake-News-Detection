#!/bin/bash
# Helper script to download images for Fakeddit dataset
# Usage: ./download_images.sh

set -e  # Exit on error

echo "========================================================================"
echo "📸 Fakeddit Image Downloader - Helper Script"
echo "========================================================================"
echo ""

# Get the project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAKEDDIT_DIR="${PROJECT_ROOT}/ml/data/raw/fakeddit/Fakeddit"

# Check if we're in a virtual environment
if [ -z "$VIRTUAL_ENV" ]; then
    echo "⚠️  Virtual environment not activated. Activating venv..."
    if [ -f "${PROJECT_ROOT}/venv/bin/activate" ]; then
        source "${PROJECT_ROOT}/venv/bin/activate"
        echo "✅ Virtual environment activated"
    else
        echo "❌ Virtual environment not found at ${PROJECT_ROOT}/venv/"
        echo "   Please create it first: python3 -m venv venv"
        exit 1
    fi
fi

# Check if sample TSV files exist
if [ ! -f "${FAKEDDIT_DIR}/multimodal_only_samples/train_sample.tsv" ]; then
    echo "❌ Sample TSV files not found!"
    echo "   Please run: python3 ml/data/scripts/download_fakeddit.py"
    exit 1
fi

# Change to Fakeddit directory
cd "${FAKEDDIT_DIR}"
echo "📂 Working directory: $(pwd)"
echo ""

# Note: Skipping Fakeddit's requirements.txt (has old versions incompatible with Python 3.14)
# You already have the necessary dependencies in your venv from ml/requirements.txt
echo "📦 Dependencies already installed in venv"
echo ""

# Download images for each split
echo "========================================================================"
echo "Starting image downloads (this will take 30-90 minutes)"
echo "Using improved downloader with error handling and rate limiting"
echo "========================================================================"
echo ""

echo "📥 [1/3] Downloading training images..."
python3 image_downloader_improved.py multimodal_only_samples/train_sample.tsv --delay 0.2

echo ""
echo "📥 [2/3] Downloading validation images..."
python3 image_downloader_improved.py multimodal_only_samples/validate_sample.tsv --delay 0.2

echo ""
echo "📥 [3/3] Downloading test images..."
python3 image_downloader_improved.py multimodal_only_samples/test_sample.tsv --delay 0.2

echo ""
echo "========================================================================"
echo "✅ Image download complete!"
echo "========================================================================"
echo ""
echo "📊 Next steps:"
echo "   1. Run preprocessing: python3 ml/data/scripts/preprocess_pipeline.py"
echo "   2. Verify data: python3 ml/data/scripts/verify_data.py"
echo ""
