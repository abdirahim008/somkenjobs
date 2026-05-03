#!/usr/bin/env python3
"""
SomKen Job Pipeline
====================
Automated pipeline: Scrape → Enrich → Upload

This is the main entry point. GitHub Actions runs this on a schedule.

Usage:
  python pipeline.py              # Full pipeline: scrape + enrich + upload
  python pipeline.py --dry-run    # Scrape + enrich, but don't upload
  python pipeline.py --scrape-only  # Just scrape, save to file
  python pipeline.py --daemon     # Run as daemon with built-in scheduler
"""

import argparse
import hashlib
import json
import os
import sys
import time
from datetime import datetime, timezone
from dotenv import load_dotenv

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from scraper import scrape_somalijobs, SeenTracker
from enrichment import enrich_description, enrich_body_html

try:
    import requests
except ImportError:
    os.system(f"{sys.executable} -m pip install requests --break-system-packages -q")
    import requests
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Load local development variables when running from any working directory.
# GitHub Actions and production should provide secrets through environment variables.
local_env_path = os.path.join(SCRIPT_DIR, '.env.local')
if os.path.exists(local_env_path):
    load_dotenv(local_env_path)

# ==========================================
# CONFIG (from environment variables)
# ==========================================

# Your SomKen app URL - set in GitHub Actions secrets for scheduled runs.
SOMKEN_URL = os.environ.get('SOMKEN_URL', '')
SOMKEN_TOKEN = os.environ.get('SOMKEN_TOKEN', '')
SOMKEN_EMAIL = os.environ.get('SOMKEN_EMAIL', '')
SOMKEN_PASSWORD = os.environ.get('SOMKEN_PASSWORD', '')
BULK_ENDPOINT = '/api/jobs/bulk-upload'
LOGIN_ENDPOINT = '/api/auth/login'

# Data directory for local run backups and seen-job tracking.
DATA_DIR = os.environ.get('DATA_DIR', os.path.join(SCRIPT_DIR, 'data'))

# Schedule interval (hours) for daemon mode
SCHEDULE_HOURS = int(os.environ.get('SCHEDULE_HOURS', '12'))


def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def get_auth_token():
    """Get a valid JWT token — auto-login if credentials are set, else use static token"""
    if SOMKEN_EMAIL and SOMKEN_PASSWORD and SOMKEN_URL:
        print("  🔑 Logging in to get fresh JWT token...")
        try:
            resp = requests.post(
                f"{SOMKEN_URL.rstrip('/')}{LOGIN_ENDPOINT}",
                json={'email': SOMKEN_EMAIL, 'password': SOMKEN_PASSWORD},
                timeout=15
            )
            if resp.status_code == 200:
                data = resp.json()
                token = data.get('token') or data.get('accessToken') or data.get('jwt')
                if token:
                    print("  ✅ Login successful — got fresh token")
                    return token
                else:
                    print(f"  ⚠ Login response missing token field. Keys: {list(data.keys())}")
            else:
                print(f"  ⚠ Login failed: HTTP {resp.status_code} — {resp.text[:200]}")
        except requests.RequestException as e:
            print(f"  ⚠ Login request failed: {e}")

    if SOMKEN_TOKEN:
        print("  🔑 Using static SOMKEN_TOKEN")
        return SOMKEN_TOKEN

    return None


def stable_external_id(job):
    """Generate a deterministic ID so scheduled uploads cannot create duplicates."""
    source = (job.get('source') or 'somalijobs').strip().lower()
    raw = job.get('url') or '|'.join([
        job.get('title', ''),
        job.get('organization', ''),
        job.get('location', ''),
    ])
    digest = hashlib.sha256(raw.encode('utf-8')).hexdigest()[:32]
    return f"{source}-{digest}"


# ==========================================
# STEP 1: SCRAPE
# ==========================================

def step_scrape(refresh_existing=False, limit=None):
    """Scrape new jobs from SomaliJobs.com"""
    print("=" * 60)
    print(f"🕐 {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} — Starting scrape")
    print("=" * 60)

    ensure_data_dir()
    tracker = SeenTracker(os.path.join(DATA_DIR, 'seen_jobs.json'))
    jobs = scrape_somalijobs(
        seen_tracker=tracker,
        include_seen=refresh_existing,
        limit=limit,
    )

    if not jobs:
        print("📭 No new jobs found")

    return jobs


# ==========================================
# STEP 2: ENRICH
# ==========================================

def step_enrich(jobs):
    """Apply SEO enrichment to each job"""
    if not jobs:
        return []

    print(f"\n🔤 Enriching {len(jobs)} jobs with unique content...")

    enriched = []
    for job in jobs:
        # Store original description before enrichment
        job['original_description'] = job.get('description', '')
        job['original_bodyHtml'] = job.get('bodyHtml', '')

        # Apply enrichment
        job['bodyHtml'] = enrich_body_html(job)
        job['description'] = enrich_description(job)

        enriched.append(job)

    # Quality check
    with_desc = sum(1 for j in enriched if len(j.get('description', '')) > 200)
    with_org = sum(1 for j in enriched if j.get('organization'))
    with_deadline = sum(1 for j in enriched if j.get('deadline'))

    print(f"  📝 {with_desc}/{len(enriched)} with rich description")
    print(f"  🏢 {with_org}/{len(enriched)} with organization")
    print(f"  ⏰ {with_deadline}/{len(enriched)} with deadline")

    return enriched


# ==========================================
# STEP 3: UPLOAD
# ==========================================

def step_upload(jobs, dry_run=False):
    """Upload enriched jobs to SomKen via JSON bulk upload"""
    if not jobs:
        return

    if not SOMKEN_URL:
        print("\n⚠ SOMKEN_URL not set — skipping upload")
        print("  Set it in Railway: SOMKEN_URL=https://somkenjobs.com")
        save_to_file(jobs)
        return

    token = get_auth_token()
    if not token:
        print("\n⚠ No auth token available — skipping upload")
        print("  Set SOMKEN_EMAIL + SOMKEN_PASSWORD for auto-login")
        save_to_file(jobs)
        return

    url = f"{SOMKEN_URL.rstrip('/')}{BULK_ENDPOINT}"

    # Prepare JSON payload
    valid_jobs = []
    for job in jobs:
        row = {
            'title': job.get('title', ''),
            'organization': job.get('organization', ''),
            'location': job.get('location', ''),
            'country': job.get('country', 'Somalia'),
            'description': job.get('description', ''),
            'bodyHtml': job.get('bodyHtml') or None,
            'url': job.get('url', ''),
            'deadline': job.get('deadline') if '202' in str(job.get('deadline')) else None,
            'datePosted': datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z'),
            'sector': job.get('sector') or None,
            'source': job.get('source', 'somalijobs'),
            'externalId': job.get('externalId') or stable_external_id(job),
            'type': 'tender' if 'tender' in (job.get('type') or '').lower() else 'job',
            'status': 'published',
            'howToApply': job.get('howToApply') or None,
            'experience': job.get('experience') or None,
            'qualifications': job.get('qualifications') or None,
            'responsibilities': job.get('responsibilities') or None,
        }

        # Validate required fields
        required = ['title', 'organization', 'location', 'country', 'description']
        missing = [f for f in required if not row.get(f)]
        if missing:
            print(f"  ⏭ Skipping \"{row['title'][:40]}\" — missing: {', '.join(missing)}")
            continue

        # Remove None values
        row = {k: v for k, v in row.items() if v is not None}
        valid_jobs.append(row)

    if not valid_jobs:
        print("  ❌ No valid jobs to upload after validation")
        return

    if dry_run:
        print(f"\n🔍 DRY RUN — Would upload {len(valid_jobs)} jobs to {url}")
        for j in valid_jobs[:3]:
            print(f"  📋 {j['title'][:50]}")
            print(f"     org: {j['organization']}, loc: {j['location']}, deadline: {j.get('deadline', 'N/A')}")
        if len(valid_jobs) > 3:
            print(f"  ... and {len(valid_jobs) - 3} more")
        save_to_file(jobs)
        return

    # Upload as JSON
    print(f"\n📤 Uploading {len(valid_jobs)} jobs to {url}...")

    try:
        resp = requests.post(
            url,
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json',
            },
            json=valid_jobs,
            timeout=60
        )
        data = resp.json()

        if resp.status_code in (200, 201):
            success = data.get('successCount', data.get('success', 0))
            created = data.get('createdCount')
            updated = data.get('updatedCount')
            failed = data.get('failureCount', data.get('failed', 0))
            total = data.get('totalProcessed', data.get('total', len(valid_jobs)))
            print(f"\n{'='*50}")
            print(f"📊 Upload Summary")
            print(f"   ✅ Success: {success}")
            if created is not None or updated is not None:
                print(f"   ➕ Created: {created or 0}")
                print(f"   🔄 Updated: {updated or 0}")
            print(f"   ❌ Failed:  {failed}")
            print(f"   📋 Total:   {total}")

            if data.get('errors'):
                print(f"\n   Errors:")
                for err in data['errors'][:5]:
                    print(f"   ⚠ {err}")
        else:
            print(f"  ❌ HTTP {resp.status_code} — {data.get('message', resp.text[:300])}")
            save_to_file(jobs)

    except requests.RequestException as e:
        print(f"  ❌ Upload failed: {e}")
        save_to_file(jobs)


def save_to_file(jobs):
    """Save enriched jobs to a local JSON file as backup"""
    ensure_data_dir()
    timestamp = datetime.now().strftime('%Y-%m-%d_%H%M')
    filepath = os.path.join(DATA_DIR, f'jobs_{timestamp}.json')
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump({'scraped_at': datetime.now().isoformat(), 'total': len(jobs), 'jobs': jobs}, f, indent=2, ensure_ascii=False)
    print(f"  💾 Saved to {filepath}")


def backup_existing_somalijobs():
    """Back up current live SomaliJobs rows through the admin API before repair runs."""
    if not SOMKEN_URL:
        print("\n⚠ SOMKEN_URL not set — skipping backup")
        return None

    token = get_auth_token()
    if not token:
        print("\n⚠ No auth token available — skipping backup")
        return None

    ensure_data_dir()
    url = f"{SOMKEN_URL.rstrip('/')}/api/admin/jobs"
    print("\n💾 Backing up existing SomaliJobs rows before repair...")
    try:
        resp = requests.get(
            url,
            headers={'Authorization': f'Bearer {token}'},
            timeout=30,
        )
        if resp.status_code != 200:
            print(f"  ⚠ Backup failed: HTTP {resp.status_code}")
            return None

        all_jobs = resp.json()
        somalijobs = [
            job for job in all_jobs
            if str(job.get('source', '')).lower() == 'somalijobs'
        ]
        timestamp = datetime.now().strftime('%Y-%m-%d_%H%M%S')
        filepath = os.path.join(DATA_DIR, f'somalijobs_backup_{timestamp}.json')
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(
                {'backed_up_at': datetime.now().isoformat(), 'total': len(somalijobs), 'jobs': somalijobs},
                f,
                indent=2,
                ensure_ascii=False,
            )
        print(f"  ✅ Backed up {len(somalijobs)} SomaliJobs rows to {filepath}")
        return filepath
    except requests.RequestException as e:
        print(f"  ⚠ Backup request failed: {e}")
        return None


# ==========================================
# DAEMON MODE (built-in scheduler)
# ==========================================

def run_daemon():
    """Run as a long-lived process with built-in scheduling"""
    print(f"🤖 Starting SomKen Job Pipeline daemon")
    print(f"   Schedule: every {SCHEDULE_HOURS} hours")
    print(f"   API: {SOMKEN_URL or '(not set)'}")
    print(f"   Auth: {'auto-login' if SOMKEN_EMAIL else 'static token' if SOMKEN_TOKEN else '⚠ not configured'}")
    print(f"   Data: {DATA_DIR}")
    print()

    while True:
        try:
            run_pipeline(dry_run=False)
        except Exception as e:
            print(f"\n❌ Pipeline error: {e}")
            import traceback
            traceback.print_exc()

        next_run = datetime.now().strftime('%H:%M') + f" + {SCHEDULE_HOURS}h"
        print(f"\n💤 Sleeping {SCHEDULE_HOURS} hours... (next run after {next_run})")
        time.sleep(SCHEDULE_HOURS * 3600)


# ==========================================
# MAIN PIPELINE
# ==========================================

def run_pipeline(dry_run=False, scrape_only=False, refresh_existing=False, backup_existing=False, limit=None):
    """Run the full pipeline: Scrape → Enrich → Upload"""
    start = time.time()

    if backup_existing and not dry_run and not scrape_only:
        backup_path = backup_existing_somalijobs()
        if not backup_path:
            print("\n❌ Repair run stopped because the backup did not complete.")
            return

    # Step 1: Scrape
    jobs = step_scrape(refresh_existing=refresh_existing, limit=limit)

    if not jobs:
        print(f"\n⏱ Completed in {time.time()-start:.1f}s — nothing to do")
        return

    # Step 2: Enrich
    enriched = step_enrich(jobs)

    # Step 3: Upload (or save)
    if scrape_only:
        save_to_file(enriched)
    else:
        step_upload(enriched, dry_run=dry_run)

    elapsed = time.time() - start
    print(f"\n⏱ Pipeline completed in {elapsed:.1f}s")


# ==========================================
# CLI
# ==========================================

def main():
    parser = argparse.ArgumentParser(
        description='🚀 SomKen Job Pipeline — Scrape → Enrich → Upload',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=f"""
Environment variables:
  SOMKEN_URL        Your app URL (e.g., https://somkenjobs.com)
  SOMKEN_EMAIL      Login email for auto-login (recommended)
  SOMKEN_PASSWORD   Login password for auto-login (recommended)
  SOMKEN_TOKEN      Static JWT token (alternative to email/password)
  DATA_DIR          Data storage path (default: {DATA_DIR})
  SCHEDULE_HOURS    Hours between runs in daemon mode (default: 12)

Examples:
  python pipeline.py                 # Full pipeline
  python pipeline.py --dry-run       # Scrape + enrich, preview upload
  python pipeline.py --scrape-only   # Just scrape and save to file
  python pipeline.py --daemon        # Run forever with built-in scheduler
        """
    )

    parser.add_argument('--dry-run', action='store_true',
                        help='Scrape and enrich but don\'t upload')
    parser.add_argument('--scrape-only', action='store_true',
                        help='Just scrape and save to file')
    parser.add_argument('--daemon', action='store_true',
                        help='Run as long-lived daemon with scheduling')
    parser.add_argument('--refresh-existing', action='store_true',
                        help='Scrape current SomaliJobs URLs even if they were seen before; use for formatting repair')
    parser.add_argument('--backup-existing', action='store_true',
                        help='Back up existing SomaliJobs rows from the live admin API before uploading repair data')
    parser.add_argument('--limit', type=int, default=None,
                        help='Maximum number of job pages to scrape for this run')

    args = parser.parse_args()

    if args.daemon:
        run_daemon()
    else:
        run_pipeline(
            dry_run=args.dry_run,
            scrape_only=args.scrape_only,
            refresh_existing=args.refresh_existing,
            backup_existing=args.backup_existing,
            limit=args.limit,
        )


if __name__ == '__main__':
    main()
