import { useState, useCallback } from 'react'
import type { Trade } from '../lib/goldsky'
import type { MLPrediction } from '../lib/mlPredictor'
import {
  getMLPrediction,
  getMLPredictionFromCache,
  tradesToDailyPrices,
} from '../lib/mlPredictor'

interface MLPredictionCardProps {
  curveId: string
  trades: Trade[]
}

function verdictStyle(verdict: MLPrediction['verdict']): { bg: string; text: string } {
  switch (verdict) {
    case 'STRONG BUY':
      return { bg: 'bg-green/15 border-green/40', text: 'text-green' }
    case 'BUY':
      return { bg: 'bg-green/10 border-green/30', text: 'text-green' }
    case 'NEUTRAL':
      return { bg: 'bg-yellow/10 border-yellow/30', text: 'text-yellow' }
    case 'AVOID':
      return { bg: 'bg-red/10 border-red/30', text: 'text-red' }
    case 'SELL':
      return { bg: 'bg-red/15 border-red/40', text: 'text-red' }
  }
}

function directionArrow(direction: MLPrediction['direction']): string {
  switch (direction) {
    case 'UP':
      return '↑'
    case 'DOWN':
      return '↓'
    case 'SIDEWAYS':
      return '→'
  }
}

function directionColor(direction: MLPrediction['direction']): string {
  switch (direction) {
    case 'UP':
      return 'text-green'
    case 'DOWN':
      return 'text-red'
    case 'SIDEWAYS':
      return 'text-yellow'
  }
}

function ConfidenceBar({ value, max = 10 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100)
  const color = value >= 7 ? 'bg-green' : value >= 4 ? 'bg-yellow' : 'bg-red'

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-bg-primary">
        <div
          className={`h-full rounded-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-text-secondary">{value}/10</span>
    </div>
  )
}

function ProbabilityGauge({ label, value }: { label: string; value: number }) {
  const color = value >= 60 ? 'text-green' : value >= 45 ? 'text-yellow' : 'text-red'

  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-0.5 font-mono text-lg font-bold ${color}`}>{value}%</p>
    </div>
  )
}

export function MLPredictionCard({ curveId, trades }: MLPredictionCardProps) {
  const [prediction, setPrediction] = useState<MLPrediction | null>(
    () => getMLPredictionFromCache(curveId),
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runPrediction = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const daily = tradesToDailyPrices(trades)
      if (!daily) {
        throw new Error('Not enough trade data for ML prediction')
      }

      const result = await getMLPrediction(curveId, {
        closes: daily.closes,
        volumes: daily.volumes,
      })
      setPrediction(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Prediction failed')
    } finally {
      setLoading(false)
    }
  }, [curveId, trades])

  if (!prediction) {
    return (
      <div className="rounded-xl border border-border bg-bg-card p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-purple/20">
            <span className="text-xs text-purple">ML</span>
          </div>
          <h3 className="font-display text-base font-semibold text-text-primary">
            ML Price Prediction
          </h3>
        </div>
        <p className="mt-2 text-sm text-text-muted">
          XGBoost model analyzes 38 technical indicators to predict price direction with calibrated probabilities.
        </p>
        {error && <p className="mt-2 text-sm text-red">{error}</p>}
        <button
          onClick={runPrediction}
          disabled={loading}
          className="mt-4 rounded-lg bg-purple/90 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple/70 disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" fill="currentColor" className="opacity-75" />
              </svg>
              Predicting...
            </span>
          ) : (
            'Run ML Prediction'
          )}
        </button>
      </div>
    )
  }

  const vs = verdictStyle(prediction.verdict)

  return (
    <div className="rounded-xl border border-border bg-bg-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-purple/20">
            <span className="text-xs text-purple">ML</span>
          </div>
          <h3 className="font-display text-base font-semibold text-text-primary">
            ML Price Prediction
          </h3>
        </div>
        <span className="text-[10px] text-text-muted">v{prediction.model_version}</span>
      </div>

      {/* Verdict badge */}
      <div className={`mt-3 inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${vs.bg}`}>
        <span className={`text-sm font-bold ${vs.text}`}>{prediction.verdict}</span>
        <span className={`text-lg ${directionColor(prediction.direction)}`}>
          {directionArrow(prediction.direction)}
        </span>
      </div>

      {/* Probabilities */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <ProbabilityGauge label="Up in 24h" value={prediction.prob_up_24h} />
        <ProbabilityGauge label="Up in 7d" value={prediction.prob_up_7d} />
      </div>

      {/* Direction probabilities */}
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wider text-text-muted">Direction Breakdown</p>
        <div className="mt-1.5 flex gap-3">
          {Object.entries(prediction.direction_probs).map(([dir, prob]) => (
            <div key={dir} className="flex items-center gap-1">
              <span className={`text-xs font-medium ${directionColor(dir as MLPrediction['direction'])}`}>
                {directionArrow(dir as MLPrediction['direction'])} {dir}
              </span>
              <span className="text-xs font-mono text-text-muted">{prob}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Confidence */}
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wider text-text-muted">Model Confidence</p>
        <div className="mt-1">
          <ConfidenceBar value={prediction.confidence} />
        </div>
      </div>

      {/* Re-run */}
      <button
        onClick={runPrediction}
        disabled={loading}
        className="mt-4 text-xs text-text-muted hover:text-text-secondary"
      >
        {loading ? 'Re-predicting...' : 'Re-predict'}
      </button>
    </div>
  )
}
