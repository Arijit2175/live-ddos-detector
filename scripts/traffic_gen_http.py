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
    
def worker(url, n_requests, delay, timeout, dry_run, stats, thread_id):
    sent = 0
    for i in range(n_requests):
        if dry_run:
            print(f"[DRY] thread {thread_id} would GET {url}")
            sent += 1
        else:
            try:
                r = requests.get(url, timeout=timeout)
            except Exception:
                pass
        stats["sent"] += 1
        if delay:
            time.sleep(delay)
    return sent

def main():
    parser = argparse.ArgumentParser(description="Safe HTTP generator (localhost only by default)")
    parser.add_argument("--url", required=True, help="Target URL (use http://127.0.0.1:8000/ for local)")
    parser.add_argument("--threads", type=int, default=DEFAULT_THREADS)
    parser.add_argument("--requests", dest="requests_per_thread", type=int, default=DEFAULT_REQS)
    parser.add_argument("--delay", type=float, default=DEFAULT_DELAY)
    parser.add_argument("--timeout", type=float, default=DEFAULT_TIMEOUT)
    parser.add_argument("--max-packets", type=int, default=DEFAULT_MAX_PACKETS, help="Global cap on number of requests")
    parser.add_argument("--dry-run", action="store_true", help="Show actions without sending requests")
    parser.add_argument("--allow-remote", action="store_true", help="Allow non-localhost targets (dangerous)")
    args = parser.parse_args()

    if not args.allow_remote and not is_local_target(args.url):
        print("ERROR: Target is not localhost. Use --allow-remote to override (not recommended).")
        sys.exit(1)

    total_planned = args.threads * args.requests_per_thread
    if total_planned > args.max_packets:
        per_thread = max(1, args.max_packets // args.threads)
        print(f"Planned {total_planned} > max {args.max_packets}. Reducing requests/thread -> {per_thread}")
        args.requests_per_thread = per_thread

    print(f"Starting safe HTTP generator -> url={args.url} threads={args.threads} reqs/thread={args.requests_per_thread} delay={args.delay}")
    if args.dry_run:
        print("DRY RUN: no network traffic will be sent.")

    if not args.dry_run:
        confirm = input("Type 'y' to start, anything else to abort: ").strip().lower()
    if confirm != "y" and not args.dry_run:
        print("Aborted by user.")
        sys.exit(0)

    stats = Counter()
    threads = []
    start = time.time()
    for i in range(args.threads):
        t = threading.Thread(target=worker, args=(args.url, args.requests_per_thread, args.delay, args.timeout, args.dry_run, stats, i), daemon=True)
        threads.append(t)
        t.start()

    try:
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        print("Interrupted by user.")
    duration = time.time() - start
    print(f"Done. Sent (or planned) {stats['sent']} requests in {duration:.2f}s")

if __name__ == "__main__":
    main()
