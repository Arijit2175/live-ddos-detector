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

def build_features(df, window_seconds=5):
    if not pd.api.types.is_datetime64_any_dtype(df['timestamp']):
        df['timestamp'] = pd.to_datetime(df['timestamp'], utc=True)

    df['epoch'] = df['timestamp'].astype('int64') // 1_000_000_000

    df['window_id'] = (df['epoch'] // window_seconds).astype(int)

    records = []
    grouped = df.groupby('window_id')
    for wid, g in grouped:
        t0 = int(wid * window_seconds)
        window_start = datetime.fromtimestamp(t0, tz=timezone.utc).isoformat()
        window_end = datetime.fromtimestamp(t0 + window_seconds, tz=timezone.utc).isoformat()

        pkts = len(g)
        bytes_sum = g['length'].sum() if 'length' in g.columns else 0
        avg_pkt_size = (bytes_sum / pkts) if pkts else 0.0
        unique_srcs = g['src_ip'].nunique() if 'src_ip' in g.columns else 0
        unique_dsts = g['dst_ip'].nunique() if 'dst_ip' in g.columns else 0

        proto_counts = g['protocol'].value_counts().to_dict() if 'protocol' in g.columns else {}
        tcp = proto_counts.get('TCP', 0)
        udp = proto_counts.get('UDP', 0)
        icmp = proto_counts.get('ICMP', 0)
        tcp_ratio = tcp / pkts if pkts else 0.0
        udp_ratio = udp / pkts if pkts else 0.0
        icmp_ratio = icmp / pkts if pkts else 0.0

        src_counts = g['src_ip'].value_counts().tolist() if 'src_ip' in g.columns else []
        entropy_src = entropy_from_counts(src_counts)

        rec = {
            'window_start': window_start,
            'window_end': window_end,
            'pkts': int(pkts),
            'bytes': int(bytes_sum),
            'avg_pkt_size': float(avg_pkt_size),
            'unique_srcs': int(unique_srcs),
            'unique_dsts': int(unique_dsts),
            'tcp_ratio': float(round(tcp_ratio, 4)),
            'udp_ratio': float(round(udp_ratio, 4)),
            'icmp_ratio': float(round(icmp_ratio, 4)),
            'entropy_src': float(round(entropy_src, 4)),
        }
        records.append(rec)

    feat_df = pd.DataFrame(records)
    feat_df = feat_df.sort_values('window_start').reset_index(drop=True)
    return feat_df

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='data/traffic_log.csv', help='Input CSV of raw packets')
    parser.add_argument('--out', default='data/features.csv', help='Output CSV for features')
    parser.add_argument('--window', type=int, default=5, help='Window size in seconds (integer)')
    args = parser.parse_args()

    print("[*] Reading:", args.input)
    df = pd.read_csv(args.input)
    if 'timestamp' not in df.columns:
        raise SystemExit("Input CSV must have 'timestamp' column")

    print(f"[*] Rows loaded: {len(df)}")
    feat_df = build_features(df, window_seconds=args.window)

    print(f"[*] Windows produced: {len(feat_df)}")
    feat_df.to_csv(args.out, index=False)
    print("[*] Wrote features to:", args.out)
    print(feat_df.head(10).to_string(index=False))

if __name__ == '__main__':
    main()