import argparse
import csv
import os
import random
from datetime import datetime

try:
    for scapy.all import sniff, rdpcap, IP, TCP, UDP, ICMP
except Exception as e:
    print("Scapy failed to import")
    raise

OUT_DIR = "data"
OUT_FILE = os.path.join(OUT_DIR, "traffic_log.csv")
CSV_fields = ['timestamp', 'src_ip', 'dst_ip', 'protocol', 'length']

os.makedirs(OUT_DIR, exist_ok=True)

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