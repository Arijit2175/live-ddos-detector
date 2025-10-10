import argparse
import math
import pandas as pd
from collections import Counter
from datetime import datetime, timezone

def parse_iso(ts):
    try:
        return pd.to_datetime(ts, utc = True)
    except Exception:
        return pd.to_datetime(ts)

def entropy_from_counts(counts):
    total = sum(counts)
    if total <= 0:
        return 0.0
    ent = 0.0
    for c in counts:
        p = c / total
        if p > 0:
            ent -= p * math.log2(p)
    return ent

