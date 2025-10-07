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
CSV_FIELDS = ['timestamp', 'src_ip', 'dst_ip', 'protocol', 'length']

def ensure_outfile():
    os.makedirs(OUT_DIR, exist_ok=True)
    if not os.path.exists(OUT_FILE):
        with open(OUT_FILE, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
            writer.writeheader()
