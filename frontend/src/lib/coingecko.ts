/**
 * CoinGecko market context for AI Recommendations (Market data source).
 * Fetches global stats, BTC/ETH prices, and trending tokens.
 * Optional CORS proxy fallback when browser blocks direct requests.
 */

const DEFAULT_BASE_URL = 'https://api.coingecko.com/api/v3'
const FETCH_TIMEOUT_MS = 12_000
const CORS_PROXY = 'https://corsproxy.io/?'

const apiKey = import.meta.env.VITE_COINGECKO_API_KEY as string | undefined
const explicitBase = import.meta.env.VITE_COINGECKO_BASE_URL as string | undefined
const proxyBase = import.meta.env.VITE_COINGECKO_PROXY as string | undefined

const BASE_URL = explicitBase || DEFAULT_BASE_URL

interface CoinGeckoGlobalResponse {
  data: {
    total_market_cap: Record<string, number>
    total_volume: Record<string, number>
    market_cap_change_percentage_24h_usd: number
    market_cap_percentage: Record<string, number>
  }
}

interface CoinGeckoTrendingResponse {
  coins: Array<{
    item: {
      id: string
      name: string
      symbol: string
      market_cap_rank: number | null
      price_btc: number | null
    }
  }>
}

interface CoinGeckoMarketsResponseItem {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_1h_in_currency?: number | null
  price_change_percentage_24h_in_currency?: number | null
}

export interface MarketContext {
  totalMarketCapUsd: number
  volume24hUsd: number
  marketCapChange24hPercent: number
  btcDominancePercent: number
  ethDominancePercent: number
  btcPriceUsd: number | null
  ethPriceUsd: number | null
  btcChange1hPercent: number | null
  btcChange24hPercent: number | null
  ethChange1hPercent: number | null
  ethChange24hPercent: number | null
  trendingTokens: Array<{
    id: string
    name: string
    symbol: string
    marketCapRank: number | null
    priceBtc: number | null
  }>
}

export function emptyMarketContext(): MarketContext {
  return {
    totalMarketCapUsd: 0,
    volume24hUsd: 0,
    marketCapChange24hPercent: 0,
    btcDominancePercent: 0,
    ethDominancePercent: 0,
    btcPriceUsd: null,
    ethPriceUsd: null,
    btcChange1hPercent: null,
    btcChange24hPercent: null,
    ethChange1hPercent: null,
    ethChange24hPercent: null,
    trendingTokens: [],
  }
}

async function fetchWithCorsFallback(
  url: string,
  headers: HeadersInit,
  signal: AbortSignal,
): Promise<Response> {
  try {
    const res = await fetch(url, { headers, signal })
    if (res.ok) return res
  } catch {
    // CORS or network error in browser
  }
  const proxyUrl = proxyBase
    ? `${proxyBase}${url.replace(/^https?:\/\//, '')}`
    : `${CORS_PROXY}${encodeURIComponent(url)}`
  return fetch(proxyUrl, { signal })
}

async function safeCoingeckoFetch<T>(
  path: string,
  params?: Record<string, string | number>,
): Promise<T | null> {
  const url = new URL(`${BASE_URL}${path}`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }
  }
  const headers: HeadersInit = {}
  if (apiKey) {
    if (BASE_URL.includes('pro-api.coingecko.com')) {
      headers['x-cg-pro-api-key'] = apiKey
    } else {
      headers['x-cg-demo-api-key'] = apiKey
    }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetchWithCorsFallback(url.toString(), headers, controller.signal)
    clearTimeout(timeoutId)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch (err) {
    clearTimeout(timeoutId)
    console.error(`CoinGecko request failed for ${path}`, err)
    return null
  }
}

export async function fetchMarketContext(): Promise<MarketContext> {
  const empty = emptyMarketContext()

  const [global, trending, btcEth] = await Promise.all([
    safeCoingeckoFetch<CoinGeckoGlobalResponse>('/global'),
    safeCoingeckoFetch<CoinGeckoTrendingResponse>('/search/trending'),
    safeCoingeckoFetch<CoinGeckoMarketsResponseItem[]>('/coins/markets', {
      vs_currency: 'usd',
      ids: 'bitcoin,ethereum',
      price_change_percentage: '1h,24h',
      per_page: 2,
      page: 1,
    }),
  ])

  if (!global?.data) {
    return empty
  }

  const data = global.data
  const totalMarketCapUsd =
    typeof data.total_market_cap === 'object' && data.total_market_cap?.usd != null
      ? Number(data.total_market_cap.usd)
      : 0
  const volume24hUsd =
    typeof data.total_volume === 'object' && data.total_volume?.usd != null
      ? Number(data.total_volume.usd)
      : 0
  const marketCapChange24hPercent =
    typeof data.market_cap_change_percentage_24h_usd === 'number'
      ? data.market_cap_change_percentage_24h_usd
      : 0
  const capPct = data.market_cap_percentage
  const btcDominancePercent =
    typeof capPct === 'object' && capPct?.btc != null ? Number(capPct.btc) : 0
  const ethDominancePercent =
    typeof capPct === 'object' && capPct?.eth != null ? Number(capPct.eth) : 0

  const btcList = Array.isArray(btcEth) ? btcEth : []
  const btc = btcList.find((c) => c?.id === 'bitcoin')
  const eth = btcList.find((c) => c?.id === 'ethereum')

  const trendingTokens = trending?.coins
    ? trending.coins.map(({ item }) => ({
        id: item?.id ?? '',
        name: item?.name ?? '',
        symbol: (item?.symbol ?? '').toUpperCase(),
        marketCapRank: item?.market_cap_rank ?? null,
        priceBtc: item?.price_btc ?? null,
      }))
    : []

  return {
    totalMarketCapUsd,
    volume24hUsd,
    marketCapChange24hPercent,
    btcDominancePercent,
    ethDominancePercent,
    btcPriceUsd: btc?.current_price != null ? Number(btc.current_price) : null,
    ethPriceUsd: eth?.current_price != null ? Number(eth.current_price) : null,
    btcChange1hPercent:
      btc?.price_change_percentage_1h_in_currency != null
        ? Number(btc.price_change_percentage_1h_in_currency)
        : null,
    btcChange24hPercent:
      btc?.price_change_percentage_24h_in_currency != null
        ? Number(btc.price_change_percentage_24h_in_currency)
        : null,
    ethChange1hPercent:
      eth?.price_change_percentage_1h_in_currency != null
        ? Number(eth.price_change_percentage_1h_in_currency)
        : null,
    ethChange24hPercent:
      eth?.price_change_percentage_24h_in_currency != null
        ? Number(eth.price_change_percentage_24h_in_currency)
        : null,
    trendingTokens,
  }
}
