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

