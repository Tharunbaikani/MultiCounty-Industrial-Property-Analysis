import time
import os
from datetime import datetime

SCRIPT = "extract_real_county_data.py"
INTERVAL_HOURS = 24

while True:
    start = datetime.now()
    print(f"\n[Scheduled Extraction] Starting extraction at {start:%Y-%m-%d %H:%M:%S}")
    exit_code = os.system(f"python {SCRIPT}")
    end = datetime.now()
    print(f"[Scheduled Extraction] Finished extraction at {end:%Y-%m-%d %H:%M:%S} (Exit code: {exit_code})")
    print(f"[Scheduled Extraction] Sleeping for {INTERVAL_HOURS} hours...")
    time.sleep(INTERVAL_HOURS * 60 * 60) 