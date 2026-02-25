"""
Quantara ML Prediction API (Flask)
===================================
Deployed on Render as a web service.
Exposes POST /predict endpoint for XGBoost price predictions.
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import NexYpherPredictor

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Allow requests from the Vercel frontend and localhost
CORS(app, origins=[
    "https://quantara-app.vercel.app",
    "http://localhost:5173",
    "http://localhost:4173",
])

# Load the ML models once at startup
logger.info("Loading ML models...")
predictor = NexYpherPredictor()
logger.info("ML models loaded successfully.")


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    info = predictor.info()
    return jsonify({"status": "ok", "model": info})


@app.route("/predict", methods=["POST"])
def predict():
    """
    Run XGBoost prediction.

    Request JSON:
        closes: list[float]       - daily close prices (oldest→newest, ≥50 points)
        volumes: list[float]      - daily volumes (same length as closes)
        price_change_24h: float?  - optional
        price_change_7d: float?   - optional
        price_change_30d: float?  - optional
        volume_mcap_ratio: float? - optional
        ath_change_pct: float?    - optional
        fear_greed_value: float?  - optional (default 50)

    Response JSON:
        verdict, direction, prob_up_24h, prob_up_7d, confidence,
        direction_probs, model_version
    """
    try:
        data = request.get_json(force=True)
    except Exception:
        return jsonify({"error": "Invalid JSON body"}), 400

    closes = data.get("closes")
    volumes = data.get("volumes")

    if not closes or not isinstance(closes, list):
        return jsonify({"error": "Missing or invalid 'closes' array"}), 400
    if not volumes or not isinstance(volumes, list):
        return jsonify({"error": "Missing or invalid 'volumes' array"}), 400
    if len(closes) < 50:
        return jsonify({"error": f"Need at least 50 close prices, got {len(closes)}"}), 400

    try:
        result = predictor.predict(
            closes=closes,
            volumes=volumes,
            price_change_24h=data.get("price_change_24h"),
            price_change_7d=data.get("price_change_7d"),
            price_change_30d=data.get("price_change_30d"),
            volume_mcap_ratio=data.get("volume_mcap_ratio"),
            ath_change_pct=data.get("ath_change_pct"),
            fear_greed_value=data.get("fear_greed_value", 50.0),
        )

        # Return only the fields the frontend needs (exclude raw features)
        return jsonify({
            "verdict": result["verdict"],
            "direction": result["direction"],
            "prob_up_24h": result["prob_up_24h"],
            "prob_up_7d": result["prob_up_7d"],
            "confidence": result["confidence"],
            "direction_probs": result["direction_probs"],
            "model_version": result["model_version"],
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.exception("Prediction failed")
        return jsonify({"error": f"Prediction failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port)
