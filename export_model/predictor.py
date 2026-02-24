"""
NexYpher Pretrained XGBoost Predictor (Standalone)
=====================================================
Loads the pretrained 38-feature XGBoost models and makes predictions
from daily close prices + volumes.

Usage:
    from predictor import NexYpherPredictor

    predictor = NexYpherPredictor()  # auto-loads models from ./models/
    result = predictor.predict(closes, volumes)
    print(result)
"""

from __future__ import annotations

import json
import logging
import math
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from ta_utils import (
    ema_series,
    rsi_series,
    macd_series,
    bollinger_series,
    bollinger_position,
)

logger = logging.getLogger(__name__)


class NexYpherPredictor:
    """
    Standalone predictor using NexYpher's pretrained XGBoost models.

    Parameters
    ----------
    models_dir : str or Path, optional
        Path to the directory containing .pkl model files and model_metadata.json.
        Defaults to ./models/ relative to this file.
    """

    def __init__(self, models_dir: Optional[str] = None):
        if models_dir is None:
            models_dir = Path(__file__).parent / "models"
        else:
            models_dir = Path(models_dir)

        self.models_dir = models_dir
        self.model_24h = None
        self.model_7d = None
        self.model_dir = None
        self.label_encoder = None
        self.metadata: Dict[str, Any] = {}
        self.feature_columns: List[str] = []
        self._loaded = False

        self._load_models()

    def _load_models(self):
        """Load pretrained models from disk."""
        try:
            import joblib
        except ImportError:
            raise ImportError("joblib is required. Run: pip install joblib")

        meta_path = self.models_dir / "model_metadata.json"
        if not meta_path.exists():
            raise FileNotFoundError(f"Model metadata not found at {meta_path}")

        with open(meta_path) as f:
            self.metadata = json.load(f)

        paths = {
            "24h": self.models_dir / "model_24h_1d_latest.pkl",
            "7d":  self.models_dir / "model_7d_1d_latest.pkl",
            "dir": self.models_dir / "model_dir_1d_latest.pkl",
            "le":  self.models_dir / "label_encoder_latest.pkl",
        }

        for name, path in paths.items():
            if not path.exists():
                raise FileNotFoundError(f"Model file missing: {path}")

        self.model_24h = joblib.load(paths["24h"])
        self.model_7d = joblib.load(paths["7d"])
        self.model_dir = joblib.load(paths["dir"])
        self.label_encoder = joblib.load(paths["le"])

        self.feature_columns = self.metadata.get("feature_columns", [])
        expected = self.metadata.get("n_features", 38)
        if len(self.feature_columns) != expected:
            raise ValueError(
                f"Feature column count mismatch: {len(self.feature_columns)} vs expected {expected}"
            )

        self._loaded = True
        logger.info(
            "Models loaded (v%s): 24h CV=%.1f%%, 7d CV=%.1f%%",
            self.metadata.get("version", "?"),
            self.metadata.get("model_24h", {}).get("cv_mean", 0) * 100,
            self.metadata.get("model_7d", {}).get("cv_mean", 0) * 100,
        )

    # ── Internal TA helpers ──────────────────────────────────────

    @staticmethod
    def _sma_series(values: List[float], period: int) -> List[float]:
        n = len(values)
        result = list(values)
        for i in range(period - 1, n):
            result[i] = sum(values[i - period + 1: i + 1]) / period
        return result

    @staticmethod
    def _atr_series(closes: List[float], period: int = 14) -> List[float]:
        n = len(closes)
        tr = [0.0] * n
        for i in range(1, n):
            tr[i] = abs(closes[i] - closes[i - 1])
        atr = [0.0] * n
        if n > period:
            atr[period] = sum(tr[1:period + 1]) / period
            for i in range(period + 1, n):
                atr[i] = (atr[i - 1] * (period - 1) + tr[i]) / period
        return atr

    @staticmethod
    def _volatility_series(closes: List[float], period: int) -> List[float]:
        n = len(closes)
        vol = [0.0] * n
        returns = [0.0] * n
        for i in range(1, n):
            if closes[i - 1] > 0:
                returns[i] = (closes[i] - closes[i - 1]) / closes[i - 1]
        for i in range(period, n):
            window = returns[i - period + 1: i + 1]
            mean = sum(window) / len(window)
            var = sum((r - mean) ** 2 for r in window) / len(window)
            vol[i] = math.sqrt(var)
        return vol

    @staticmethod
    def _momentum_series(closes: List[float], period: int) -> List[float]:
        n = len(closes)
        mom = [0.0] * n
        for i in range(period, n):
            if closes[i - period] > 0:
                mom[i] = (closes[i] / closes[i - period] - 1.0) * 100.0
        return mom

    @staticmethod
    def _volume_ratio_series(volumes: List[float], period: int = 20) -> List[float]:
        n = len(volumes)
        ratio = [1.0] * n
        for i in range(period, n):
            ma = sum(volumes[i - period: i]) / period
            ratio[i] = volumes[i] / ma if ma > 0 else 1.0
        return ratio

    @staticmethod
    def _volume_spike(volumes: List[float], period: int = 20, threshold: float = 2.0) -> List[float]:
        n = len(volumes)
        ratio = [1.0] * n
        for i in range(period, n):
            ma = sum(volumes[i - period: i]) / period
            ratio[i] = volumes[i] / ma if ma > 0 else 1.0
        return [1.0 if v > threshold else 0.0 for v in ratio]

    @staticmethod
    def _support_resistance(closes: List[float], window: int = 20):
        n = len(closes)
        support = list(closes)
        resist = list(closes)
        for i in range(window, n):
            w = closes[i - window: i]
            support[i] = min(w)
            resist[i] = max(w)
        return support, resist

    # ── Feature computation ──────────────────────────────────────

    def compute_features(
        self,
        closes: List[float],
        volumes: List[float],
        price_change_24h: Optional[float] = None,
        price_change_7d: Optional[float] = None,
        price_change_30d: Optional[float] = None,
        volume_mcap_ratio: Optional[float] = None,
        ath_change_pct: Optional[float] = None,
        fear_greed_value: float = 50.0,
    ) -> Dict[str, float]:
        """
        Compute all 38 features from price/volume history.

        Parameters
        ----------
        closes : list of daily close prices (oldest -> newest, >=100 points recommended)
        volumes : list of daily volumes (same length as closes)
        price_change_24h : optional, % price change in last 24h (computed from closes if None)
        price_change_7d : optional, % price change in last 7d (computed from closes if None)
        price_change_30d : optional, % price change in last 30d (computed from closes if None)
        volume_mcap_ratio : optional, 24h volume / market cap ratio
        ath_change_pct : optional, % distance from all-time high
        fear_greed_value : Fear & Greed index (0-100), default 50

        Returns
        -------
        dict with 38 feature keys matching model's expected columns
        """
        n = len(closes)
        i = n - 1

        # RSI
        rsi_7 = rsi_series(closes, 7)
        rsi_14 = rsi_series(closes, 14)
        rsi_21 = rsi_series(closes, 21)

        # MACD
        macd_line, macd_signal, macd_hist = macd_series(closes, 12, 26, 9)
        macd_cross = 0.0
        if i >= 1:
            prev_diff = macd_line[i - 1] - macd_signal[i - 1]
            curr_diff = macd_line[i] - macd_signal[i]
            if prev_diff <= 0 and curr_diff > 0:
                macd_cross = 1.0
            elif prev_diff >= 0 and curr_diff < 0:
                macd_cross = -1.0

        # Bollinger Bands
        bb_upper, bb_mid, bb_lower = bollinger_series(closes, 20, 2.0)
        bb_width_val = (bb_upper[i] - bb_lower[i]) / bb_mid[i] if bb_mid[i] > 0 else 0.0
        bb_pos = bollinger_position(closes, 20, 2.0)

        # Moving averages
        ema_9 = ema_series(closes, 9)
        ema_21 = ema_series(closes, 21)
        ema_50 = ema_series(closes, 50)
        ema_200 = ema_series(closes, 200)
        sma_20 = self._sma_series(closes, 20)

        ema_9_21_cross = 1.0 if ema_9[i] > ema_21[i] else 0.0
        ema_50_200_cross = 1.0 if ema_50[i] > ema_200[i] else 0.0
        price_above_ema200 = 1.0 if closes[i] > ema_200[i] else 0.0

        # Volume
        vol_ratio = self._volume_ratio_series(volumes, 20)
        vol_spike = self._volume_spike(volumes, 20, 2.0)

        # Momentum
        mom_5 = self._momentum_series(closes, 5)
        mom_10 = self._momentum_series(closes, 10)
        mom_30 = self._momentum_series(closes, 30)
        roc_14 = self._momentum_series(closes, 14)

        # Volatility & ATR
        atr_14 = self._atr_series(closes, 14)
        vol_10 = self._volatility_series(closes, 10)
        vol_30 = self._volatility_series(closes, 30)

        # Support / Resistance
        support, resist = self._support_resistance(closes, 20)
        dist_support = (closes[i] - support[i]) / support[i] * 100 if support[i] > 0 else 0.0
        dist_resist = (resist[i] - closes[i]) / closes[i] * 100 if closes[i] > 0 else 0.0

        # Market-data features (use provided values or fallback)
        if price_change_24h is None:
            price_change_24h = mom_5[i] / 5.0 if i >= 5 else 0.0
        if price_change_7d is None:
            price_change_7d = self._momentum_series(closes, 7)[i] if n > 7 else 0.0
        if price_change_30d is None:
            price_change_30d = mom_30[i]
        if volume_mcap_ratio is None:
            volume_mcap_ratio = vol_ratio[i] * 0.02
        if ath_change_pct is None:
            ath_change_pct = -50.0

        # Engineered features
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

        features = {
            "rsi_7": rsi_7[i],
            "rsi_14": rsi_14[i],
            "rsi_21": rsi_21[i],
            "macd_line": macd_line[i],
            "macd_signal": macd_signal[i],
            "macd_histogram": macd_hist[i],
            "macd_crossover": macd_cross,
            "bb_width": bb_width_val,
            "bb_position": bb_pos[i],
            "ema_9_21_cross": ema_9_21_cross,
            "ema_50_200_cross": ema_50_200_cross,
            "price_above_ema200": price_above_ema200,
            "volume_ratio": vol_ratio[i],
            "volume_spike": vol_spike[i],
            "price_momentum_5d": mom_5[i],
            "price_momentum_10d": mom_10[i],
            "price_momentum_30d": mom_30[i],
            "rate_of_change_14": roc_14[i],
            "atr_14": atr_14[i],
            "volatility_10d": vol_10[i],
            "volatility_30d": vol_30[i],
            "dist_to_support_pct": dist_support,
            "dist_to_resist_pct": dist_resist,
            "price_change_24h": price_change_24h,
            "price_change_7d": price_change_7d,
            "price_change_30d": price_change_30d,
            "volume_mcap_ratio": volume_mcap_ratio,
            "ath_change_pct": ath_change_pct,
            "rsi_14_ma_diff": rsi_14_ma_diff,
            "rsi_oversold": rsi_oversold,
            "rsi_overbought": rsi_overbought,
            "price_vs_sma20_pct": price_vs_sma20,
            "price_vs_ema50_pct": price_vs_ema50,
            "price_vs_ema200_pct": price_vs_ema200,
            "vol_ratio_10_30": vol_ratio_10_30,
            "momentum_accel": mom_accel,
            "fear_greed_value": fear_greed_value,
            "trend_encoded": trend_enc,
        }
        return features

    # ── Prediction ───────────────────────────────────────────────

    def predict(
        self,
        closes: List[float],
        volumes: List[float],
        price_change_24h: Optional[float] = None,
        price_change_7d: Optional[float] = None,
        price_change_30d: Optional[float] = None,
        volume_mcap_ratio: Optional[float] = None,
        ath_change_pct: Optional[float] = None,
        fear_greed_value: float = 50.0,
    ) -> Dict[str, Any]:
        """
        Predict using the pretrained XGBoost models.

        Parameters
        ----------
        closes : list of daily close prices (oldest -> newest, >=50 points)
        volumes : list of daily volumes (same length as closes)
        price_change_24h : optional % price change (24h)
        price_change_7d : optional % price change (7d)
        price_change_30d : optional % price change (30d)
        volume_mcap_ratio : optional volume/market-cap ratio
        ath_change_pct : optional % from all-time high (e.g., -50.0)
        fear_greed_value : Fear & Greed index 0-100, default 50

        Returns
        -------
        dict with keys:
            verdict        : STRONG BUY | BUY | NEUTRAL | AVOID | SELL
            direction      : UP | DOWN | SIDEWAYS
            prob_up_24h    : float (0-100)
            prob_up_7d     : float (0-100)
            confidence     : float (1-10)
            direction_probs: {UP: %, DOWN: %, SIDEWAYS: %}
            model_version  : str
            features       : dict of all 38 computed features
        """
        if not self._loaded:
            raise RuntimeError("Models not loaded")

        if len(closes) < 50:
            raise ValueError(f"Need at least 50 close prices, got {len(closes)}")

        if len(volumes) < len(closes):
            volumes = volumes + [0.0] * (len(closes) - len(volumes))

        # Compute features
        features = self.compute_features(
            closes, volumes,
            price_change_24h, price_change_7d, price_change_30d,
            volume_mcap_ratio, ath_change_pct, fear_greed_value,
        )

        # Build feature vector in model's column order
        X = [[features.get(col, 0.0) for col in self.feature_columns]]

        # Predictions
        prob_24h = float(self.model_24h.predict_proba(X)[0][1])
        prob_7d = float(self.model_7d.predict_proba(X)[0][1])
        dir_probs = self.model_dir.predict_proba(X)[0]
        dir_pred = str(self.label_encoder.classes_[dir_probs.argmax()])

        # Confidence
        both_bullish = min(prob_24h, prob_7d)
        both_bearish = min(1 - prob_24h, 1 - prob_7d)
        directional_strength = max(both_bullish, both_bearish)
        confidence = round(max(1.0, min(10.0, (directional_strength - 0.5) * 20)), 1)

        # Verdict
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
                for cls, prob in zip(self.label_encoder.classes_, dir_probs)
            },
            "model_version": self.metadata.get("version", "unknown"),
            "model_24h_accuracy": self.metadata.get("model_24h", {}).get("cv_mean", 0),
            "model_7d_accuracy": self.metadata.get("model_7d", {}).get("cv_mean", 0),
            "features": features,
        }

    def info(self) -> Dict[str, Any]:
        """Return model metadata."""
        return {
            "loaded": self._loaded,
            "version": self.metadata.get("version"),
            "n_features": self.metadata.get("n_features"),
            "model_24h_accuracy": self.metadata.get("model_24h", {}).get("cv_mean"),
            "model_7d_accuracy": self.metadata.get("model_7d", {}).get("cv_mean"),
            "model_dir_accuracy": self.metadata.get("model_dir", {}).get("cv_mean"),
            "direction_classes": self.metadata.get("model_dir", {}).get("direction_classes"),
        }
