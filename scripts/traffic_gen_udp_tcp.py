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

