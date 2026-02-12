export type SupportRole = 'user' | 'assistant'

export interface SupportMessage {
  role: SupportRole
  content: string
}

export interface SupportAgentResponse {
  textResponse: string
  suggestedActions: string[]
  followUpQuestions: string[]
}

import {
  fetchCurves,
  fetchCurve,
  fetchTrades,
  fetchTopTraders,
  type Curve,
  type Trade,
} from './goldsky'
// Fallback description when we can't build a live snapshot.
const DEFAULT_PAGE_CONTEXT = `
RobinLens is an AI-powered DeFi token analysis and trading frontend for RobinPump (a bonding curve token launchpad on Base).
`

const SYSTEM_PROMPT = `You are an expert support agent for RobinLens.
Your goal is to provide data-driven insights based strictly on the retrieved context for the **current page**.

Response guidelines:
- Analyze the user's query against the provided documentation context.
- Synthesize a concise, actionable answer, including practical trading guidance where appropriate.
- Recommend 1–3 concrete "Next Best Actions" the user can take on the platform.
- Generate 3 short, relevant follow-up questions that explore the topic deeper.
.- Where helpful, incorporate the latest live snapshot (tokens and market data) to make advice time-aware.

Output format (very important):
Return a single JSON object with the following shape:
{
  "text_response": string,            // main markdown answer
  "suggested_actions": string[],      // list of next steps the user can take
  "follow_up_questions": string[]     // exactly 3 short follow-up questions
}

Do NOT include any explanation outside of this JSON object.`

async function buildPageSnapshot(): Promise<string> {
  // Only available in the browser; on server just return fallback.
  if (typeof window === 'undefined') return DEFAULT_PAGE_CONTEXT

  const path = window.location.pathname || '/'

  try {
    if (path === '/') {
      const curves = await fetchCurves('totalVolumeEth', 10)
      return describeFeedPage(curves)
    }

    if (path.startsWith('/token/')) {
      const id = path.split('/')[2]
      if (!id) return DEFAULT_PAGE_CONTEXT
      const [curve, trades] = await Promise.all([
        fetchCurve(id),
        fetchTrades(id, 40),
      ])
      return describeTokenPage(curve, trades)
    }

    if (path === '/leaderboard') {
      const traders = await fetchTopTraders(20)
      return describeLeaderboardPage(traders)
    }

    // Recommendations and other pages fall back to generic context.
    return DEFAULT_PAGE_CONTEXT
  } catch (err) {
    console.error('Failed to build page snapshot', err)
    return DEFAULT_PAGE_CONTEXT
  }
}

function describeFeedPage(curves: Curve[]) {
  const top = curves.slice(0, 5)
  const lines: string[] = []

  lines.push('Current page: Token Feed.')

  if (top.length) {
    lines.push('Top tokens by 24h volume (from the feed):')
    top.forEach((c, idx) => {
      const priceUsd = parseFloat(c.lastPriceUsd || '0')
      const volumeEth = parseFloat(c.totalVolumeEth || '0')
      const trades = parseInt(c.tradeCount || '0', 10)
      lines.push(
        `${idx + 1}. ${c.name} ($${c.symbol}) — price ~$${priceUsd.toFixed(
          5,
        )}, volume ${volumeEth.toFixed(3)} ETH, trades ${trades}`,
      )
    })
  }

  return lines.join('\n')
}

function describeTokenPage(curve: Curve | null, trades: Trade[]) {
  if (!curve) return 'Current page: Token detail. Token data is unavailable.'

  const priceUsd = parseFloat(curve.lastPriceUsd || '0')
  const volumeEth = parseFloat(curve.totalVolumeEth || '0')
  const tradeCount = parseInt(curve.tradeCount || '0', 10)

  const buys = trades.filter((t) => t.side === 'BUY')
  const sells = trades.filter((t) => t.side === 'SELL')

  const lines: string[] = []

  lines.push(
    `Current page: Token detail for ${curve.name} ($${curve.symbol}) on bonding curve ${curve.id}.`,
  )
  lines.push(
    `Last price ~$${priceUsd.toFixed(6)}, total volume ${volumeEth.toFixed(
      3,
    )} ETH, total trades ${tradeCount}.`,
  )
  lines.push(
    `Recent activity: ${buys.length} buys and ${sells.length} sells in the latest ${trades.length} trades.`,
  )

  return lines.join('\n')
}

function describeLeaderboardPage(traders: Awaited<ReturnType<typeof fetchTopTraders>>) {
  const top = traders.slice(0, 10)
  const lines: string[] = []

  lines.push('Current page: Leaderboard (top realized PnL).')

  if (top.length) {
    lines.push('Top traders:')
    top.forEach((p, idx) => {
      lines.push(
        `${idx + 1}. Trader ${p.user.id} — PnL ${p.pnlEth.toFixed(
          3,
        )} ETH, buys ${p.buyCount}, sells ${p.sellCount}.`,
      )
    })
  }

  return lines.join('\n')
}

export async function askSupportAgent(
  conversation: SupportMessage[],
  sectionText: string | null,
): Promise<SupportAgentResponse> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash-latest'

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured')
  }

  try {
    const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`

    const parts: Array<{ text: string }> = []

    parts.push({ text: SYSTEM_PROMPT })

    if (sectionText && sectionText.trim()) {
      // Highest priority: the exact section the user is looking at
      parts.push({
        text: `Snapshot of the CURRENT SECTION the user is viewing:\n\n${sectionText}`,
      })
    } else {
      // Fallback: snapshot for the whole page
      const snapshot = await buildPageSnapshot()
      parts.push({ text: `Snapshot of the CURRENT PAGE:\n\n${snapshot}` })
    }

    for (const msg of conversation) {
      const prefix = msg.role === 'user' ? 'User: ' : 'Assistant: '
      parts.push({ text: `${prefix}${msg.content}\n` })
    }

    const response = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        generationConfig: {
          temperature: 0.3,
        },
      }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Gemini API error ${response.status}: ${text.slice(0, 200)}`)
    }

    const data = await response.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
      }>
    }

    const candidate = data.candidates?.[0]
    const contentText =
      candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? ''

    if (!contentText.trim()) {
      throw new Error('Empty assistant response from Gemini')
    }

    // Try to parse the JSON as requested in the system prompt
    try {
      const parsed = JSON.parse(contentText) as {
        text_response?: string
        suggested_actions?: string[]
        follow_up_questions?: string[]
      }

      return {
        textResponse: parsed.text_response ?? contentText,
        suggestedActions: parsed.suggested_actions ?? [],
        followUpQuestions: parsed.follow_up_questions ?? [],
      }
    } catch {
      // Fallback: treat whole text as the main response
      return {
        textResponse: contentText,
        suggestedActions: [],
        followUpQuestions: [],
      }
    }
  } catch (err) {
    throw err instanceof Error
      ? err
      : new Error(String(err))
  }
}

