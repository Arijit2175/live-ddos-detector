from flask import Flask, Response, send_from_directory, jsonify
import time, json, os

app = Flask(__name__, static_folder="../web-dashboard", static_url_path="/")

ALERTS_FILE = "data/alerts.jsonl"

