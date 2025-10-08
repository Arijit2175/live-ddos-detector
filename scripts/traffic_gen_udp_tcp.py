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
    
