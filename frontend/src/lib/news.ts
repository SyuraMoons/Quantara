/**
 * News + sentiment context for AI Recommendations.
 * Uses News API (newsapi.org) when VITE_NEWS_API_KEY is set.
 * For production, use a serverless proxy (VITE_NEWS_API_PROXY) if the browser is blocked by CORS.
 */

const NEWS_API_BASE = 'https://newsapi.org/v2'
const FETCH_TIMEOUT_MS = 12_000

const POSITIVE_WORDS = [
  'surge', 'rally', 'gain', 'bullish', 'soar', 'jump', 'rise', 'high', 'growth',
  'recovery', 'breakout', 'all-time high', 'ath', 'adoption', 'institutional',
]
const NEGATIVE_WORDS = [
  'crash', 'plunge', 'fall', 'bearish', 'drop', 'collapse', 'sell-off', 'decline',
  'fear', 'scam', 'hack', 'exploit', 'ban', 'crackdown', 'liquidation',
]

export type SentimentLabel = 'positive' | 'negative' | 'neutral'

export interface NewsItem {
  title: string
  url: string
  publishedAt: string
  sentiment: SentimentLabel
  source: string
}

export interface NewsContext {
  items: NewsItem[]
  marketSentiment: 'bullish' | 'bearish' | 'neutral'
  summary: string
}

interface NewsApiArticle {
  source?: { id?: string; name?: string }
  author?: string
  title?: string
  description?: string
  url?: string
  publishedAt?: string
  content?: string
}

interface NewsApiResponse {
  status?: string
  totalResults?: number
  articles?: NewsApiArticle[]
}

function sentimentFromText(text: string): SentimentLabel {
  if (!text) return 'neutral'
  const lower = text.toLowerCase()
  const pos = POSITIVE_WORDS.filter((w) => lower.includes(w)).length
  const neg = NEGATIVE_WORDS.filter((w) => lower.includes(w)).length
  if (pos > neg) return 'positive'
  if (neg > pos) return 'negative'
  return 'neutral'
}

function aggregateSentiment(items: NewsItem[]): NewsContext['marketSentiment'] {
  if (items.length === 0) return 'neutral'
  let pos = 0
  let neg = 0
  for (const item of items) {
    if (item.sentiment === 'positive') pos++
    else if (item.sentiment === 'negative') neg++
  }
  if (pos > neg) return 'bullish'
  if (neg > pos) return 'bearish'
  return 'neutral'
}

export function emptyNewsContext(): NewsContext {
  return {
    items: [],
    marketSentiment: 'neutral',
    summary: 'No news data available.',
  }
}

export async function fetchNewsContext(): Promise<NewsContext> {
  const apiKey = import.meta.env.VITE_NEWS_API_KEY as string | undefined
  const proxyUrl = import.meta.env.VITE_NEWS_API_PROXY as string | undefined

  if (!apiKey && !proxyUrl) {
    return emptyNewsContext()
  }

  const query = 'bitcoin OR crypto OR ethereum OR blockchain OR defi'
  const params = new URLSearchParams({
    q: query,
    sortBy: 'publishedAt',
    pageSize: '15',
    language: 'en',
    ...(apiKey && !proxyUrl ? { apiKey } : {}),
  })

  const url = proxyUrl
    ? `${proxyUrl}?${params.toString()}`
    : `${NEWS_API_BASE}/everything?${params.toString()}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    if (!res.ok) return emptyNewsContext()
    const data = (await res.json()) as NewsApiResponse
    const articles = data?.articles ?? []
    const items: NewsItem[] = articles.slice(0, 15).map((art) => {
      const title = art.title ?? ''
      const desc = art.description ?? ''
      const sentiment = sentimentFromText(`${title} ${desc}`)
      return {
        title,
        url: art.url ?? '',
        publishedAt: art.publishedAt ?? '',
        sentiment,
        source: art.source?.name ?? 'News',
      }
    })
    const marketSentiment = aggregateSentiment(items)
    const positiveCount = items.filter((i) => i.sentiment === 'positive').length
    const negativeCount = items.filter((i) => i.sentiment === 'negative').length
    const summary =
      items.length === 0
        ? 'No news data available.'
        : `Recent crypto/news headlines: ${positiveCount} positive, ${negativeCount} negative, ${items.length - positiveCount - negativeCount} neutral. Overall headline sentiment: ${marketSentiment}.`
    return { items, marketSentiment, summary }
  } catch (err) {
    clearTimeout(timeoutId)
    console.error('Failed to fetch news context', err)
    return emptyNewsContext()
  }
}
