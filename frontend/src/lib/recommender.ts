import OpenAI from 'openai'
import { RecommendationResponseSchema, type RecommendationResponse } from './recommendationSchema'
import { fetchCurves, fetchTrades, fetchPositions, type Curve, type Trade, type Position } from './goldsky'
import { calculateMetrics, type OnChainMetrics } from './metrics'
import { calculateTechnicalMetrics, type TechnicalMetrics } from './technicalMetrics'
import { fetchNewsContext, emptyNewsContext, type NewsContext } from './news'
import { fetchMarketContext, emptyMarketContext, type MarketContext } from './coingecko'
import { tradesToDailyPrices, type MLPrediction } from './mlPredictor'

export type DataSource = 'on_chain' | 'technical' | 'news' | 'market' | 'ml'

export interface RecommendationConfig {
  enabledSources: DataSource[]
}

interface TokenData {
  curve: Curve
  onChainMetrics: OnChainMetrics
  technicalMetrics: TechnicalMetrics
  trades: Trade[]
  positions: Position[]
  mlPrediction?: MLPrediction | null
}

// --- Pre-filter scoring ---

function preFilterScore(metrics: OnChainMetrics): number {
  // Normalize each dimension to 0-1 range with sensible caps, then average equally
  const tradeNorm = Math.min(metrics.tradeCount / 200, 1)           // cap at 200 trades
  const holderNorm = Math.min(metrics.holderCount / 100, 1)          // cap at 100 holders
  const momentumNorm = Math.min(metrics.volumeMomentum / 5, 1)       // cap at 5x momentum
  const distributionNorm = 1 - metrics.top10Concentration             // already 0-1

  return (tradeNorm + holderNorm + momentumNorm + distributionNorm) / 4
}

// --- Prompt construction ---

function buildSystemPrompt(enabledSources: DataSource[]): string {
  const sourceDescriptions: string[] = []

  if (enabledSources.includes('on_chain')) {
    sourceDescriptions.push('on-chain metrics (holder distribution, trade volume, bonding curve progress, creator behavior)')
  }
  if (enabledSources.includes('technical')) {
    sourceDescriptions.push('technical indicators (price momentum, trade velocity, trend direction)')
  }
  if (enabledSources.includes('news')) {
    sourceDescriptions.push('recent crypto news and headline sentiment (bullish/bearish/neutral)')
  }
  if (enabledSources.includes('market')) {
    sourceDescriptions.push('global market data and trends from CoinGecko (cap, volume, BTC/ETH, trending majors)')
  }
  if (enabledSources.includes('ml')) {
    sourceDescriptions.push('XGBoost ML model predictions (24h/7d price-up probability, direction, confidence)')
  }

  return `You are a skeptical DeFi analyst ranking RobinPump bonding curve tokens on Base. Your job is to identify the best current opportunities from a batch of tokens, using ${sourceDescriptions.join(' and ')}.

Scoring calibration:
- 0-20: Obvious scam or dead token
- 21-40: Low quality, poor metrics
- 41-60: Average, some positive signals but nothing compelling
- 61-80: Above average, multiple strong signals, worth watching
- 81-100: Exceptional -- only if metrics are genuinely outstanding across dimensions

Be skeptical by default. Most bonding curve tokens are low quality. Your output must be valid JSON matching the exact schema requested.

For each recommended token, explain:
1. WHY you ranked it (specific data points, not generic statements)
2. Which data sources contributed most to your assessment
3. A clear suggested action and risk level

Risk levels:
- low: Strong metrics, no red flags
- medium: Mixed signals, some concerns
- high: Significant risks but potential upside
- critical: Major red flags, proceed with extreme caution

Respond with a JSON object containing:
- "recommendations": array of up to 10 tokens, ranked by robinScore descending
- "marketSummary": one paragraph summarizing the overall state of tokens you analyzed

Each recommendation must have:
- "curveId": the token's curve ID
- "name": token name
- "symbol": token symbol
- "robinScore": 0-100
- "explanation": 2-3 sentences on why this token stands out
- "contributingSources": array of source keys that were most relevant (${enabledSources.map((s) => `"${s}"`).join(', ')})
- "suggestedAction": "strong_buy" | "buy" | "hold" | "avoid"
- "riskLevel": "low" | "medium" | "high" | "critical"
- "reasoning": object with optional keys "onChain", "technical", "news", "market", and "ml", each a brief analysis from that perspective`
}

function formatMarketContextForPrompt(market: MarketContext | null): string {
  if (!market || market.totalMarketCapUsd === 0) return ''

  const lines: string[] = []
  lines.push('Global crypto market context (from CoinGecko):')
  lines.push(
    `- Total market cap: $${(market.totalMarketCapUsd / 1_000_000_000).toFixed(2)}B`,
  )
  lines.push(
    `- 24h volume: $${(market.volume24hUsd / 1_000_000_000).toFixed(2)}B`,
  )
  lines.push(
    `- Market cap change (24h): ${market.marketCapChange24hPercent.toFixed(2)}%`,
  )
  lines.push(
    `- BTC dominance: ${market.btcDominancePercent.toFixed(2)}%, ETH dominance: ${market.ethDominancePercent.toFixed(2)}%`,
  )
  if (market.btcPriceUsd != null && market.ethPriceUsd != null) {
    lines.push(
      `- BTC price: $${market.btcPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${market.btcChange24hPercent != null ? market.btcChange24hPercent.toFixed(2) : 'N/A'}% 24h)`,
    )
    lines.push(
      `- ETH price: $${market.ethPriceUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${market.ethChange24hPercent != null ? market.ethChange24hPercent.toFixed(2) : 'N/A'}% 24h)`,
    )
  }
  if (market.trendingTokens.length > 0) {
    const list = market.trendingTokens.slice(0, 5).map((t) => {
      const rank = t.marketCapRank != null ? `#${t.marketCapRank}` : 'unranked'
      return `${t.name} (${t.symbol}, ${rank})`
    }).join('; ')
    lines.push(`- Trending majors (24h search interest): ${list}`)
  }
  lines.push(
    'Use this to calibrate risk (e.g. risk-on vs risk-off, majors up or down).',
  )
  return lines.join('\n')
}

function formatNewsContextForPrompt(news: NewsContext | null): string {
  if (!news || news.items.length === 0) return ''

  const lines: string[] = []
  lines.push('Recent crypto news and sentiment (from News API):')
  lines.push(`- Overall headline sentiment: ${news.marketSentiment}.`)
  lines.push(`- Summary: ${news.summary}`)
  lines.push('Sample headlines (sentiment):')
  news.items.slice(0, 8).forEach((item) => {
    lines.push(`- [${item.sentiment}] ${item.title}`)
  })
  lines.push(
    'Use this to calibrate risk (e.g. bearish news may justify more conservative scores).',
  )
  return lines.join('\n')
}

function buildUserPrompt(
  tokens: TokenData[],
  enabledSources: DataSource[],
  marketContext: MarketContext | null,
  newsContext: NewsContext | null,
): string {
  const tokenBlocks = tokens.map((t, i) => {
    const parts: string[] = [
      `Token #${i + 1}: ${t.curve.name} ($${t.curve.symbol})`,
      `Curve ID: ${t.curve.id}`,
      `Age: ${t.onChainMetrics.ageHours.toFixed(1)} hours`,
      `Graduated: ${t.curve.graduated ? 'Yes' : 'No'}`,
    ]

    if (enabledSources.includes('on_chain')) {
      parts.push(
        `\nOn-chain metrics:`,
        `- Holders: ${t.onChainMetrics.holderCount}`,
        `- Top 10 concentration: ${(t.onChainMetrics.top10Concentration * 100).toFixed(1)}%`,
        `- Buy/sell ratio: ${t.onChainMetrics.buySellRatio.toFixed(2)}`,
        `- Volume momentum: ${t.onChainMetrics.volumeMomentum.toFixed(2)}x`,
        `- Creator sold: ${(t.onChainMetrics.creatorSoldPercent * 100).toFixed(1)}%`,
        `- Curve progress: ${(t.onChainMetrics.bondingCurveProgress * 100).toFixed(1)}%`,
        `- Total trades: ${t.onChainMetrics.tradeCount}`,
      )
    }

    if (enabledSources.includes('technical')) {
      parts.push(
        `\nTechnical indicators:`,
        `- Price change (1h): ${(t.technicalMetrics.priceChange1h * 100).toFixed(2)}%`,
        `- Price change (24h): ${(t.technicalMetrics.priceChange24h * 100).toFixed(2)}%`,
        `- Trade velocity: ${t.technicalMetrics.tradeVelocity.toFixed(2)}x`,
        `- Trend: ${t.technicalMetrics.trendDirection}`,
      )
    }

    if (enabledSources.includes('ml') && t.mlPrediction) {
      parts.push(
        `\nML Model prediction (XGBoost):`,
        `- Verdict: ${t.mlPrediction.verdict}`,
        `- Direction: ${t.mlPrediction.direction}`,
        `- Prob up 24h: ${t.mlPrediction.prob_up_24h}%`,
        `- Prob up 7d: ${t.mlPrediction.prob_up_7d}%`,
        `- Confidence: ${t.mlPrediction.confidence}/10`,
      )
    }

    return parts.join('\n')
  })

  const marketSection = formatMarketContextForPrompt(marketContext)
  const newsSection = formatNewsContextForPrompt(newsContext)
  const header = `Analyze these ${tokens.length} RobinPump tokens and recommend the top 10 (or fewer if most are low quality). Rank them by overall quality.`

  const pieces = []
  if (marketSection) pieces.push(marketSection)
  if (newsSection) pieces.push(newsSection)
  pieces.push(header)
  pieces.push(tokenBlocks.join('\n\n---\n\n'))

  return pieces.join('\n\n')
}

// --- Data fetching ---

async function fetchAllTokenData(curves: Curve[]): Promise<TokenData[]> {
  // Fetch trades and positions for all curves in parallel, with concurrency control
  const BATCH_SIZE = 5
  const results: TokenData[] = []

  for (let i = 0; i < curves.length; i += BATCH_SIZE) {
    const batch = curves.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.all(
      batch.map(async (curve) => {
        const [trades, positions] = await Promise.all([
          fetchTrades(curve.id, 100),
          fetchPositions(curve.id, 50),
        ])
        const onChainMetrics = calculateMetrics(curve, trades, positions)
        const technicalMetrics = calculateTechnicalMetrics(trades, onChainMetrics.ageHours)
        return { curve, onChainMetrics, technicalMetrics, trades, positions }
      }),
    )
    results.push(...batchResults)
  }

  return results
}

// --- Main entry point ---
//
// Pipeline: On-Chain + Technical + News + Market → AI analysis
// 1. Start Market (CoinGecko) and News (News API) fetches in parallel (when enabled).
// 2. Fetch token list (Goldsky curves), then per-token trades/positions → on-chain + technical metrics.
// 3. Pre-filter to top 20 tokens by composite score.
// 4. Build prompt from enabled sources (market context, news context, token blocks with on-chain/technical).
// 5. Call OpenAI; parse and validate JSON response.

export type AnalysisStep = 'fetching_tokens' | 'computing_metrics' | 'running_ai' | 'done'

export async function getRecommendations(
  config: RecommendationConfig,
  onProgress?: (step: AnalysisStep) => void,
): Promise<RecommendationResponse> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const baseURL = '/api/openai'
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o'

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured')
  }

  if (config.enabledSources.length === 0) {
    throw new Error('At least one data source must be enabled')
  }

  const marketContextPromise = config.enabledSources.includes('market')
    ? (async () => {
        try {
          return await fetchMarketContext()
        } catch (err) {
          console.error('Failed to fetch CoinGecko market context', err)
          return emptyMarketContext()
        }
      })()
    : Promise.resolve<MarketContext | null>(null)

  const newsContextPromise =
    config.enabledSources.includes('news') ?
      (async () => {
        try {
          return await fetchNewsContext()
        } catch (err) {
          console.error('Failed to fetch news context', err)
          return emptyNewsContext()
        }
      })()
    : Promise.resolve<NewsContext | null>(null)

  // Step 1: Fetch all active (non-graduated) tokens
  onProgress?.('fetching_tokens')
  let curves
  try {
    curves = await fetchCurves('totalVolumeEth', 50)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Token data: ${msg}`)
  }
  const activeCurves = curves.filter((c) => !c.graduated)

  // Step 2: Fetch detailed data and compute metrics
  onProgress?.('computing_metrics')
  let allTokenData
  try {
    allTokenData = await fetchAllTokenData(activeCurves)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Token metrics: ${msg}`)
  }

  // Step 3: Pre-filter to top 20 by composite score
  const sorted = [...allTokenData].sort(
    (a, b) => preFilterScore(b.onChainMetrics) - preFilterScore(a.onChainMetrics),
  )
  const top20 = sorted.slice(0, 20)

  const [marketContext, newsContext] = await Promise.all([
    marketContextPromise,
    newsContextPromise,
  ])

  // Step 3b: Fetch ML predictions for top 20 (when ML source enabled)
  if (config.enabledSources.includes('ml')) {
    await Promise.all(
      top20.map(async (t) => {
        try {
          const daily = tradesToDailyPrices(t.trades)
          if (!daily) return
          const res = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ closes: daily.closes, volumes: daily.volumes }),
          })
          if (res.ok) {
            t.mlPrediction = await res.json()
          }
        } catch {
          // ML prediction is best-effort; skip on failure
        }
      }),
    )
  }

  // Step 4: Build prompt and call GPT-4o
  onProgress?.('running_ai')
  const client = new OpenAI({ apiKey, baseURL, dangerouslyAllowBrowser: true })

  let content: string
  try {
    const response = await client.chat.completions.create({
      model,
      temperature: 0.3,
      messages: [
        { role: 'system', content: buildSystemPrompt(config.enabledSources) },
        {
          role: 'user',
          content: buildUserPrompt(top20, config.enabledSources, marketContext, newsContext),
        },
      ],
      response_format: { type: 'json_object' },
    })
    content = response.choices[0]?.message?.content ?? ''
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`AI request: ${msg}`)
  }

  if (!content.trim()) {
    throw new Error('Empty LLM response')
  }

  try {
    const parsed = JSON.parse(content)
    onProgress?.('done')
    return RecommendationResponseSchema.parse(parsed)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid AI response (schema): ${msg.slice(0, 80)}`)
  }
}
