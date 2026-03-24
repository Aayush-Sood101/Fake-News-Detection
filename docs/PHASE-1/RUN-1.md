# Phase 1: Complete Implementation Guide

**Purpose:** This guide walks you through every command needed to complete Phase 1 (Data Pipeline & Preprocessing) of the Multi-Modal Fake News Detection project.

**Total Time:** ~2-3 hours (mostly download time)

---

## Table of Contents
1. [Prerequisites Check](#step-1-prerequisites-check)
2. [Activate Virtual Environment](#step-2-activate-virtual-environment)
3. [Install Python Dependencies](#step-3-install-python-dependencies)
4. [Download Fakeddit Metadata](#step-4-download-fakeddit-metadata)
5. [Download TSV Files (Manual)](#step-5-download-tsv-files-manual)
6. [Create Sample TSV Files](#step-6-create-sample-tsv-files)
7. [Download Images](#step-7-download-images)
8. [Run Preprocessing Pipeline](#step-8-run-preprocessing-pipeline)
9. [Verify Data](#step-9-verify-data)
10. [Phase 1 Complete](#phase-1-complete)

---

## Step 1: Prerequisites Check

### Command
```bash
cd /Users/aayushsood/Developer/Multi-Modal
python3 ml/check_environment.py
```

### What This Does
- Verifies Python version is 3.10 or higher ✅
- Checks if git is installed ✅
- Checks directory structure exists ✅
- Checks available disk space (needs ~20GB free) ✅
- Lists any missing dependencies ✅

### Expected Output
```
✅ Python version: 3.14.x
✅ Git is installed
✅ Directory structure: OK
✅ Available disk space: 50.2 GB (>20GB required)
⚠️  Some dependencies missing (will install next)
```

### If This Fails
- **Python too old:** Install Python 3.10+ from python.org
- **Git missing:** Install with `brew install git` (macOS)
- **Low disk space:** Free up at least 20GB before continuing

---

## Step 2: Activate Virtual Environment

### Command
```bash
cd /Users/aayushsood/Developer/Multi-Modal
source venv/bin/activate
```

### What This Does
- Activates your Python virtual environment
- Isolates project dependencies from system Python
- Your prompt will change to show `(venv)` prefix

### Expected Output
```
(venv) aayushsood~$
```

### If This Fails
If `venv/` doesn't exist, create it first:
```bash
python3 -m venv venv
source venv/bin/activate
```

### Important
**Keep this terminal window open!** You'll run all subsequent commands in this activated environment.

---

## Step 3: Install Python Dependencies

### Command
```bash
python3 -m pip install -r ml/requirements.txt
```

### What This Does
- Installs all Python packages needed for Phase 1
- Packages include:
  - `torch` - PyTorch for neural networks
  - `transformers` - Hugging Face models (RoBERTa, ViT)
  - `pandas` - Data manipulation
  - `scikit-learn` - Data splitting and preprocessing
  - `Pillow` - Image processing
  - `fastapi`, `uvicorn` - For Phase 3 (API service)
  - `tqdm` - Progress bars
  - And 20+ more dependencies

### Expected Output
```
Collecting torch>=2.0.0
  Downloading torch-2.x.x-cp314-cp314-macosx_11_0_arm64.whl (60 MB)
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 60.0/60.0 MB 5.2 MB/s eta 0:00:00
...
Successfully installed torch-2.x.x transformers-4.x.x pandas-2.x.x ...
```

### Time Required
- **First install:** 5-10 minutes (downloads ~2GB of packages)
- **Already installed:** <1 minute

### If This Fails
**Error: "externally-managed-environment"**
- You're not in the virtual environment. Go back to Step 2.

**Error: "No matching distribution found"**
- Check Python version: `python3 --version` (needs 3.10+)

---

## Step 4: Download Fakeddit Metadata

### Command
```bash
python3 ml/data/scripts/download_fakeddit.py
```

### What This Does
- Clones the Fakeddit GitHub repository (metadata only, not images)
- Checks if TSV files exist in `multimodal_only_samples/` folder
- If TSV files are found, creates balanced sample files (5,000 samples per split)
- If TSV files NOT found, shows instructions for manual download

### Expected Output (First Time)
```
======================================================================
🚀 Fakeddit Dataset Download (Sample Version)
======================================================================

[Step 1/3] Downloading metadata repository...
📥 Cloning Fakeddit repository...
✅ Fakeddit metadata downloaded

[Step 2/3] Checking for TSV metadata files...

======================================================================
📥 MANUAL STEP REQUIRED: Download TSV Metadata Files
======================================================================

The Fakeddit TSV files must be downloaded manually from Google Drive.

1. Visit: https://drive.google.com/drive/folders/1jU7qgDqU1je9Y0PMKJ_f31yXRo5uWGFm?usp=sharing

2. Download the 'multimodal_only_samples' folder
   - This folder contains: train.tsv, validate.tsv, test.tsv
   - Total size: ~500MB

3. Extract/move the files to:
   ml/data/raw/fakeddit/Fakeddit/multimodal_only_samples/

⏸️  Please complete the download, then re-run this script.
======================================================================
```

### Time Required
- Git clone: ~30 seconds
- Shows instructions for next step

### Files Created
```
ml/data/raw/fakeddit/Fakeddit/
├── .git/
├── image_downloader.py
├── requirements.txt
└── README.md
```

---

## Step 5: Download TSV Files (Manual)

### What to Do
This is a **manual step** because the files are hosted on Google Drive.

1. **Open this link in your browser:**
   https://drive.google.com/drive/folders/1jU7qgDqU1je9Y0PMKJ_f31yXRo5uWGFm?usp=sharing

2. **Download these files:**
   - `multimodal_train.tsv` (~150MB)
   - `multimodal_validate.tsv` (~16MB)
   - `multimodal_test_public.tsv` (~16MB)
   
   OR download the entire `multimodal_only_samples` folder

3. **Place files here:**
   ```bash
   /Users/aayushsood/Developer/Multi-Modal/ml/data/raw/fakeddit/Fakeddit/multimodal_only_samples/
   ```

4. **Create the directory if needed:**
   ```bash
   mkdir -p /Users/aayushsood/Developer/Multi-Modal/ml/data/raw/fakeddit/Fakeddit/multimodal_only_samples
   ```

5. **Move downloaded files:**
   ```bash
   # If files are in ~/Downloads/
   mv ~/Downloads/multimodal_*.tsv /Users/aayushsood/Developer/Multi-Modal/ml/data/raw/fakeddit/Fakeddit/multimodal_only_samples/
   ```

### Verify Files Exist
```bash
ls -lh /Users/aayushsood/Developer/Multi-Modal/ml/data/raw/fakeddit/Fakeddit/multimodal_only_samples/
```

**Expected output:**
```
-rw-r--r--  16M  multimodal_test_public.tsv
-rw-r--r-- 148M  multimodal_train.tsv
-rw-r--r--  16M  multimodal_validate.tsv
```

### What These Files Contain
- **TSV (Tab-Separated Values) format** with metadata for Reddit posts
- Each row = one news article with:
  - `id` - Unique Reddit post ID
  - `clean_title` - Article headline
  - `2_way_label` - Label (0=Real, 1=Fake)
  - `image_url` - URL to download image from
  - `hasImage` - Boolean indicating if post has image
  - ~25 other columns with metadata

### Time Required
- Download time: 5-10 minutes (depends on internet speed)

---

## Step 6: Create Sample TSV Files

### Command
```bash
python3 ml/data/scripts/download_fakeddit.py
```

### What This Does
- Reads the full TSV files you just downloaded
- Creates **balanced samples** of 5,000 entries per split:
  - 2,500 Real news articles
  - 2,500 Fake news articles
- Saves as `train_sample.tsv`, `validate_sample.tsv`, `test_sample.tsv`
- Prints instructions for downloading images

### Expected Output
```
======================================================================
🚀 Fakeddit Dataset Download (Sample Version)
======================================================================

[Step 1/3] Downloading metadata repository...
✅ Fakeddit repository already exists

[Step 2/3] Checking for TSV metadata files...

📊 Creating sample subset (5000 samples per split)...
   Reading multimodal_train.tsv...
   ✅ Created train_sample.tsv with 5000 samples
   Reading multimodal_validate.tsv...
   ✅ Created validate_sample.tsv with 5000 samples
   Reading multimodal_test_public.tsv...
   ✅ Created test_sample.tsv with 5000 samples

✅ Sample subsets created

[Step 3/3] Image download instructions...
======================================================================
```

### Time Required
- ~1-2 minutes

### Files Created
```
ml/data/raw/fakeddit/Fakeddit/multimodal_only_samples/
├── multimodal_train.tsv        (original, 200K+ samples)
├── multimodal_validate.tsv     (original)
├── multimodal_test_public.tsv  (original)
├── train_sample.tsv            ← NEW (5,000 samples)
├── validate_sample.tsv         ← NEW (5,000 samples)
└── test_sample.tsv             ← NEW (5,000 samples)
```

### Why Sample Instead of Full Dataset?
- **Full dataset:** 200K+ samples, ~40GB images, 6-12 hours to download, 6-12 hours to train
- **Sample dataset:** 15K samples, ~10GB images, 1-2 hours to download, 30-60 min to train
- Sample is perfect for development and testing!

---

## Step 7: Download Images

### Option A: Use Helper Script (EASIEST ⭐)

#### Command
```bash
cd /Users/aayushsood/Developer/Multi-Modal
source venv/bin/activate  # If not already activated
./download_images.sh
```

#### What This Does
- Navigates to correct directory automatically
- Downloads images for all 3 splits (train, validate, test)
- Uses improved downloader with:
  - Error handling (continues on failed images)
  - Rate limit protection (0.2s delay between requests)
  - Resume capability (skips already downloaded images)
  - Progress bars and statistics
- Saves images to `ml/data/raw/fakeddit/Fakeddit/images/`

#### Expected Output
```
========================================================================
📸 Fakeddit Image Downloader - Helper Script
========================================================================

📂 Working directory: .../ml/data/raw/fakeddit/Fakeddit
📦 Dependencies already installed in venv

========================================================================
Starting image downloads (this will take 60-120 minutes)
Using improved downloader with error handling and rate limiting
========================================================================

📥 [1/3] Downloading training images...
📖 Reading multimodal_only_samples/train_sample.tsv...
📁 Created images/ directory

📥 Starting download of 5000 samples...
   Delay: 0.2s between requests
   Timeout: 10s per image

Downloading: 100%|███████████████████| 5000/5000 [25:30<00:00, 3.27it/s]

======================================================================
📊 Download Summary
======================================================================
   Total samples:        5000
   ✅ Downloaded:        4532
   ♻️  Already existed:   0
   ⏭️  Skipped (no image): 234
   ❌ Failed:            234
   📈 Success rate:      95.1%
======================================================================

✅ Download complete! Images saved to images/ directory

📥 [2/3] Downloading validation images...
[... similar output ...]

📥 [3/3] Downloading test images...
[... similar output ...]

========================================================================
✅ Image download complete!
========================================================================

📊 Next steps:
   1. Run preprocessing: python3 ml/data/scripts/preprocess_pipeline.py
   2. Verify data: python3 ml/data/scripts/verify_data.py
```

### Option B: Manual Download (Advanced)

#### Commands
```bash
cd /Users/aayushsood/Developer/Multi-Modal/ml/data/raw/fakeddit/Fakeddit
source ../../../../venv/bin/activate

python3 image_downloader_improved.py multimodal_only_samples/train_sample.tsv --delay 0.2
python3 image_downloader_improved.py multimodal_only_samples/validate_sample.tsv --delay 0.2
python3 image_downloader_improved.py multimodal_only_samples/test_sample.tsv --delay 0.2
```

#### What This Does
Same as Option A, but you control each split individually.

### Time Required
- **Per split:** 20-40 minutes
- **Total (all 3 splits):** 60-120 minutes
- Depends on:
  - Internet speed
  - Reddit server load
  - Number of failed images

### What's Happening During Download
1. Script reads each sample TSV file
2. For each row with an image:
   - Fetches the image from Reddit's servers
   - Saves as `images/<post_id>.jpg`
   - Waits 0.2 seconds (rate limiting)
3. If an image fails (404, timeout, etc.):
   - Logs the failure
   - Continues with next image
4. Shows progress bar and statistics

### Expected Results
- **Images downloaded:** ~12,000-13,500 out of 15,000
- **Success rate:** 80-95%
- **Failed images:** 5-20% (normal! Reddit posts get deleted)
- **Storage used:** ~9-15GB

### Files Created
```
ml/data/raw/fakeddit/Fakeddit/images/
├── 1a2b3c.jpg
├── 4d5e6f.jpg
├── 7g8h9i.jpg
└── ... (~13,000 total images)
```

### If Download Gets Interrupted
**Just re-run the same command!** The script will:
- Skip already downloaded images
- Continue from where it left off
- Show "Already existed" count in statistics

### Troubleshooting

#### Images Downloading Very Slowly
- **Normal!** Each image downloads from Reddit individually
- You're downloading 13,000+ images at 2-4 images/second
- Can't be parallelized due to Reddit's rate limits

#### Many Images Failing (404 errors)
- **Normal!** Some Reddit posts get deleted over time
- As long as success rate is >70%, you're good
- The preprocessing script will filter out missing images

#### Rate Limit Error (HTTP 429)
- Script automatically retries after 5-second wait
- If it happens frequently, increase delay: `--delay 0.5`

---

## Step 8: Run Preprocessing Pipeline

### Command
```bash
cd /Users/aayushsood/Developer/Multi-Modal
python3 ml/data/scripts/preprocess_pipeline.py
```

### What This Does
1. **Loads Data:**
   - Reads all 3 sample TSV files
   - Filters to only include multimodal samples (both text + image)

2. **Validates Images:**
   - Checks if image file exists on disk
   - Verifies image can be opened (not corrupted)
   - Filters out samples with missing/broken images

3. **Cleans Text:**
   - Removes special characters
   - Handles missing text
   - Truncates very long text

4. **Creates Splits:**
   - **Training set:** 80% of data (~7,000-8,000 samples)
   - **Validation set:** 10% (~900-1,000 samples)
   - **Test set:** 10% (~900-1,000 samples)
   - Uses stratified split (maintains Real/Fake ratio)

5. **Saves Processed Data:**
   - Saves as Parquet format (efficient, compressed)
   - Saves to `ml/data/processed/`

### Expected Output
```
========================================================================
🚀 Data Preprocessing Pipeline
========================================================================

[1/6] Loading Fakeddit data...
   Loading train samples...
   Loaded: 5000 samples
   Loading validation samples...
   Loaded: 5000 samples
   Loading test samples...
   Loaded: 5000 samples
   ✅ Total loaded: 15000 samples

[2/6] Filtering to multimodal samples...
   Samples with both text and image: 14532
   Samples with text only: 234
   Samples with image only: 234
   ✅ Filtered to: 14532 multimodal samples

[3/6] Validating image paths...
   Checking if images exist on disk...
   Processing: 100%|████████████████| 14532/14532 [00:05<00:00, 2905.12it/s]
   ✅ Valid images: 12876
   ❌ Missing images: 1656 (11.4%)

[4/6] Cleaning text data...
   Removing special characters...
   Handling missing values...
   ✅ Text cleaned

[5/6] Creating train/val/test splits...
   Using stratified split (80/10/10)
   
   Train set:   10300 samples (80.0%)
      Real:     5150 (50.0%)
      Fake:     5150 (50.0%)
   
   Val set:     1288 samples (10.0%)
      Real:      644 (50.0%)
      Fake:      644 (50.0%)
   
   Test set:    1288 samples (10.0%)
      Real:      644 (50.0%)
      Fake:      644 (50.0%)
   
   ✅ Splits created

[6/6] Saving processed data...
   Saving to: ml/data/processed/
   ✅ Saved train.parquet (10300 samples, 15.2 MB)
   ✅ Saved val.parquet (1288 samples, 1.9 MB)
   ✅ Saved test.parquet (1288 samples, 1.9 MB)

========================================================================
✅ Preprocessing Complete!
========================================================================

Summary:
   Original samples:     15000
   After filtering:      12876 (85.8%)
   
   Final dataset:
      Train: 10300 samples
      Val:   1288 samples
      Test:  1288 samples
      Total: 12876 samples

Saved to: ml/data/processed/
========================================================================
```

### Time Required
- ~2-5 minutes

### Files Created
```
ml/data/processed/
├── train.parquet    (10,300 samples, ~15MB)
├── val.parquet      (1,288 samples, ~2MB)
└── test.parquet     (1,288 samples, ~2MB)
```

### What's in the Parquet Files?
Each file contains columns:
- `id` - Unique identifier
- `title` - Article headline (cleaned)
- `body` - Article text (if available)
- `image_path` - Path to image file
- `label` - 0=Real, 1=Fake
- `source` - 'fakeddit'

### If This Fails

#### "No images found"
- Images didn't download in Step 7
- Go back and run `./download_images.sh`

#### "ModuleNotFoundError: No module named 'pandas'"
- Dependencies not installed
- Go back to Step 3

#### Too few samples (<8,000)
- Many images failed to download
- This is OK! As long as you have >7,000 samples, the model will train

---

## Step 9: Verify Data

### Command
```bash
python3 ml/data/scripts/verify_data.py
```

### What This Does
1. **Checks files exist:**
   - Verifies train.parquet, val.parquet, test.parquet exist
   
2. **Validates structure:**
   - Checks required columns present
   - Verifies data types are correct
   
3. **Checks labels:**
   - Ensures labels are 0 or 1
   - Verifies balanced distribution (50/50 Real/Fake)
   
4. **Validates images:**
   - Randomly samples 100 images
   - Verifies they can be opened
   - Checks image dimensions are reasonable

5. **Prints summary statistics**

### Expected Output
```
========================================================================
🔍 Data Verification Script
========================================================================

[1/5] Checking if processed files exist...
   ✅ train.parquet found (15.2 MB)
   ✅ val.parquet found (1.9 MB)
   ✅ test.parquet found (1.9 MB)

[2/5] Validating data structure...
   ✅ All required columns present:
      - id
      - title
      - body
      - image_path
      - label
      - source
   ✅ Data types are correct

[3/5] Checking labels...
   Train set:
      Label 0 (Real): 5150 (50.0%)
      Label 1 (Fake): 5150 (50.0%)
      ✅ Balanced distribution
   
   Val set:
      Label 0 (Real): 644 (50.0%)
      Label 1 (Fake): 644 (50.0%)
      ✅ Balanced distribution
   
   Test set:
      Label 0 (Real): 644 (50.0%)
      Label 1 (Fake): 644 (50.0%)
      ✅ Balanced distribution

[4/5] Validating image files...
   Sampling 100 random images...
   Checking: 100%|████████████████████| 100/100 [00:01<00:00, 78.23it/s]
   
   ✅ All sampled images are valid
   
   Image statistics:
      Min dimensions: 240x180
      Max dimensions: 1920x1080
      Avg dimensions: 800x600

[5/5] Summary statistics...
   
   Dataset Statistics:
   ==================
   Total samples:     12876
   Training samples:  10300 (80.0%)
   Validation samples: 1288 (10.0%)
   Test samples:       1288 (10.0%)
   
   Label distribution:
      Real: 6438 (50.0%)
      Fake: 6438 (50.0%)
   
   Text statistics:
      Avg title length: 72 characters
      Avg body length:  245 characters
   
   Image statistics:
      Total images: 12876
      Avg file size: 145 KB
      Total size: ~1.8 GB

========================================================================
✅ All Validation Checks Passed!
========================================================================

Your data is ready for model training (Phase 2)!

Next steps:
   1. Review the phase-2-model-training.md documentation
   2. Configure training parameters in ml/configs/config.yaml
   3. Start model training: python3 ml/train/train_model.py
========================================================================
```

### Time Required
- ~30 seconds

### If This Fails

#### "File not found: train.parquet"
- Preprocessing didn't complete
- Go back to Step 8

#### "Invalid image" errors
- Some images are corrupted
- If <10% are invalid, it's OK
- If >10% are invalid, re-run image download for that split

#### Unbalanced labels
- Preprocessing script has a bug
- Report this issue (shouldn't happen!)

---

## Phase 1 Complete! 🎉

### What You've Accomplished

✅ **Environment Setup**
- Virtual environment created and activated
- All Python dependencies installed

✅ **Data Collection**
- Downloaded Fakeddit metadata (git repo)
- Downloaded full TSV files (~500MB)
- Created balanced sample files (15K samples)
- Downloaded ~13,000 images (~9-15GB)

✅ **Data Preprocessing**
- Filtered to multimodal samples
- Validated all images
- Created train/val/test splits (80/10/10)
- Saved in efficient Parquet format

✅ **Quality Assurance**
- Verified data structure
- Confirmed balanced labels
- Validated images
- Checked statistics

### Final Dataset Summary

```
📊 Your Phase 1 Dataset
========================
Total:      12,876 samples
Train:      10,300 samples (80%)
Validation:  1,288 samples (10%)
Test:        1,288 samples (10%)

Label Balance:
   Real: 50%
   Fake: 50%

Storage:
   Images:     ~9-15 GB
   Parquet:    ~19 MB
   Total:      ~10-15 GB
```

### File Structure Created

```
Multi-Modal/
├── venv/                           (virtual environment)
├── ml/
│   ├── data/
│   │   ├── raw/
│   │   │   └── fakeddit/
│   │   │       └── Fakeddit/
│   │   │           ├── images/         (~13,000 images)
│   │   │           └── multimodal_only_samples/
│   │   │               ├── train_sample.tsv
│   │   │               ├── validate_sample.tsv
│   │   │               └── test_sample.tsv
│   │   └── processed/
│   │       ├── train.parquet         ✅ READY FOR TRAINING
│   │       ├── val.parquet           ✅ READY FOR TRAINING
│   │       └── test.parquet          ✅ READY FOR TRAINING
│   ├── configs/
│   │   └── config.yaml
│   └── data/scripts/
│       ├── download_fakeddit.py
│       ├── preprocess_pipeline.py
│       └── verify_data.py
└── docs/
    ├── RUN-1.md                      (this file)
    └── phase-2-model-training.md     (next phase)
```

---

## Quick Reference: All Commands in Order

Copy and paste this entire block to run Phase 1 from scratch:

```bash
# 1. Check prerequisites
cd /Users/aayushsood/Developer/Multi-Modal
python3 ml/check_environment.py

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install dependencies
python3 -m pip install -r ml/requirements.txt

# 4. Download Fakeddit metadata
python3 ml/data/scripts/download_fakeddit.py

# 5. Download TSV files (MANUAL STEP)
# Visit: https://drive.google.com/drive/folders/1jU7qgDqU1je9Y0PMKJ_f31yXRo5uWGFm
# Download and place files in: ml/data/raw/fakeddit/Fakeddit/multimodal_only_samples/

# 6. Create sample TSV files
python3 ml/data/scripts/download_fakeddit.py

# 7. Download images (60-120 minutes)
./download_images.sh

# 8. Run preprocessing pipeline
python3 ml/data/scripts/preprocess_pipeline.py

# 9. Verify data
python3 ml/data/scripts/verify_data.py

# ✅ Phase 1 Complete!
```

---

## Next Steps: Phase 2 - Model Training

Now that you have processed data, you're ready for Phase 2!

**Read:** `docs/phase-2-model-training.md`

**Quick preview of Phase 2:**
1. Configure training hyperparameters
2. Implement multi-modal fusion model (RoBERTa + ViT)
3. Train the model (~30-60 minutes on your sample data)
4. Evaluate performance
5. Save trained model

**To start Phase 2:**
```bash
# Review training configuration
cat ml/configs/config.yaml

# Start training (Phase 2)
python3 ml/train/train_model.py
```

---

## Troubleshooting Common Issues

### "No space left on device"
- Need at least 20GB free
- Delete old files or use external drive

### Images downloading very slowly
- Normal! Takes 60-120 minutes
- Can't speed up due to Reddit rate limits
- Just let it run in background

### Many images failed (success rate <70%)
- Internet connection issues
- Re-run download script (it will resume)
- Or acceptable if you have >8,000 final samples

### "ModuleNotFoundError"
- Make sure virtual environment is activated: `source venv/bin/activate`
- Re-install dependencies: `python3 -m pip install -r ml/requirements.txt`

### Preprocessing creates too few samples (<7,000)
- Many images failed to download
- Re-run download script to get more images
- Or proceed anyway - 7K samples is minimum for training

---

## Time and Storage Summary

| Step | Time | Storage | Notes |
|------|------|---------|-------|
| Environment setup | 10 min | 2 GB | One-time only |
| Download TSV files | 5 min | 500 MB | Manual from Google Drive |
| Download images | 60-120 min | 9-15 GB | Longest step |
| Preprocessing | 5 min | 20 MB | Fast |
| **TOTAL** | **~2-3 hours** | **~12-17 GB** | Mostly automated |

---

## Help and Documentation

- **This guide:** `docs/RUN-1.md`
- **Phase 1 details:** `docs/phase-1-data-pipeline.md`
- **Quick reference:** `docs/QUICK-REFERENCE-PHASE1.md`
- **Image download fix:** `docs/IMAGE-DOWNLOADER-FIXED.md`
- **Manual steps:** `docs/manual-steps-phase1.md`
- **Next phase:** `docs/phase-2-model-training.md`

---

**Last Updated:** 2026-03-24  
**Phase:** 1 of 6  
**Status:** ✅ Ready to Use
