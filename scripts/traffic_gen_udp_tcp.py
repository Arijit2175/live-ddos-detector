import argparse
import socket
import threading
import time
import sys
from collections import Counter

DEFAULT_THREADS = 2
DEFAULT_PKTS = 200
DEFAULT_PAYLOAD = 64
DEFAULT_DELAY = 0.02
DEFAULT_MAX_PACKETS = 1000

LOCAL_ALLOWED = {"127.0.0.1", "localhost", "::1"}

def is_localhost(addr):
    try:
        return addr in LOCAL_ALLOWED or addr.startswith("127.") or addr.startswith("::1")
    except Exception:
        return False
    
def udp_worker(target, port, pkts, payload, delay, dry_run, stats, tid):
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sent = 0
    for i in range(pkts):
        if dry_run:
            pass
        else:
            try:
                s.sendto(payload, (target, port))
            except Exception:
                pass
        sent += 1
        stats["sent"] += 1
        if delay:
            time.sleep(delay)
    s.close()
    return sent

