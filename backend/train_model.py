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

def train_model(df):
    features = ["pkts", "bytes", "avg_pkt_size",
                "unique_srcs", "unique_dsts",
                "tcp_ratio", "udp_ratio", "entropy_src"]
    X = df[features]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.3, random_state=42, stratify=y
    )

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    preds = model.predict(X_test)
    print("\n[*] Evaluation:")
    print(classification_report(y_test, preds))

    os.makedirs("models", exist_ok=True)
    joblib.dump(model, MODEL_FILE)
    print(f"[*] Model saved to {MODEL_FILE}")
    return model

def main():
    df = load_data()
    model = train_model(df)
    print("[*] Training complete.")

if __name__ == "__main__":
    main()