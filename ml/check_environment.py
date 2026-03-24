#!/usr/bin/env python3
"""
Environment check script for Phase 1.
Run this to verify your environment is set up correctly.
"""

import sys
import subprocess
from pathlib import Path


def check_python_version():
    """Check Python version."""
    print("\n🐍 Checking Python version...")
    version = sys.version_info
    print(f"   Python {version.major}.{version.minor}.{version.micro}")
    
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("   ❌ Python 3.8+ required")
        return False
    print("   ✅ Python version OK")
    return True


def check_dependencies():
    """Check if key dependencies are installed."""
    print("\n📦 Checking dependencies...")
    
    required_packages = [
        'pandas',
        'numpy',
        'sklearn',
        'tqdm',
        'pyarrow',
    ]
    
    all_installed = True
    for package in required_packages:
        try:
            __import__(package)
            print(f"   ✅ {package}")
        except ImportError:
            print(f"   ❌ {package} not installed")
            all_installed = False
    
    if not all_installed:
        print("\n   To install missing packages:")
        print("   python3 -m pip install -r ml/requirements.txt")
    
    return all_installed


def check_directory_structure():
    """Check if directory structure exists."""
    print("\n📁 Checking directory structure...")
    
    required_dirs = [
        'ml',
        'ml/data',
        'ml/data/scripts',
        'ml/data/scripts/loaders',
        'ml/configs',
        'ml/checkpoints',
    ]
    
    all_exist = True
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            print(f"   ✅ {dir_path}/")
        else:
            print(f"   ❌ {dir_path}/ missing")
            all_exist = False
    
    return all_exist


def check_scripts():
    """Check if Phase 1 scripts exist."""
    print("\n📝 Checking Phase 1 scripts...")
    
    required_files = [
        'ml/requirements.txt',
        'ml/configs/config.yaml',
        'ml/data/scripts/download_fakeddit.py',
        'ml/data/scripts/download_newsclippings.py',
        'ml/data/scripts/preprocess_pipeline.py',
        'ml/data/scripts/verify_data.py',
    ]
    
    all_exist = True
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"   ✅ {file_path}")
        else:
            print(f"   ❌ {file_path} missing")
            all_exist = False
    
    return all_exist


def check_git():
    """Check if git is installed."""
    print("\n🔧 Checking git installation...")
    try:
        result = subprocess.run(
            ['git', '--version'],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"   ✅ {result.stdout.strip()}")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("   ❌ git not found")
        print("   Install from: https://git-scm.com/downloads")
        return False


def check_disk_space():
    """Check available disk space."""
    print("\n💾 Checking disk space...")
    try:
        import shutil
        total, used, free = shutil.disk_usage('.')
        free_gb = free // (2**30)
        print(f"   Free space: {free_gb} GB")
        
        if free_gb < 20:
            print("   ⚠️ Warning: Less than 20GB free")
            print("   Recommended: 20GB+ for image downloads")
            return False
        print("   ✅ Sufficient disk space")
        return True
    except Exception as e:
        print(f"   ⚠️ Could not check disk space: {e}")
        return True  # Don't fail on this


def main():
    """Run all environment checks."""
    print("=" * 60)
    print("🔍 PHASE 1 ENVIRONMENT CHECK")
    print("=" * 60)
    
    checks = [
        ("Python Version", check_python_version()),
        ("Dependencies", check_dependencies()),
        ("Directory Structure", check_directory_structure()),
        ("Phase 1 Scripts", check_scripts()),
        ("Git Installation", check_git()),
        ("Disk Space", check_disk_space()),
    ]
    
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    
    for check_name, passed in checks:
        status = "✅" if passed else "❌"
        print(f"{status} {check_name}")
    
    all_passed = all(passed for _, passed in checks)
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ENVIRONMENT READY!")
        print("=" * 60)
        print("\n🚀 Next steps:")
        print("1. Run: python3 ml/data/scripts/download_fakeddit.py")
        print("2. Download images (follow printed instructions)")
        print("3. Run: python3 ml/data/scripts/preprocess_pipeline.py")
        print("4. Run: python3 ml/data/scripts/verify_data.py")
        print("\nSee docs/PHASE1-IMPLEMENTATION-SUMMARY.md for details")
    else:
        print("⚠️ SOME CHECKS FAILED")
        print("=" * 60)
        print("\nPlease fix the issues above before proceeding.")
        print("See docs/manual-steps-phase1.md for troubleshooting.")
    
    print()
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
