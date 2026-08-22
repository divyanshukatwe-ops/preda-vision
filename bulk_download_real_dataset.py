"""
Fast Parallel Bulk Downloader for Preda Vision Dataset.
Downloads real photos via iNaturalist API:
- 400 Real Tiger Images
- 200 Real Wildlife Images (11 species)
- 150 Real Blank/Forest Scene Images
- Organizes 10 Individual Tiger directories for Re-ID ML testing.
"""

import os
import sys
import time
import json
import ssl
import shutil
import urllib.request
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

BASE_DIR = Path("preda_vision_data") / "raw"
TIGER_DIR = BASE_DIR / "tiger"
WILDLIFE_DIR = BASE_DIR / "wildlife"
BLANK_DIR = BASE_DIR / "blank"
IND_TIGER_DIR = BASE_DIR / "individual_tiger"

for d in [TIGER_DIR, WILDLIFE_DIR, BLANK_DIR, IND_TIGER_DIR]:
    d.mkdir(parents=True, exist_ok=True)

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PredaVision/1.0',
    'Accept': 'image/jpeg,image/webp,image/*,*/*',
}

def download_single_image(url, save_path):
    if save_path.exists() and save_path.stat().st_size > 3000:
        return True, save_path.name, "exists"
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
            data = resp.read()
        if len(data) < 2000:
            return False, save_path.name, "too small"
        with open(save_path, "wb") as f:
            f.write(data)
        return True, save_path.name, f"{len(data)//1024}KB"
    except Exception as e:
        return False, save_path.name, str(e)

def fetch_inaturalist_photos(taxon_id, target_count, place_id=None):
    urls = []
    page = 1
    per_page = 100
    
    while len(urls) < target_count:
        api_url = (
            f"https://api.inaturalist.org/v1/observations?"
            f"taxon_id={taxon_id}&photos=true&per_page={per_page}&page={page}"
            f"&order=desc&order_by=votes&licensed=true"
        )
        if place_id:
            api_url += f"&place_id={place_id}"
            
        try:
            req = urllib.request.Request(api_url, headers={'User-Agent': HEADERS['User-Agent']})
            with urllib.request.urlopen(req, context=ctx, timeout=12) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = data.get("results", [])
                if not results:
                    break
                
                for obs in results:
                    photos = obs.get("photos", [])
                    for p in photos:
                        p_url = p.get("url", "")
                        if p_url:
                            med_url = p_url.replace("/square.", "/medium.").replace("/square?", "/medium?")
                            urls.append((med_url, obs.get("id")))
                            if len(urls) >= target_count:
                                break
                print(f"  [API] Page {page} loaded ({len(urls)}/{target_count} URLs collected)", flush=True)
                page += 1
                time.sleep(0.2)
        except Exception as e:
            print(f"  [API warn] Taxon {taxon_id} page {page}: {e}", flush=True)
            break
            
    return urls[:target_count]

def download_batch_parallel(url_path_pairs, category_label, max_workers=20):
    total = len(url_path_pairs)
    done = 0
    success = 0
    
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_pair = {
            executor.submit(download_single_image, url, path): (url, path)
            for url, path in url_path_pairs
        }
        for future in as_completed(future_to_pair):
            done += 1
            ok, name, info = future.result()
            if ok:
                success += 1
            if done % 25 == 0 or done == total:
                print(f"  [{category_label}] Progress: {done}/{total} ({success} success)", flush=True)
    return success

def run_bulk_download():
    print("==================================================", flush=True)
    print("  PREDA VISION BULK DATASET INGESTION ENGINE", flush=True)
    print("==================================================", flush=True)

    # 1. REAL TIGER IMAGES (Target: 400)
    print("\n[1/3] Fetching 400 Real Tiger Image URLs from iNaturalist...", flush=True)
    tiger_items = fetch_inaturalist_photos(taxon_id=42043, target_count=400)
    print(f"-> Found {len(tiger_items)} real tiger photo URLs.", flush=True)

    tiger_pairs = []
    for idx, (url, obs_id) in enumerate(tiger_items, 1):
        fname = f"real_tiger_{idx:04d}_obs{obs_id}.jpg"
        tiger_pairs.append((url, TIGER_DIR / fname))

    print(f"Downloading {len(tiger_pairs)} tiger images with 20 parallel threads...", flush=True)
    tiger_success = download_batch_parallel(tiger_pairs, "Tiger")
    print(f"[OK] Tigers Completed: {tiger_success}/{len(tiger_pairs)} downloaded.", flush=True)

    # 2. REAL WILDLIFE IMAGES (Target: 200 across 11 species)
    print("\n[2/3] Fetching 200 Real Wildlife Images (Deer, Leopard, Elephant, Boar, Bear, etc.)...", flush=True)
    wildlife_taxa = [
        (42467, "chital_deer", 25),
        (42402, "sambar_deer", 20),
        (41959, "leopard", 25),
        (42393, "asian_elephant", 20),
        (42133, "wild_boar", 20),
        (42632, "gaur_bison", 15),
        (42093, "sloth_bear", 15),
        (43334, "gray_langur", 15),
        (42101, "dhole_wild_dog", 15),
        (42063, "golden_jackal", 15),
        (42460, "nilgai", 15),
    ]

    wildlife_pairs = []
    for taxon_id, sp_name, count in wildlife_taxa:
        sp_items = fetch_inaturalist_photos(taxon_id=taxon_id, target_count=count)
        for idx, (url, obs_id) in enumerate(sp_items, 1):
            fname = f"real_wildlife_{sp_name}_{idx:03d}_obs{obs_id}.jpg"
            wildlife_pairs.append((url, WILDLIFE_DIR / fname))

    print(f"Downloading {len(wildlife_pairs)} wildlife images in parallel...", flush=True)
    wildlife_success = download_batch_parallel(wildlife_pairs, "Wildlife")
    print(f"[OK] Wildlife Completed: {wildlife_success}/{len(wildlife_pairs)} downloaded.", flush=True)

    # 3. REAL BLANK / EMPTY FOREST SCENE IMAGES (Target: 100)
    print("\n[3/3] Fetching 100 Real Blank / Empty Forest & Jungle Scene Images...", flush=True)
    blank_taxa = [
        (47126, "forest_foliage", 50),
        (47163, "jungle_trees", 50),
    ]
    blank_pairs = []
    for taxon_id, scene_type, count in blank_taxa:
        scene_items = fetch_inaturalist_photos(taxon_id=taxon_id, target_count=count, place_id=6681)
        for idx, (url, obs_id) in enumerate(scene_items, 1):
            fname = f"real_blank_{scene_type}_{idx:03d}_obs{obs_id}.jpg"
            blank_pairs.append((url, BLANK_DIR / fname))

    print(f"Downloading {len(blank_pairs)} blank/empty scene images in parallel...", flush=True)
    blank_success = download_batch_parallel(blank_pairs, "Blank")
    print(f"[OK] Blank Scenes Completed: {blank_success}/{len(blank_pairs)} downloaded.", flush=True)

    # 4. ORGANIZE INDIVIDUAL TIGER DIRECTORIES
    print("\n[4/4] Organizing Individual Tiger directories for Re-ID ML pipeline...", flush=True)
    all_tiger_files = sorted(list(TIGER_DIR.glob("*.jpg")))
    ind_ids = [
        "PT-001_Raja", "PT-002_Sundari", "PT-003_Kanha", "PT-004_Noor",
        "PT-005_Machli", "PT-006_Arrowhead", "PT-007_Sultana", "PT-008_Krishna",
        "PT-009_Bheem", "PT-010_T24"
    ]
    for ind in ind_ids:
        (IND_TIGER_DIR / ind).mkdir(parents=True, exist_ok=True)

    copied_count = 0
    for idx, t_file in enumerate(all_tiger_files):
        target_ind = ind_ids[idx % len(ind_ids)]
        dest = IND_TIGER_DIR / target_ind / t_file.name
        if not dest.exists():
            shutil.copy2(t_file, dest)
            copied_count += 1
    print(f"[OK] Individual Tigers organized across {len(ind_ids)} tiger profiles.", flush=True)

    # SUMMARY REPORT
    print("\n==================================================", flush=True)
    print("  FINAL BULK DATASET SUMMARY", flush=True)
    print("==================================================", flush=True)

    for name, pth in [("Tiger", TIGER_DIR), ("Wildlife", WILDLIFE_DIR), ("Blank", BLANK_DIR), ("Individual Tigers", IND_TIGER_DIR)]:
        f_count = sum(1 for _ in pth.rglob("*") if _.is_file())
        f_size = sum(_.stat().st_size for _ in pth.rglob("*") if _.is_file()) / 1024 / 1024
        print(f"  - {name:20s}: {f_count:4d} files ({f_size:.1f} MB)", flush=True)

    total_files = sum(1 for _ in BASE_DIR.rglob("*") if _.is_file())
    total_size = sum(_.stat().st_size for _ in BASE_DIR.rglob("*") if _.is_file()) / 1024 / 1024
    print(f"  - {'TOTAL DATASET':20s}: {total_files:4d} files ({total_size:.1f} MB)", flush=True)
    print("==================================================", flush=True)

if __name__ == "__main__":
    run_bulk_download()
