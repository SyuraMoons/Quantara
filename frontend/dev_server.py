"""
Local Development Server for ML Prediction API
================================================
Run: python dev_server.py
Serves on http://localhost:3001/api/predict

This mirrors the Vercel serverless function locally.
The Vite dev proxy forwards /api/predict -> http://localhost:3001/api/predict.
"""

import json
import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path

# Add parent directory to path so we can import from export_model
sys.path.insert(0, str(Path(__file__).parent.parent / "export_model"))

from predictor import NexYpherPredictor

# Load models once at startup
print("Loading XGBoost models...")
predictor = NexYpherPredictor(
    models_dir=str(Path(__file__).parent.parent / "export_model" / "models")
)
print(f"Models loaded: {predictor.info()}")


class PredictHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path != "/api/predict":
            self.send_response(404)
            self.end_headers()
            return

        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(content_length)
            body = json.loads(raw) if raw else {}

            result = predictor.predict(
                closes=body.get("closes", []),
                volumes=body.get("volumes", []),
                price_change_24h=body.get("price_change_24h"),
                price_change_7d=body.get("price_change_7d"),
                price_change_30d=body.get("price_change_30d"),
                volume_mcap_ratio=body.get("volume_mcap_ratio"),
                ath_change_pct=body.get("ath_change_pct"),
                fear_greed_value=body.get("fear_greed_value", 50.0),
            )

            # Remove features dict (too large for frontend)
            result.pop("features", None)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except ValueError as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

        except Exception as e:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": str(e)}).encode())

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        print(f"[ML API] {args[0]}")


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 3001))
    server = HTTPServer(("0.0.0.0", port), PredictHandler)
    print(f"ML prediction server running at http://localhost:{port}/api/predict")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
        server.server_close()
