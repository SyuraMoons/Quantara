import { useState, useCallback, useRef } from 'react'
import type { RecommendationResponse } from '../lib/recommendationSchema'
import { getRecommendations, type RecommendationConfig, type AnalysisStep } from '../lib/recommender'
import { getRecommendationCache, saveRecommendationCache, demoRecommendation } from '../lib/demoRecommendation'

const COOLDOWN_MS = 60_000 // 60 seconds

function normalizeRecommendationError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('Failed to fetch') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('load failed')) {
    return 'Network error. Check your connection and try again.'
  }
  if (msg.includes('OPENAI_API_KEY') || msg.includes('api key') || msg.includes('401')) {
    return 'Invalid or missing OpenAI API key. Check your .env configuration.'
  }
  if (msg.includes('rate limit') || msg.includes('429')) {
    return 'Rate limit exceeded. Please wait a moment and try again.'
  }
  if (msg.includes('Empty LLM') || msg.includes('invalid response') || msg.includes('JSON')) {
    return 'AI returned an invalid response. Please try again.'
  }
  return msg || 'Analysis failed. Please try again.'
}

export interface UseRecommendationsReturn {
  recommendations: RecommendationResponse | null
  loading: boolean
  error: string | null
  step: AnalysisStep | null
  cachedAt: number | null
  cooldownRemaining: number
  analyze: (config: RecommendationConfig) => Promise<void>
}

export function useRecommendations(): UseRecommendationsReturn {
  const cached = getRecommendationCache()

  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(
    cached?.data ?? null,
  )
  const [cachedAt, setCachedAt] = useState<number | null>(cached?.timestamp ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<AnalysisStep | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const startCooldown = useCallback(() => {
    setCooldownRemaining(COOLDOWN_MS)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    const startTime = Date.now()
    cooldownRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, COOLDOWN_MS - elapsed)
      setCooldownRemaining(remaining)
      if (remaining === 0 && cooldownRef.current) {
        clearInterval(cooldownRef.current)
        cooldownRef.current = null
      }
    }, 1000)
  }, [])

  const analyze = useCallback(async (config: RecommendationConfig) => {
    setLoading(true)
    setError(null)
    setStep('fetching_tokens')

    try {
      let result: RecommendationResponse

      try {
        result = await getRecommendations(config, setStep)
      } catch (err) {
        const hasApiKey = Boolean(import.meta.env.VITE_OPENAI_API_KEY)
        if (!hasApiKey) {
          result = demoRecommendation
        } else {
          const message = normalizeRecommendationError(err)
          setError(message)
          setLoading(false)
          setStep(null)
          return
        }
      }

      setRecommendations(result)
      saveRecommendationCache(result)
      setCachedAt(Date.now())
      setError(null)
      startCooldown()
    } catch (err) {
      setError(normalizeRecommendationError(err))
    } finally {
      setLoading(false)
      setStep(null)
    }
  }, [startCooldown])

  return { recommendations, loading, error, step, cachedAt, cooldownRemaining, analyze }
}
