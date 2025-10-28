import time
import pandas as pd
import joblib
import json
import os
from datetime import datetime, timedelta

MODEL_PATH = "models/ddos_model.joblib"
LOG_PATH = "data/traffic_log.csv"
ALERTS_PATH = "data/alerts.jsonl"

WINDOW_SECONDS = 1
POLL_INTERVAL = 2  

def load_model():
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError("Model not found. Run train_model.py first.")
    print(f"[*] Loading model from {MODEL_PATH}")
    return joblib.load(MODEL_PATH)

