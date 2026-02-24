"""
Vercel Python Serverless Function — /api/predict
=================================================
Loads the pretrained XGBoost models from export_model/models/ and returns
24h/7d price-up probabilities, direction, verdict, and confidence.

Request (POST JSON):
  {
    "closes": [50000, 50100, ...],     // >=50 daily close prices, oldest→newest
    "volumes": [1e9, 1.1e9, ...],      // same length as closes
    "price_change_24h": 2.5,           // optional
    "price_change_7d": -1.2,           // optional
    "price_change_30d": 15.0,          // optional
    "volume_mcap_ratio": 0.05,         // optional
    "ath_change_pct": -30.0,           // optional
    "fear_greed_value": 65.0           // optional, default 50
  }

Response (JSON):
  {
    "verdict": "STRONG BUY",
    "direction": "UP",
    "prob_up_24h": 72.3,
    "prob_up_7d": 65.1,
    "confidence": 7.2,
    "direction_probs": {"UP": 60.1, "DOWN": 20.5, "SIDEWAYS": 19.4},
    "model_version": "20260222_134059"
  }
"""

from __future__ import annotations

import json
import math
import os
import sys
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# ── TA utilities (inlined to avoid import issues in Vercel) ──────


def _ema_series(values: List[float], period: int) -> List[float]:
    if not values or period <= 0:
        return []
    if period > len(values):
        period = len(values)
    k = 2.0 / (period + 1)
    result = list(values[:period])
    seed = sum(values[:period]) / period
    result[-1] = seed
    for i in range(period, len(values)):
        result.append(values[i] * k + result[-1] * (1 - k))
    return result


def _rsi_series(closes: List[float], period: int = 14) -> List[float]:
    n = len(closes)
    if n < period + 1:
        return [50.0] * n
    result = [50.0] * period
    gains, losses = [], []
    for i in range(1, period + 1):
        delta = closes[i] - closes[i - 1]
        gains.append(max(delta, 0.0))
        losses.append(max(-delta, 0.0))
    avg_gain = sum(gains) / period
    avg_loss = sum(losses) / period
    if avg_loss == 0:
        result.append(100.0)
    else:
        rs = avg_gain / avg_loss
        result.append(100.0 - (100.0 / (1.0 + rs)))
    for i in range(period + 1, n):
        delta = closes[i] - closes[i - 1]
        gain = max(delta, 0.0)
        loss = max(-delta, 0.0)
        avg_gain = (avg_gain * (period - 1) + gain) / period
        avg_loss = (avg_loss * (period - 1) + loss) / period
        if avg_loss == 0:
            result.append(100.0)
        else:
            rs = avg_gain / avg_loss
            result.append(100.0 - (100.0 / (1.0 + rs)))
    return result


def _macd_series(
    closes: List[float], fast: int = 12, slow: int = 26, signal: int = 9
) -> Tuple[List[float], List[float], List[float]]:
    if len(closes) < slow:
        n = len(closes)
        return [0.0] * n, [0.0] * n, [0.0] * n
    fast_ema = _ema_series(closes, fast)
    slow_ema = _ema_series(closes, slow)
    macd_line = [f - s for f, s in zip(fast_ema, slow_ema)]
    sig_line = _ema_series(macd_line, signal)
    histogram = [m - s for m, s in zip(macd_line, sig_line)]
    return macd_line, sig_line, histogram


def _bollinger_series(
    closes: List[float], period: int = 20, std_mult: float = 2.0
) -> Tuple[List[float], List[float], List[float]]:
    n = len(closes)
    upper = list(closes)
    middle = list(closes)
    lower = list(closes)
    for i in range(period - 1, n):
        window = closes[i - period + 1 : i + 1]
        sma = sum(window) / period
        variance = sum((x - sma) ** 2 for x in window) / period
        std = math.sqrt(variance)
        middle[i] = sma
        upper[i] = sma + std_mult * std
        lower[i] = sma - std_mult * std
    return upper, middle, lower


def _bollinger_position(
    closes: List[float], period: int = 20, std_mult: float = 2.0
) -> List[float]:
    upper, _mid, lower = _bollinger_series(closes, period, std_mult)
    result = []
    for i, close in enumerate(closes):
        bw = upper[i] - lower[i]
        result.append((close - lower[i]) / bw if bw > 0 else 0.5)
    return result


def _sma_series(values: List[float], period: int) -> List[float]:
    n = len(values)
    result = list(values)
    for i in range(period - 1, n):
        result[i] = sum(values[i - period + 1 : i + 1]) / period
    return result


def _atr_series(closes: List[float], period: int = 14) -> List[float]:
    n = len(closes)
    tr = [0.0] * n
    for i in range(1, n):
        tr[i] = abs(closes[i] - closes[i - 1])
    atr = [0.0] * n
    if n > period:
        atr[period] = sum(tr[1 : period + 1]) / period
        for i in range(period + 1, n):
            atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period
    return atr


def _volatility_series(closes: List[float], period: int) -> List[float]:
    n = len(closes)
    vol = [0.0] * n
    returns = [0.0] * n
    for i in range(1, n):
        if closes[i - 1] > 0:
            returns[i] = (closes[i] - closes[i - 1]) / closes[i - 1]
    for i in range(period, n):
        window = returns[i - period + 1 : i + 1]
        mean = sum(window) / len(window)
        var = sum((r - mean) ** 2 for r in window) / len(window)
        vol[i] = math.sqrt(var)
    return vol


def _momentum_series(closes: List[float], period: int) -> List[float]:
    n = len(closes)
    mom = [0.0] * n
    for i in range(period, n):
        if closes[i - period] > 0:
            mom[i] = (closes[i] / closes[i - period] - 1.0) * 100.0
    return mom


def _volume_ratio_series(volumes: List[float], period: int = 20) -> List[float]:
    n = len(volumes)
    ratio = [1.0] * n
    for i in range(period, n):
        ma = sum(volumes[i - period : i]) / period
        ratio[i] = volumes[i] / ma if ma > 0 else 1.0
    return ratio


def _volume_spike(
    volumes: List[float], period: int = 20, threshold: float = 2.0
) -> List[float]:
    n = len(volumes)
    ratio = [1.0] * n
    for i in range(period, n):
        ma = sum(volumes[i - period : i]) / period
        ratio[i] = volumes[i] / ma if ma > 0 else 1.0
    return [1.0 if v > threshold else 0.0 for v in ratio]


def _support_resistance(closes: List[float], window: int = 20):
    n = len(closes)
    support = list(closes)
    resist = list(closes)
    for i in range(window, n):
        w = closes[i - window : i]
        support[i] = min(w)
        resist[i] = max(w)
    return support, resist


# ── Feature Computation ─────────────────────────────────────────

FEATURE_COLUMNS = [
    "rsi_7", "rsi_14", "rsi_21",
    "macd_line", "macd_signal", "macd_histogram", "macd_crossover",
    "bb_width", "bb_position",
    "ema_9_21_cross", "ema_50_200_cross", "price_above_ema200",
    "volume_ratio", "volume_spike",
    "price_momentum_5d", "price_momentum_10d", "price_momentum_30d",
    "rate_of_change_14",
    "atr_14", "volatility_10d", "volatility_30d",
    "dist_to_support_pct", "dist_to_resist_pct",
    "price_change_24h", "price_change_7d", "price_change_30d",
    "volume_mcap_ratio", "ath_change_pct",
    "rsi_14_ma_diff", "rsi_oversold", "rsi_overbought",
    "price_vs_sma20_pct", "price_vs_ema50_pct", "price_vs_ema200_pct",
    "vol_ratio_10_30", "momentum_accel",
    "fear_greed_value", "trend_encoded",
]


def compute_features(
    closes: List[float],
    volumes: List[float],
    price_change_24h: Optional[float] = None,
    price_change_7d: Optional[float] = None,
    price_change_30d: Optional[float] = None,
    volume_mcap_ratio: Optional[float] = None,
    ath_change_pct: Optional[float] = None,
    fear_greed_value: float = 50.0,
) -> Dict[str, float]:
    n = len(closes)
    i = n - 1

    rsi_7 = _rsi_series(closes, 7)
    rsi_14 = _rsi_series(closes, 14)
    rsi_21 = _rsi_series(closes, 21)

    macd_line, macd_signal, macd_hist = _macd_series(closes, 12, 26, 9)
    macd_cross = 0.0
    if i >= 1:
        prev_diff = macd_line[i - 1] - macd_signal[i - 1]
        curr_diff = macd_line[i] - macd_signal[i]
        if prev_diff <= 0 and curr_diff > 0:
            macd_cross = 1.0
        elif prev_diff >= 0 and curr_diff < 0:
            macd_cross = -1.0

    bb_upper, bb_mid, bb_lower = _bollinger_series(closes, 20, 2.0)
    bb_width_val = (bb_upper[i] - bb_lower[i]) / bb_mid[i] if bb_mid[i] > 0 else 0.0
    bb_pos = _bollinger_position(closes, 20, 2.0)

    ema_9 = _ema_series(closes, 9)
    ema_21 = _ema_series(closes, 21)
    ema_50 = _ema_series(closes, 50)
    ema_200 = _ema_series(closes, 200)
    sma_20 = _sma_series(closes, 20)

    ema_9_21_cross = 1.0 if ema_9[i] > ema_21[i] else 0.0
    ema_50_200_cross = 1.0 if ema_50[i] > ema_200[i] else 0.0
    price_above_ema200 = 1.0 if closes[i] > ema_200[i] else 0.0

    vol_ratio = _volume_ratio_series(volumes, 20)
    vol_spike = _volume_spike(volumes, 20, 2.0)

    mom_5 = _momentum_series(closes, 5)
    mom_10 = _momentum_series(closes, 10)
    mom_30 = _momentum_series(closes, 30)
    roc_14 = _momentum_series(closes, 14)

    atr_14 = _atr_series(closes, 14)
    vol_10 = _volatility_series(closes, 10)
    vol_30 = _volatility_series(closes, 30)

    support, resist = _support_resistance(closes, 20)
    dist_support = (closes[i] - support[i]) / support[i] * 100 if support[i] > 0 else 0.0
    dist_resist = (resist[i] - closes[i]) / closes[i] * 100 if closes[i] > 0 else 0.0

    if price_change_24h is None:
        price_change_24h = mom_5[i] / 5.0 if i >= 5 else 0.0
    if price_change_7d is None:
        price_change_7d = _momentum_series(closes, 7)[i] if n > 7 else 0.0
    if price_change_30d is None:
        price_change_30d = mom_30[i]
    if volume_mcap_ratio is None:
        volume_mcap_ratio = vol_ratio[i] * 0.02
    if ath_change_pct is None:
        ath_change_pct = -50.0

    rsi_avg = (rsi_7[i] + rsi_14[i] + rsi_21[i]) / 3.0
    rsi_14_ma_diff = rsi_14[i] - rsi_avg
    rsi_oversold = 1.0 if rsi_14[i] < 30 else 0.0
    rsi_overbought = 1.0 if rsi_14[i] > 70 else 0.0

    close = closes[i] if closes[i] > 0 else 1.0
    price_vs_sma20 = (close - sma_20[i]) / sma_20[i] * 100 if sma_20[i] > 0 else 0.0
    price_vs_ema50 = (close - ema_50[i]) / ema_50[i] * 100 if ema_50[i] > 0 else 0.0
    price_vs_ema200 = (close - ema_200[i]) / ema_200[i] * 100 if ema_200[i] > 0 else 0.0

    v10 = vol_10[i] if vol_10[i] > 0 else 1e-9
    v30 = vol_30[i] if vol_30[i] > 0 else 1e-9
    vol_ratio_10_30 = v10 / v30

    mom_accel = mom_5[i] - mom_10[i]

    if ema_50[i] > ema_200[i] and closes[i] > ema_50[i]:
        trend_enc = 1.0
    elif ema_50[i] < ema_200[i] and closes[i] < ema_50[i]:
        trend_enc = -1.0
    else:
        trend_enc = 0.0

    return {
        "rsi_7": rsi_7[i], "rsi_14": rsi_14[i], "rsi_21": rsi_21[i],
        "macd_line": macd_line[i], "macd_signal": macd_signal[i],
        "macd_histogram": macd_hist[i], "macd_crossover": macd_cross,
        "bb_width": bb_width_val, "bb_position": bb_pos[i],
        "ema_9_21_cross": ema_9_21_cross, "ema_50_200_cross": ema_50_200_cross,
        "price_above_ema200": price_above_ema200,
        "volume_ratio": vol_ratio[i], "volume_spike": vol_spike[i],
        "price_momentum_5d": mom_5[i], "price_momentum_10d": mom_10[i],
        "price_momentum_30d": mom_30[i], "rate_of_change_14": roc_14[i],
        "atr_14": atr_14[i], "volatility_10d": vol_10[i], "volatility_30d": vol_30[i],
        "dist_to_support_pct": dist_support, "dist_to_resist_pct": dist_resist,
        "price_change_24h": price_change_24h, "price_change_7d": price_change_7d,
        "price_change_30d": price_change_30d,
        "volume_mcap_ratio": volume_mcap_ratio, "ath_change_pct": ath_change_pct,
        "rsi_14_ma_diff": rsi_14_ma_diff, "rsi_oversold": rsi_oversold,
        "rsi_overbought": rsi_overbought,
        "price_vs_sma20_pct": price_vs_sma20, "price_vs_ema50_pct": price_vs_ema50,
        "price_vs_ema200_pct": price_vs_ema200,
        "vol_ratio_10_30": vol_ratio_10_30, "momentum_accel": mom_accel,
        "fear_greed_value": fear_greed_value, "trend_encoded": trend_enc,
    }


# ── Model Loading (cached at module level for warm starts) ──────

_models: Dict[str, Any] = {}


def _load_models():
    global _models
    if _models:
        return

    import joblib

    # Vercel serverless functions run from the project root
    # Try multiple paths to find the models directory
    candidates = [
        Path(__file__).parent.parent / "export_model" / "models",
        Path("/var/task/export_model/models"),
        Path(os.getcwd()) / "export_model" / "models",
    ]

    models_dir = None
    for path in candidates:
        if (path / "model_metadata.json").exists():
            models_dir = path
            break

    if models_dir is None:
        raise FileNotFoundError(
            f"Model files not found. Searched: {[str(p) for p in candidates]}"
        )

    with open(models_dir / "model_metadata.json") as f:
        metadata = json.load(f)

    _models["model_24h"] = joblib.load(models_dir / "model_24h_1d_latest.pkl")
    _models["model_7d"] = joblib.load(models_dir / "model_7d_1d_latest.pkl")
    _models["model_dir"] = joblib.load(models_dir / "model_dir_1d_latest.pkl")
    _models["label_encoder"] = joblib.load(models_dir / "label_encoder_latest.pkl")
    _models["metadata"] = metadata
    _models["feature_columns"] = metadata.get("feature_columns", FEATURE_COLUMNS)


def _predict(body: Dict[str, Any]) -> Dict[str, Any]:
    _load_models()

    closes = body.get("closes", [])
    volumes = body.get("volumes", [])

    if len(closes) < 50:
        raise ValueError(f"Need at least 50 close prices, got {len(closes)}")
    if len(volumes) < len(closes):
        volumes = volumes + [0.0] * (len(closes) - len(volumes))

    features = compute_features(
        closes,
        volumes,
        price_change_24h=body.get("price_change_24h"),
        price_change_7d=body.get("price_change_7d"),
        price_change_30d=body.get("price_change_30d"),
        volume_mcap_ratio=body.get("volume_mcap_ratio"),
        ath_change_pct=body.get("ath_change_pct"),
        fear_greed_value=body.get("fear_greed_value", 50.0),
    )

    feature_cols = _models["feature_columns"]
    X = [[features.get(col, 0.0) for col in feature_cols]]

    prob_24h = float(_models["model_24h"].predict_proba(X)[0][1])
    prob_7d = float(_models["model_7d"].predict_proba(X)[0][1])
    dir_probs = _models["model_dir"].predict_proba(X)[0]
    le = _models["label_encoder"]
    dir_pred = str(le.classes_[dir_probs.argmax()])

    both_bullish = min(prob_24h, prob_7d)
    both_bearish = min(1 - prob_24h, 1 - prob_7d)
    directional_strength = max(both_bullish, both_bearish)
    confidence = round(max(1.0, min(10.0, (directional_strength - 0.5) * 20)), 1)

    if prob_7d >= 0.60 and prob_24h >= 0.55:
        verdict = "STRONG BUY"
    elif prob_7d >= 0.50:
        verdict = "BUY"
    elif prob_7d <= 0.30:
        verdict = "SELL"
    elif prob_7d <= 0.40 and prob_24h <= 0.40:
        verdict = "AVOID"
    else:
        verdict = "NEUTRAL"

    return {
        "verdict": verdict,
        "direction": dir_pred,
        "prob_up_24h": round(prob_24h * 100, 1),
        "prob_up_7d": round(prob_7d * 100, 1),
        "confidence": confidence,
        "direction_probs": {
            str(cls): round(float(prob) * 100, 1)
            for cls, prob in zip(le.classes_, dir_probs)
        },
        "model_version": _models["metadata"].get("version", "unknown"),
    }


# ── Vercel Serverless Handler ───────────────────────────────────


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            raw = self.rfile.read(content_length)
            body = json.loads(raw) if raw else {}

            result = _predict(body)

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
