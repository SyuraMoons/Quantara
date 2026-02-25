/**
 * ML Predictor Client
 * ====================
 * Calls the ML prediction API (Render or local) to get
 * XGBoost-based price predictions.
 */

// In production, points to the Render service. In dev, falls back to local proxy.
const ML_API_URL = import.meta.env.VITE_ML_API_URL || '/api/predict'

export interface MLPrediction {
  verdict: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'AVOID' | 'SELL'
  direction: 'UP' | 'DOWN' | 'SIDEWAYS'
  prob_up_24h: number
  prob_up_7d: number
  confidence: number
  direction_probs: Record<string, number>
  model_version: string
}

export interface PredictRequest {
  closes: number[]
  volumes: number[]
  price_change_24h?: number
  price_change_7d?: number
  price_change_30d?: number
  volume_mcap_ratio?: number
  ath_change_pct?: number
  fear_greed_value?: number
}

const CACHE_KEY_PREFIX = 'quantara:ml:'
const CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes

interface CachedPrediction {
  prediction: MLPrediction
  cachedAt: number
}

export function getMLPredictionFromCache(curveId: string): MLPrediction | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + curveId)
    if (!raw) return null
    const entry = JSON.parse(raw) as CachedPrediction
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY_PREFIX + curveId)
      return null
    }
    return entry.prediction
  } catch {
    return null
  }
}

function saveMLPredictionToCache(curveId: string, prediction: MLPrediction): void {
  const entry: CachedPrediction = { prediction, cachedAt: Date.now() }
  localStorage.setItem(CACHE_KEY_PREFIX + curveId, JSON.stringify(entry))
}

/**
 * Build close prices from trade data.
 * Groups trades into daily buckets and takes the last price per day.
 * Returns { closes, volumes } oldest→newest. Pads with interpolation if < 50 points.
 */
export function tradesToDailyPrices(
  trades: Array<{ priceUsd: string; amountEth: string; timestamp: string }>,
): { closes: number[]; volumes: number[] } | null {
  if (!trades || trades.length === 0) return null

  // Sort oldest first
  const sorted = [...trades].sort(
    (a, b) => parseInt(a.timestamp) - parseInt(b.timestamp),
  )

  // Group by day
  const dayMap = new Map<string, { close: number; volume: number }>()
  for (const t of sorted) {
    const ts = parseInt(t.timestamp) * 1000
    const day = new Date(ts).toISOString().slice(0, 10)
    const price = parseFloat(t.priceUsd)
    const vol = parseFloat(t.amountEth)
    if (isNaN(price) || price <= 0) continue
    // Last trade of the day = close
    dayMap.set(day, {
      close: price,
      volume: (dayMap.get(day)?.volume ?? 0) + (isNaN(vol) ? 0 : vol),
    })
  }

  const days = [...dayMap.keys()].sort()
  if (days.length === 0) return null

  const closes = days.map((d) => dayMap.get(d)!.close)
  const volumes = days.map((d) => dayMap.get(d)!.volume)

  // Pad to at least 50 data points by repeating the first value
  // This is common for new tokens that don't have 50 days of history
  if (closes.length < 50) {
    const padCount = 50 - closes.length
    const firstClose = closes[0]
    const firstVol = volumes[0]
    const padCloses = Array(padCount).fill(firstClose)
    const padVols = Array(padCount).fill(firstVol)
    closes.unshift(...padCloses)
    volumes.unshift(...padVols)
  }

  return { closes, volumes }
}

/**
 * Call the ML prediction API.
 * Checks cache first, then makes the API call.
 */
export async function getMLPrediction(
  curveId: string,
  request: PredictRequest,
): Promise<MLPrediction> {
  // Check cache
  const cached = getMLPredictionFromCache(curveId)
  if (cached) return cached

  const response = await fetch(ML_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'ML prediction failed' }))
    throw new Error(err.error || `ML API error: ${response.status}`)
  }

  const prediction = (await response.json()) as MLPrediction
  saveMLPredictionToCache(curveId, prediction)
  return prediction
}
