import argparse
import threading
import time
import requests
import socket
import sys
from urllib.parse import urlparse
from collections import Counter

DEFAULT_THREADS = 2
DEFAULT_REQS = 50
DEFAULT_DELAY = 0.02
DEFAULT_TIMEOUT = 2.0
DEFAULT_MAX_PACKETS = 500

def is_local_target(url):
    try:
        host = urlparse(url).hostname
        if host in ("localhost", "127.0.0.1", "::1"):
            return True
        ips = socket.gethostbyname_ex(host)[2]
        for ip in ips:
            if ip.startswith("127.") or ip.startswith("10.") or ip.startswith("192.168.") or ip.startswith("172."):
                return False
        return False
    except Exception:
        return False
    
