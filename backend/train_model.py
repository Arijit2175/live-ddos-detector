import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib
import os

DATA_FILE = "data/features.csv"
MODEL_FILE = "models/ddos_model.joblib"

