import csv
import os
import random
from datetime import datetime

OUT_DIR = "data"
OUT_FILE = os.path.join(OUT_DIR, "traffic_log.csv")

os.makedirs(OUT_DIR, exist_ok=True)

fields = ['timestamp', 'src_ip', 'dst_ip', 'protocol', 'length']

ips = ["192.168.1.2", "192.168.1.10", "10.0.0.5", "127.0.0.1"]
protocols = ["TCP", "UDP", "ICMP"] 

with open(OUT_FILE, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=fields)
    writer.writeheader()
    for _ in range(10):
        row = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "src_ip": random.choice(ips),
            "dst_ip": random.choice(ips),
            "protocol": random.choice(protocols),
            "length": random.randint(40, 1500)
        }
        writer.writerow(row)

print(f"Wrote 10 fake packets to {OUT_FILE}")