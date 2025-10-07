import csv
import os
import random
from datetime import datetime

OUT_DIR = "data"
OUT_FILE = os.path.join(OUT_DIR, "traffic_log.csv")

os.makedirs(OUT_DIR, exist_ok=True)

