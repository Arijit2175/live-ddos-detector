# 🌐 Cyberattack Detection & Visualization Dashboard

### 🧠 Overview
The **Cyberattack Detection & Visualization Dashboard** is an interactive 3D visualization system that simulates and displays real-time cyberattack activity across the globe. It leverages `Three.js` for 3D rendering and dynamic animation, creating an immersive world map where arcs represent attack traffic between countries.  

This project aims to visualize global network threats in a visually appealing and educational way — suitable for demonstrations, cybersecurity visualizations, or as part of a SOC (Security Operations Center) display.

---

### 🎯 Objectives
- Visualize real-time or simulated cyberattacks in a **3D world map**.
- Show **source and target countries** dynamically connected by animated arcs.
- Provide a **live statistics sidebar** with top sources, logs, and prevention tips.
- Deliver a **smooth, modern, and responsive UI** optimized for performance.
- Serve as a base for integrating **real threat intelligence feeds** in the future.

---

## 🛠️ Tech Stack Used

| Layer / Component | Technologies Used | Description |
|------------------|-------------------|-------------|
| **Model Development & Training** | **Python**, NumPy, Pandas, Scikit-Learn / TensorFlow / PyTorch | Used to define, train, and evaluate the machine-learning model for detecting cyberattacks (including DDoS). |
| **Backend / API Server** | **Flask (Python)** | Serves the trained model, exposes prediction APIs, handles requests from the dashboard. |
| **Frontend (Dashboard UI)** | **HTML**, **CSS**, **JavaScript** | Builds the main user interface dashboard for visualizing predictions, logs, alerts, and attack insights. |
| **3D Visualization** | **Three.js (3JS)** | Used for rendering the interactive 3D globe on the dashboard to visualize incoming attack traffic. |
| **Data Handling & Visualization** | Chart.js / D3.js | Used for graphs, charts, or additional visual analytics. |

---

