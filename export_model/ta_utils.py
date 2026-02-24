"""
Technical Analysis Utilities (Standalone)
==========================================
Dependency-free implementations of RSI, EMA, MACD, and Bollinger Bands.
All functions operate on plain Python lists (no NumPy required).
"""

from __future__ import annotations

import math
from typing import List, Tuple


# ── EMA ─────────────────────────────────────────────────────────

def ema(values: List[float], period: int) -> float:
    """Return the current (last) EMA value."""
    if not values or period <= 0:
        return 0.0
    series = ema_series(values, period)
    return series[-1] if series else 0.0


def ema_series(values: List[float], period: int) -> List[float]:
    """Compute a full EMA series."""
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


# ── RSI (Wilder-smoothed) ──────────────────────────────────────

def rsi_series(closes: List[float], period: int = 14) -> List[float]:
    """Compute a full RSI series using Wilder smoothing."""
    n = len(closes)
    if n < period + 1:
        return [50.0] * n

    result = [50.0] * period

    gains = []
    losses = []
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


def rsi(closes: List[float], period: int = 14) -> float:
    """Return the current (last) RSI value."""
    series = rsi_series(closes, period)
    return series[-1] if series else 50.0


# ── MACD ────────────────────────────────────────────────────────

def macd_series(
    closes: List[float],
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> Tuple[List[float], List[float], List[float]]:
    """Compute full MACD series. Returns (macd_line, signal_line, histogram)."""
    if len(closes) < slow:
        n = len(closes)
        return [0.0] * n, [0.0] * n, [0.0] * n

    fast_ema = ema_series(closes, fast)
    slow_ema = ema_series(closes, slow)

    macd_line = [f - s for f, s in zip(fast_ema, slow_ema)]
    sig_line = ema_series(macd_line, signal)
    histogram = [m - s for m, s in zip(macd_line, sig_line)]

    return macd_line, sig_line, histogram


def macd(
    closes: List[float],
    fast: int = 12,
    slow: int = 26,
    signal: int = 9,
) -> Tuple[float, float, float]:
    """Return the current (last) MACD value, signal, and histogram."""
    ml, sl, hist = macd_series(closes, fast, slow, signal)
    return (
        ml[-1] if ml else 0.0,
        sl[-1] if sl else 0.0,
        hist[-1] if hist else 0.0,
    )


# ── Bollinger Bands ─────────────────────────────────────────────

def bollinger_series(
    closes: List[float],
    period: int = 20,
    std_mult: float = 2.0,
) -> Tuple[List[float], List[float], List[float]]:
    """Compute Bollinger Bands. Returns (upper, middle, lower)."""
    n = len(closes)
    upper = list(closes)
    middle = list(closes)
    lower = list(closes)

    for i in range(period - 1, n):
        window = closes[i - period + 1: i + 1]
        sma = sum(window) / period
        variance = sum((x - sma) ** 2 for x in window) / period
        std = math.sqrt(variance)
        middle[i] = sma
        upper[i] = sma + std_mult * std
        lower[i] = sma - std_mult * std

    return upper, middle, lower


def bollinger_position(
    closes: List[float],
    period: int = 20,
    std_mult: float = 2.0,
) -> List[float]:
    """Normalized Bollinger position: 0.0 = lower band, 1.0 = upper band."""
    upper, middle, lower = bollinger_series(closes, period, std_mult)
    result: List[float] = []
    for i, close in enumerate(closes):
        band_width = upper[i] - lower[i]
        if band_width > 0:
            result.append((close - lower[i]) / band_width)
        else:
            result.append(0.5)
    return result
