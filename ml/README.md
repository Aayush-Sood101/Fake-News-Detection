# ML Service - Fake News Detection

This directory contains the machine learning components for training and inference.

## Directory Structure

```
ml/
├── train/              # Training scripts (Phase 2)
├── inference/          # FastAPI inference service (Phase 3)
├── data/              
│   ├── raw/           # Raw downloaded datasets
│   ├── processed/     # Preprocessed Parquet files
│   └── scripts/       # Data processing scripts
├── checkpoints/       # Saved model weights
├── configs/          # Configuration files
├── logs/             # Training logs
└── requirements.txt  # Python dependencies
```

## Phase 1: Data Pipeline (Current Phase)

### Quick Start

```bash
# From project root directory
python ml/setup_phase1.py
```

This will:
1. Install Python dependencies
2. Download dataset metadata
3. Create sample subsets

### After Automated Setup

You need to manually:
1. Download Fakeddit images (~30-60 min)
2. Run preprocessing pipeline
3. Verify the data

**See detailed instructions:** `docs/manual-steps-phase1.md`

### Quick Command Reference

```bash
# Download Fakeddit images
cd ml/data/raw/fakeddit/Fakeddit
python image_downloader.py multimodal_only_samples/train_sample.tsv --num_processes 4
python image_downloader.py multimodal_only_samples/validate_sample.tsv --num_processes 4
python image_downloader.py multimodal_only_samples/test_sample.tsv --num_processes 4
cd ../../../../

# Run preprocessing
python ml/data/scripts/preprocess_pipeline.py

# Verify data
python ml/data/scripts/verify_data.py
```

## Configuration

Edit `ml/configs/config.yaml` to adjust:
- Model architecture parameters
- Training hyperparameters
- Data paths
- Hardware settings

## Dataset Information

### Fakeddit (Sample)
- **Size:** ~5,000 samples per split (train/val/test)
- **Total:** ~10,000 samples after filtering
- **Format:** Reddit posts with titles and images
- **Labels:** 0 = Real, 1 = Fake (balanced 50/50)

### NewsCLIPpings (Optional)
- **Size:** Variable based on VisualNews availability
- **Format:** News captions with associated images
- **Labels:** 0 = Pristine (real), 1 = Falsified (fake)

## Next Phases

- **Phase 2:** Model Training (implement model architecture, train on preprocessed data)
- **Phase 3:** Inference Service (FastAPI server for predictions)
- **Phase 4:** Backend Integration (Node.js API gateway)
- **Phase 5:** Frontend (Next.js user interface)
- **Phase 6:** Testing & Deployment

## Troubleshooting

### Import Errors
```bash
pip install -r ml/requirements.txt
```

### Missing Images
Make sure you ran the image downloader from Step 1 in `docs/manual-steps-phase1.md`

### Preprocessing Fails
Check that:
- Images are downloaded to `ml/data/raw/fakeddit/Fakeddit/images/`
- You have at least 5GB free disk space
- TSV files exist in `multimodal_only_samples/`

### Verification Fails
If image existence rate is low (<50%), you need to download more images.

## Dependencies

Key libraries:
- PyTorch 2.0+ (deep learning)
- Transformers 4.30+ (RoBERTa, ViT models)
- FastAPI (inference server)
- Pandas (data processing)
- Pillow (image handling)

For full list, see `requirements.txt`
