# Quantara -- One-Liner & Q&A 文档

---

## One-Liner（一句话介绍）

**English:**

> Quantara is an AI-powered analytics and trading layer for Base that scores bonding curve tokens in real time and lets you trade them with smart contract protection.

**中文：**

> Quantara 是 Base 链上的 AI 分析交易平台，实时给 bonding curve 代币打分，带智能合约保护地交易。

**更短版本（适合 Twitter / 自我介绍）：**

> AI scoring for bonding curve tokens on Base. Analyze, rank, trade -- all in your browser.

---

## 项目关键数据（随时可引用）

| 指标   | 数据                                                        |
| ---- | --------------------------------------------------------- |
| 链    | Base（Sepolia 测试网 + Mainnet 数据源）                           |
| 技术栈  | React 19 + TypeScript + Solidity + GPT-4o                 |
| 智能合约 | RobinLensRouter，已部署 Base Sepolia                          |
| 数据源  | 6 个（Goldsky, OpenAI, IPFS, Base RPC, CoinGecko, News API） |
| 前端部署 | Vercel（生产环境）                                              |
| 后端   | 无（纯浏览器运行）                                                 |
| 状态   | Working MVP，所有核心功能已实现                                     |

---

## Q&A 完整版

### 产品类

**Q: Quantara 是什么？**
A: An AI analytics and trading platform for bonding curve tokens on Base. We score every token with real on-chain data, rank the top picks, and let you trade them with slippage protection -- all from your browser.

**Q: 和 Dextools / DEXScreener 有什么区别？**
A: They show charts and trades. We score tokens, explain why they're worth attention, and let you batch-trade the recommendations. It's like the difference between a stock screener and a Bloomberg terminal -- we add the intelligence layer.

**Q: 为什么只做 bonding curve 代币？**
A: Bonding curves are where the signal-to-noise problem is worst. Hundreds of new tokens daily, most are garbage. That's where AI analysis adds the most value. We start narrow and go deep.

**Q: 你们的用户是谁？**
A: DeFi traders who are active on bonding curve launchpads and want data-driven decision-making instead of vibes and FOMO. Especially people who trade on RobinPump on Base.

---

### 技术类

**Q: AI 评分怎么工作的？**
A: We compute real on-chain metrics -- holder concentration, creator sell ratio, volume momentum, buy/sell ratio, curve progress. Then we send that data with token metadata to GPT-4o. It returns a structured score validated by a Zod schema. Temperature 0.3 for consistency.

**Q: 评分准确吗？**
A: We don't claim the AI is always right. What we do is show the breakdown -- three sub-scores, individual risk flags, comparable projects. Users see the reasoning, not just a number. The AI is a decision aid, not an oracle.

**Q: 为什么没有后端？**
A: Three reasons. First, speed -- no server round-trips for data that's already public on-chain. Second, trust -- users don't send data through our servers. Third, cost -- no infrastructure to maintain or scale.

**Q: API key 不是暴露在前端吗？**
A: Yes, currently it is. This is a known tradeoff we accepted for the MVP. Moving to Vercel Edge Functions is our week-one priority in the accelerator. The proxy pattern is already in the code, we just need to move the key server-side.

**Q: 为什么用 Zod schema 校验 AI 返回？**
A: LLMs sometimes return malformed JSON or unexpected fields. Zod validation ensures every AI response matches our expected structure before it hits the UI. If validation fails, we fall back to demo data instead of crashing.

**Q: 支持哪些钱包？**
A: MetaMask currently. The architecture uses ethers.js BrowserProvider, so any EIP-1193 compatible wallet can work with minimal changes.

---

### 智能合约类

**Q: 智能合约做了什么？**
A: RobinLensRouter adds three things on top of the raw bonding curve: slippage protection (revert if you get fewer tokens than expected), deadline validation (transactions expire after 5 minutes), and batch buying (buy multiple tokens in one transaction from AI recommendations).

**Q: 合约审计了吗？**
A: We have a full Foundry test suite covering edge cases -- zero values, expired deadlines, slippage failures, batch atomicity. Professional audit is a priority before mainnet deployment.

**Q: 部署在哪里？**
A: Base Sepolia testnet right now. Address: `0xde8daf9599366b2ef8ae245bf574808844aa5f8a`, verified on BaseScan. Mainnet deployment is week-one of the accelerator.

**Q: 批量买入是原子操作吗？**
A: The multiBuy function is designed to be fault-tolerant -- if one token buy fails, the others still execute and unused ETH is refunded to the user.

---

### 商业类

**Q: 怎么赚钱？**
A: Two paths. First, trading fees through the router contract -- we can add a small fee on each trade routed through RobinLensRouter. Second, premium AI tiers -- deeper analysis, more data sources, faster refresh rates, portfolio tracking.

**Q: 市场有多大？**
A: The bonding curve launchpad space is growing fast. RobinPump on Base, pump.fun on Solana, friend.tech was a precursor. Every new launchpad creates the same problem -- information overload with no analysis tools. We solve that.

**Q: 有竞争对手吗？**
A: Dextools and DEXScreener show charts but don't score or recommend. BubbleMaps shows holder visualization but no trading. We combine analysis, ranking, and execution in one product. Nobody else does all three for bonding curve tokens specifically.

**Q: 目前有用户吗？**
A: We're at MVP stage, deployed on Vercel. The accelerator period is about going from working product to public launch and acquiring early users.

---

### 路线图类

**Q: Accelerator 两周打算做什么？**
A: Week one: mainnet deployment, move API keys server-side, add real-time WebSocket updates. Week two: portfolio tracking, social signals, public launch with documentation.

**Q: 长期愿景是什么？**
A: Become the default intelligence layer for bonding curve tokens across all chains. Start with Base and RobinPump, expand to other launchpads and networks. Every bonding curve platform needs what we built.

**Q: 会支持其他链吗？**
A: Yes. The architecture is chain-agnostic. We need a subgraph for data and bonding curve contracts to interact with. Arbitrum and Optimism are natural next steps.

---

### 难题类（这些问题要小心回答）

**Q: OpenAI 调用费用怎么控制？**
A: Single analysis is one API call per token. Batch recommendations is one call for all fifty tokens. We cache results in localStorage for 15 minutes. The cost per analysis is fractions of a cent. At scale, the premium tier revenue covers AI costs many times over.

**Q: 如果 bonding curve 平台关了怎么办？**
A: We're not dependent on one platform. The analysis and scoring logic works with any bonding curve that exposes data through a subgraph. If RobinPump shuts down, we point at the next one.

**Q: 纯前端怎么保护 API key？**
A: Short-term: proxy through Vercel rewrites (already implemented). Medium-term: Vercel Edge Functions with server-side key storage (week-one accelerator task). The pattern is solved, just needs migration.

**Q: 用户为什么要信你的 AI 而不是自己分析？**
A: They don't have to trust it. We show every metric, every sub-score, every risk flag. The AI aggregates and explains -- the user decides. We're transparent about inputs and outputs. If someone wants to ignore the score and just use our charts and data, that works too.
