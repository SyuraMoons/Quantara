# Quantara -- EasyA Kickstart Accelerator Pitch

> Meeting: Monday Feb 23, 2026 11:00 GMT | Google Meet: meet.google.com/oxi-usdg-bpk
> Organizer: Philip Kwok (phil@easya.io)

---

## Elevator Pitch (30s)

Hundreds of tokens launch on bonding curves every day. 99% are noise. Quantara is an AI-powered analytics layer for Base that scores every token in real time, tells you which ones are worth attention, and lets you trade them with slippage protection -- all from your browser, no backend, no sign-up.

---

## The Problem

Bonding curve launchpads like RobinPump on Base create a firehose of new tokens. Traders face:

- **Information overload** -- 50+ active tokens at any time, each with on-chain data nobody has time to analyze
- **No signal** -- holder concentration, creator behavior, volume patterns are all public but impossible to read at a glance
- **Execution risk** -- buying meme tokens on bonding curves means high slippage, no protection, and manual one-at-a-time transactions

The result: traders either FOMO into scams or miss genuine early-stage opportunities.

---

## The Solution: Quantara (RobinLens)

Quantara is a browser-based DeFi analytics and trading platform for Base. We do three things:

### 1. Score every token with AI

We pull real on-chain data (holder distribution, creator sell behavior, volume momentum, curve progress) and feed it to an LLM. Every token gets a **RobinScore (0-100)** broken into three dimensions:

- **Idea Quality** -- Is the concept viable or just a joke name?
- **On-Chain Health** -- How concentrated are holders? Did the creator dump?
- **Curve Position** -- Where is it on the bonding curve? Is momentum building?

Plus risk flags, comparable projects, and a clear buy/hold/avoid recommendation.

### 2. Batch-rank top tokens from multiple data sources

Our recommendation engine fuses four signal sources:

| Source | What it tells us |
|--------|-----------------|
| On-chain metrics | Holder concentration, creator behavior, buy/sell ratio |
| Technical indicators | Price momentum, trade velocity, trend direction |
| Market context | BTC/ETH dominance, global sentiment (via CoinGecko) |
| News sentiment | Crypto headlines relevance (via News API) |

One click: analyze 50 tokens, rank the top 10, explain why each stands out.

### 3. Trade with protection

Our smart contract router (RobinLensRouter on Base) adds:

- **Slippage protection** -- set your tolerance, revert if exceeded
- **Deadline validation** -- transactions expire after 5 minutes
- **Batch buy** -- buy all AI-recommended tokens in a single transaction

---

## What We Have Built (Working MVP)

This is not a mockup. Everything below is live and functional:

| Feature | Status |
|---------|--------|
| Token feed with real-time data (Goldsky Subgraph) | Live |
| AI scoring for individual tokens (GPT-4o / DeepSeek) | Live |
| Batch AI recommendations with configurable data sources | Live |
| Price charts (TradingView Lightweight Charts) | Live |
| Buy/sell trading with MetaMask integration | Live |
| Smart contract router with slippage protection | Deployed (Base Sepolia) |
| Batch buy from AI recommendations | Deployed (Base Sepolia) |
| Trader leaderboard by realized PnL | Live |
| Context-aware AI chatbot (support agent) | Live |
| Vercel production deployment | Live |

**4 pages, 13 components, 7 custom hooks, 14 library modules, 1 production smart contract with full Foundry test suite.**

---

## Architecture

```
Goldsky Subgraph          CoinGecko / News API
   (on-chain data)           (market context)
        |                         |
        v                         v
+------------------------------------------+
|        React Frontend (Browser)          |
|   Zero backend. Zero servers. Zero       |
|   custody. All logic runs client-side.   |
+------------------------------------------+
        |                    |
        v                    v
   OpenAI / DeepSeek    MetaMask + Base RPC
   (AI scoring)              |
                             v
                   RobinLensRouter (Base)
                   - Slippage protection
                   - Batch trading
                   - Deadline validation
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4 |
| Charts | TradingView Lightweight Charts |
| Web3 | ethers.js 6, MetaMask |
| AI | OpenAI GPT-4o / DeepSeek, Zod v4 schema validation |
| Contracts | Solidity 0.8.24, Foundry (full test coverage) |
| Data | Goldsky Subgraph (GraphQL), CoinGecko, News API |
| Deployment | Vercel (frontend), Base Sepolia (contracts) |

---

## What Makes This Different

1. **AI is structural, not cosmetic.** We compute real on-chain metrics (holder concentration, creator dump ratio, volume momentum) and validate every AI response with Zod schemas. Not a ChatGPT wrapper.

2. **Multi-source signal fusion.** Recommendations combine on-chain data + technical analysis + market context + news sentiment. Users choose which sources to enable.

3. **Zero backend.** No servers to scale, no API keys to protect server-side, no custody. The entire app runs in the browser. This is a feature, not a limitation -- it means users own their data and nothing goes through our servers.

4. **Smart contract router.** Not just a frontend -- we wrote and deployed a Solidity router that adds slippage protection and batch trading. Verified on BaseScan, tested with Foundry.

5. **Graceful degradation.** Works without OpenAI key (demo mode), without CoinGecko (skips market context), without News API (skips news). The app never breaks.

---

## Roadmap (Accelerator Period)

### Week 1: Production-Ready

- Deploy RobinLensRouter to Base mainnet
- Move API keys server-side (Vercel Edge Functions) to eliminate client-side exposure
- Add WebSocket support for real-time trade updates (replacing polling)
- Polish UI for public launch

### Week 2: Growth Features

- Portfolio tracking -- persistent positions and PnL across sessions
- Social signals integration -- trending tokens from Twitter/Farcaster
- Multi-chain exploration -- extend beyond Base (Arbitrum, Optimism)
- Public launch with documentation

### Post-Accelerator

- Trading fee revenue model through router contract
- Premium AI tiers (deeper analysis, more data sources, faster refresh)
- Mobile-responsive PWA
- Protocol partnerships (extend to other bonding curve platforms beyond RobinPump)

---

## Smart Contract

RobinLensRouter deployed on Base Sepolia: [`0xde8daf9599366b2ef8ae245bf574808844aa5f8a`](https://sepolia.basescan.org/address/0xde8daf9599366b2ef8ae245bf574808844aa5f8a)

| Function | Description |
|----------|-------------|
| `buyToken(curve, minTokensOut, deadline)` | Buy with slippage protection |
| `sellToken(curve, token, amount, minEthOut, deadline)` | Sell back to bonding curve |
| `multiBuy(curves[], ethAmounts[], minTokensOut[], deadline)` | Batch buy AI recommendations |
| `quoteBuy(curve, ethAmount)` | Get price quote before execution |

---

## Links

| Resource | URL |
|----------|-----|
| GitHub | https://github.com/SyuraMoons/RobinLens |
| RobinLensRouter (BaseScan) | https://sepolia.basescan.org/address/0xde8daf9599366b2ef8ae245bf574808844aa5f8a |
| Goldsky Subgraph | https://api.goldsky.com/api/public/project_cmjjrebt3mxpt01rm9yi04vqq/subgraphs/pump-charts/v2/gn |

---

## Video Script Outline (for EasyA submission)

### Scene 1: The Problem (15s)
"Every day, hundreds of tokens launch on bonding curves. Most are noise. Traders have no way to separate signal from scam."

### Scene 2: What Quantara Does (20s)
"Quantara scores every token using real on-chain data and AI. A RobinScore from 0 to 100 tells you idea quality, on-chain health, and curve position -- with risk flags and a clear recommendation."

### Scene 3: Live Demo (45s)
- Show token feed with live data
- Click into a token -- show AI analysis, price chart, holder distribution
- Show AI recommendations page -- toggle data sources, run analysis, see top 10 ranked
- Connect wallet, execute a trade with slippage protection

### Scene 4: How It Works (15s)
"Pure browser app. No backend, no custody. On-chain data from Goldsky, AI from GPT-4o, trading through our smart contract router on Base with slippage protection and batch buy."

### Scene 5: What's Next (15s)
"Mainnet deployment, portfolio tracking, social signals, and a revenue model through trading fees. We're building the intelligence layer for bonding curves."

**Total: ~2 minutes**

---

## Q&A Prep

| Question | Answer |
|----------|--------|
| Why no backend? | Speed, simplicity, and trust. Users don't send data through our servers. All logic runs locally. |
| How do you make money? | Router contract can charge trading fees. Premium AI tiers for power users. Both are straightforward to add. |
| Why Base? | RobinPump is native to Base. We go where the bonding curves are. |
| How accurate is the AI scoring? | Every response is validated against a Zod schema. Temperature 0.3 for consistency. Structured rubric, not vibes. We show the breakdown so users can judge for themselves. |
| What if the AI is wrong? | We show all three sub-scores and risk flags separately. Users see the reasoning, not just a number. The AI is a tool, not an oracle. |
| Why not just use Dextools / DEXScreener? | They show charts and trades. We score tokens, explain why, and let you batch-trade the recommendations. Different product category. |
| Is the smart contract audited? | Full Foundry test suite covering edge cases. Not professionally audited yet -- that's a priority for mainnet. |
| Can this work on other chains? | Architecture is chain-agnostic. We need a subgraph and bonding curve contracts. Extending to Arbitrum/Optimism is planned. |
