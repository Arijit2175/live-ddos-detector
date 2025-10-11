import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

DATA_FILE = "data/features.csv"
MODEL_FILE = "models/ddos_model.joblib"

def load_data():
    df = pd.read_csv(DATA_FILE)
    print(f"[*] Loaded {len(df)} windows from {DATA_FILE}")
    df["label"] = ((df["pkts"] > 200) | (df["unique_srcs"] > 50)).astype(int)
    print("[*] Label distribution:\n", df["label"].value_counts())
    return df

