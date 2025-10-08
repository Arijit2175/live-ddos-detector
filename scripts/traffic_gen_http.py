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

