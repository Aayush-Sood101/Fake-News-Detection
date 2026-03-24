"""
Quick setup script to run all Phase 1 steps.
"""

import subprocess
import sys
from pathlib import Path


def run_command(cmd, description):
    """Run a command and print status."""
    print(f"\n{'=' * 60}")
    print(f"▶️  {description}")
    print(f"{'=' * 60}")
    result = subprocess.run(cmd, shell=True)
    if result.returncode != 0:
        print(f"❌ Failed: {description}")
        return False
    return True


def main():
    """Run the complete Phase 1 setup."""
    print("\n" + "=" * 60)
    print("🚀 PHASE 1: DATA PIPELINE SETUP")
    print("=" * 60)
    
    # Check if we're in the right directory
    if not Path("ml").exists():
        print("\n❌ Error: ml/ directory not found")
        print("   Please run this script from the project root directory")
        sys.exit(1)
    
    # Step 1: Install Python dependencies
    if not run_command(
        "pip install -r ml/requirements.txt",
        "Installing Python dependencies"
    ):
        print("\n⚠️ Warning: Some dependencies may have failed to install")
        print("   You can continue, but you may encounter issues later")
    
    # Step 2: Download Fakeddit metadata and create samples
    if not run_command(
        "python ml/data/scripts/download_fakeddit.py",
        "Downloading Fakeddit metadata"
    ):
        print("\n❌ Failed to download Fakeddit. Cannot continue.")
        sys.exit(1)
    
    # Step 3: Download NewsCLIPpings metadata (optional)
    print("\n" + "=" * 60)
    print("▶️  Downloading NewsCLIPpings metadata (optional)")
    print("=" * 60)
    result = subprocess.run("python ml/data/scripts/download_newsclippings.py", shell=True)
    if result.returncode != 0:
        print("⚠️ NewsCLIPpings download failed - this is optional, continuing...")
    
    # Print next steps
    print("\n" + "=" * 60)
    print("✅ PHASE 1 AUTOMATED SETUP COMPLETE!")
    print("=" * 60)
    print("\n📋 NEXT STEPS (Manual):")
    print("\n1. Download Fakeddit images:")
    print("   See instructions printed above by download_fakeddit.py")
    print("   Or check docs/manual-steps-phase1.md")
    print()
    print("2. (Optional) Download NewsCLIPpings/VisualNews images:")
    print("   See instructions printed above by download_newsclippings.py")
    print()
    print("3. After images are downloaded, run preprocessing:")
    print("   python ml/data/scripts/preprocess_pipeline.py")
    print()
    print("4. Verify the processed data:")
    print("   python ml/data/scripts/verify_data.py")
    print()
    print("For detailed instructions, see: docs/manual-steps-phase1.md")
    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
