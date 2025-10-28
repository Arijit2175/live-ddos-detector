from flask import Flask, Response, send_from_directory, jsonify
import time, json, os

app = Flask(__name__, static_folder="../frontend", static_url_path="/")

ALERTS_FILE = "data/alerts.jsonl"

def stream_alerts():
    last_pos = 0
    if not os.path.exists(ALERTS_FILE):
        open(ALERTS_FILE, "a").close()

    while True:
        try:
            with open(ALERTS_FILE, "r", encoding="utf-8") as f:
                f.seek(last_pos)
                line = f.readline()
                if not line:
                    time.sleep(0.5)
                    continue
                last_pos = f.tell()
                yield f"data: {line.strip()}\n\n"
        except Exception as e:
            print("[server] stream error:", e)
            time.sleep(1)

@app.route("/stream")
def stream():
    return Response(stream_alerts(), mimetype="text/event-stream")

@app.route("/api/alerts")
def api_alerts():
    arr = []
    if os.path.exists(ALERTS_FILE):
        with open(ALERTS_FILE, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    arr.append(json.loads(line))
                except:
                    pass
    return jsonify(arr[-200:])

