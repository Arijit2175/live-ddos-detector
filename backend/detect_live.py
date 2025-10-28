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

def compute_window_features(df_window):
    pkts = len(df_window)
    bytes_ = df_window['length'].sum()
    avg_pkt_size = df_window['length'].mean()
    unique_srcs = df_window['src_ip'].nunique()
    unique_dsts = df_window['dst_ip'].nunique()
    tcp_ratio = (df_window['protocol'] == "TCP").mean()
    udp_ratio = (df_window['protocol'] == "UDP").mean()
    icmp_ratio = (df_window['protocol'] == "ICMP").mean()

    from math import log2
    src_counts = df_window['src_ip'].value_counts(normalize=True)
    entropy_src = -(src_counts * src_counts.apply(lambda x: log2(x))).sum() if len(src_counts) > 0 else 0

    return {
        "pkts": pkts,
        "bytes": bytes_,
        "avg_pkt_size": avg_pkt_size,
        "unique_srcs": unique_srcs,
        "unique_dsts": unique_dsts,
        "tcp_ratio": tcp_ratio,
        "udp_ratio": udp_ratio,
        "icmp_ratio": icmp_ratio,
        "entropy_src": entropy_src,
    }

def monitor_and_detect(model):
    print("[*] Starting real-time detection...")
    last_processed_time = None

    while True:
        if not os.path.exists(LOG_PATH):
            print(f"[!] Waiting for {LOG_PATH} ...")
            time.sleep(POLL_INTERVAL)
            continue

        df = pd.read_csv(LOG_PATH)
        if df.empty:
            time.sleep(POLL_INTERVAL)
            continue

        df['timestamp'] = pd.to_datetime(df['timestamp'], errors='coerce')

        latest_time = df['timestamp'].max()
        start_time = latest_time - timedelta(seconds=WINDOW_SECONDS)

        df_window = df[df['timestamp'] >= start_time]

        if last_processed_time is not None and latest_time <= last_processed_time:
            time.sleep(POLL_INTERVAL)
            continue

        last_processed_time = latest_time

        feats = compute_window_features(df_window)
        X = pd.DataFrame([feats])
        pred = model.predict(X)[0]
        proba = model.predict_proba(X)[0][1]

        alert = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "predicted_label": int(pred),
            "probability": round(float(proba), 4),
            "window_pkts": feats["pkts"],
        }

        os.makedirs(os.path.dirname(ALERTS_PATH), exist_ok=True)
        with open(ALERTS_PATH, "a") as f:
            f.write(json.dumps(alert) + "\n")

        status = "⚠️  DDoS DETECTED" if pred == 1 else "✅ Normal"
        print(f"[{alert['timestamp']}] {status} | p={alert['probability']} | pkts={alert['window_pkts']}")

        time.sleep(POLL_INTERVAL)

def main():
    model = load_model()
    monitor_and_detect(model)

if __name__ == "__main__":
    main()