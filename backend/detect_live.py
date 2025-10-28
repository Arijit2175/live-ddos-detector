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

