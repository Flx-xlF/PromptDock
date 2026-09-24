#!/usr/bin/env python3
"""
Release Packager for Universal AI Prompter
Creates a clean, store-compliant ZIP archive ready for Chrome Web Store, Firefox AMO, and Edge Add-ons.
"""

import os
import sys
import json
import zipfile
import subprocess
import hashlib

def main():
    print("🚀 [Universal AI Prompter] Starting Pre-Release Build & Package...")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    # 1. Validate manifest.json
    manifest_path = "manifest.json"
    if not os.path.exists(manifest_path):
        print("❌ Error: manifest.json not found!")
        sys.exit(1)

    with open(manifest_path, "r", encoding="utf-8") as f:
        try:
            manifest = json.load(f)
        except Exception as e:
            print(f"❌ Error parsing manifest.json: {e}")
            sys.exit(1)

    version = manifest.get("version", "1.0.0")
    print(f"📦 Manifest version: {version}")

    # 2. Syntax validation
    js_files = ["background.js", "content.js", "popup.js", "shared/browser-compat.js"]
    for js in js_files:
        if not os.path.exists(js):
            print(f"❌ Error: Required file {js} is missing!")
            sys.exit(1)
        res = subprocess.run(["node", "-c", js], capture_output=True, text=True)
        if res.returncode != 0:
            print(f"❌ Syntax error in {js}:\n{res.stderr}")
            sys.exit(1)
    print("✅ All JavaScript files passed syntax verification.")

    # 3. Required file collection
    # Strict whitelist of files to include in production release
    release_files = [
        "manifest.json",
        "background.js",
        "content.js",
        "content.css",
        "popup.html",
        "popup.js",
        "popup.css",
        "shared/browser-compat.js",
        "icons/icon-16.png",
        "icons/icon-32.png",
        "icons/icon-48.png",
        "icons/icon-128.png",
        "icons/icon.svg"
    ]

    for rf in release_files:
        if not os.path.exists(rf):
            print(f"❌ Error: Missing release artifact {rf}!")
            sys.exit(1)

    # 4. Prepare release directory
    release_dir = "release"
    os.makedirs(release_dir, exist_ok=True)
    zip_filename = os.path.join(release_dir, f"universal-ai-prompter-v{version}.zip")

    if os.path.exists(zip_filename):
        os.remove(zip_filename)

    # 5. Build ZIP
    with zipfile.ZipFile(zip_filename, "w", zipfile.ZIP_DEFLATED) as zipf:
        for rf in release_files:
            zipf.write(rf, arcname=rf)
            print(f"   + Added: {rf}")

    # 6. Verify ZIP structure
    print(f"\n🔍 Verifying generated archive: {zip_filename}")
    with zipfile.ZipFile(zip_filename, "r") as zipf:
        names = zipf.namelist()
        if "manifest.json" not in names:
            print("❌ Root manifest.json missing inside zip archive!")
            sys.exit(1)
        
        forbidden = [n for n in names if n.startswith(".env") or n.startswith(".git") or "DS_Store" in n]
        if forbidden:
            print(f"❌ Forbidden files detected in zip: {forbidden}")
            sys.exit(1)

    # 7. Calculate file size & SHA256
    file_size = os.path.getsize(zip_filename)
    with open(zip_filename, "rb") as f:
        sha256 = hashlib.sha256(f.read()).hexdigest()

    print("\n🎉 Pre-Release Build Succeeded!")
    print(f"   Archive: {zip_filename}")
    print(f"   Size:    {file_size:,} bytes")
    print(f"   SHA-256: {sha256}")

if __name__ == "__main__":
    main()
