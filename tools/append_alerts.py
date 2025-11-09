import json
import os
import time
from datetime import datetime, timezone

OUT = "data/alerts.jsonl"

def make_alert(top_srcs, pkts=1000, prob=0.95, label=1):
    now = datetime.now(timezone.utc).isoformat()
    return {
        "window_start": now,
        "window_end": now,
        "predicted_label": label,
        "probability": round(prob, 2),
        "pkts": pkts,
        "unique_srcs": len(top_srcs),
        "entropy_src": 0.1,
        "top_srcs": top_srcs,
        "detected_at": now
    }

def append_alert(alert):
    os.makedirs(os.path.dirname(OUT) or ".", exist_ok=True)
    with open(OUT, "a", encoding="utf-8") as f:
        f.write(json.dumps(alert) + "\n")
    print("WROTE:", json.dumps(alert))

if __name__ == "__main__":
    demo_alerts = [
        ({"8.8.8.8": 1200, "1.1.1.1": 300}, 1500, 0.98),
        ({"104.244.42.1": 700}, 700, 0.90),
        ({"208.21.2.184": 4000}, 4000, 0.99)
    ]

    for srcs, pkts, prob in demo_alerts:
        a = make_alert(top_srcs=srcs, pkts=pkts, prob=prob, label=1)
        append_alert(a)
        time.sleep(1.2) 
