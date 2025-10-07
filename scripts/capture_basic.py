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

def pkt_to_row(pkt):
    row = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "src_ip": None,
        "dst_ip": None,
        "protocol": "OTHER",
        "length": len(pkt) if hasattr(pkt, "__len__") else 0
    }
    if IP in pkt:
        ip = pkt[IP]
        row["src_ip"] = ip.src
        row["dst_ip"] = ip.dst
        if TCP in pkt:  
            row["protocol"] = "TCP"
        elif UDP in pkt:
            row["protocol"] = "UDP"
        elif ICMP in pkt:
            row["protocol"] = "ICMP"
        else:
            row["protocol"] = "IP"
    return row

def write_row(row):
    with open(OUT_FILE, "a", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writerow(row)

def process_live(pkt):
    row = pkt_to_row(pkt)
    write_row(row)

def live_sniff(iface, count, filter_expr):
    print(f"[+] Starting live capture on iface='{iface}' filter='{filter_expr}' count={count}")
    print("    Press Ctrl-C to stop.")
    try:
        sniff(iface=iface, prn=process_live, store=False, count=count if count>0 else 0, filter=filter_expr)
    except PermissionError:
        print("Permission error: live sniffing usually requires sudo/root.")
        sys.exit(1)
    except Exception as e:
        print("Live sniff error:", e)
        sys.exit(1)

    