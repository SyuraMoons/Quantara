# Quantara -- EasyA Kickstart Accelerator 完整双语文档

> 会议：2026 年 2 月 23 日周一 11:00 GMT
> Meeting: Monday Feb 23, 2026 11:00 GMT
>
> Google Meet: meet.google.com/oxi-usdg-bpk
> 组织者 / Organizer: Philip Kwok (phil@easya.io)

---

# 第一部分：一句话介绍 / Part 1: One-Liner

**中文：**
Quantara 是 Base 链上的 AI 分析交易平台，实时给 bonding curve 代币打分，带智能合约保护地交易。

**English:**
Quantara is an AI-powered analytics and trading layer for Base that scores bonding curve tokens in real time and lets you trade them with smart contract protection.

**中文（短版，适合社媒/自我介绍）：**
Base 链上的 AI 代币评分。分析、排名、交易——全在浏览器里。

**English (short, for social / intro):**
AI scoring for bonding curve tokens on Base. Analyze, rank, trade -- all in your browser.

---

# 第二部分：项目关键数据 / Part 2: Key Facts

| 指标 / Metric | 数据 / Data |
|---------------|-------------|
| 链 / Chain | Base（Sepolia 测试网 + Mainnet 数据源） |
| 技术栈 / Stack | React 19 + TypeScript + Solidity + GPT-4o |
| 智能合约 / Contract | RobinLensRouter，已部署 Base Sepolia / deployed on Base Sepolia |
| 数据源 / Data Sources | 6 个 / 6 total（Goldsky, OpenAI, IPFS, Base RPC, CoinGecko, News API） |
| 前端部署 / Frontend | Vercel（生产环境 / production） |
| 后端 / Backend | 无 / None（纯浏览器运行 / runs entirely in browser） |
| 状态 / Status | Working MVP，所有核心功能已实现 / all core features implemented |
| 代码规模 / Codebase | 4 页面、13 组件、7 hooks、14 库模块、1 智能合约 |
| GitHub | https://github.com/SyuraMoons/RobinLens |
| 合约地址 / Contract | [`0xde8daf...c00`](https://sepolia.basescan.org/address/0xde8daf9599366b2ef8ae245bf574808844aa5f8a) |

---

# 第三部分：完整 Pitch / Part 3: Full Pitch

---

## 3.1 电梯演讲 / Elevator Pitch

**中文：**
每天有几百个代币在 bonding curve 上发射，99% 是垃圾。Quantara 是 Base 链上的 AI 分析层——实时给每个代币打分，告诉你哪些值得关注，并且可以直接带滑点保护交易——全在浏览器里运行，没有后端，不用注册。

**English:**
Hundreds of tokens launch on bonding curves every day. 99% are noise. Quantara is an AI-powered analytics layer for Base that scores every token in real time, tells you which ones are worth attention, and lets you trade them with slippage protection -- all from your browser, no backend, no sign-up.

---

## 3.2 痛点 / The Problem

**中文：**
Base 链上的 bonding curve 发射台（如 RobinPump）每天产生大量新代币，交易者面临三个问题：

- **信息过载** -- 随时有 50+ 活跃代币，每个都有链上数据，但没人有时间逐个分析
- **没有信号** -- 持仓集中度、创建者是否跑路、交易量趋势，这些数据都是公开的，但肉眼看不出来
- **执行风险** -- 在 bonding curve 上买 meme 币意味着高滑点、没保护、一次只能买一个

结果：交易者要么 FOMO 冲进骗局，要么错过真正的早期机会。

**English:**
Bonding curve launchpads like RobinPump on Base create a firehose of new tokens. Traders face:

- **Information overload** -- 50+ active tokens at any time, each with on-chain data nobody has time to analyze
- **No signal** -- holder concentration, creator behavior, volume patterns are all public but impossible to read at a glance
- **Execution risk** -- buying meme tokens on bonding curves means high slippage, no protection, and manual one-at-a-time transactions

The result: traders either FOMO into scams or miss genuine early-stage opportunities.

---

## 3.3 解决方案 / The Solution

**中文：**
Quantara 是一个运行在浏览器里的 DeFi 分析 + 交易平台，做三件事：

**English:**
Quantara is a browser-based DeFi analytics and trading platform for Base. We do three things:

---

### 3.3.1 用 AI 给每个代币打分 / Score every token with AI

**中文：**
我们拉取真实的链上数据（持仓分布、创建者卖出行为、交易量动量、曲线进度），喂给 LLM。每个代币得到一个 RobinScore（0-100），拆成三个维度：

- **创意质量** -- 这个项目概念靠谱吗？还是随便起了个名字？
- **链上健康度** -- 持仓集中吗？创建者跑了吗？
- **曲线位置** -- bonding curve 走到哪了？势头在涨吗？

附带风险标志、可比项目、以及明确的"买入/持有/回避"建议。

**English:**
We pull real on-chain data (holder distribution, creator sell behavior, volume momentum, curve progress) and feed it to an LLM. Every token gets a RobinScore (0-100) broken into three dimensions:

- **Idea Quality** -- Is the concept viable or just a joke name?
- **On-Chain Health** -- How concentrated are holders? Did the creator dump?
- **Curve Position** -- Where is it on the bonding curve? Is momentum building?

Plus risk flags, comparable projects, and a clear buy/hold/avoid recommendation.

---

### 3.3.2 多数据源批量排名 / Batch-rank top tokens

**中文：**
推荐引擎融合四类信号：

| 数据源 | 告诉我们什么 |
|--------|-------------|
| 链上指标 | 持仓集中度、创建者行为、买卖比 |
| 技术指标 | 价格动量、交易速度、趋势方向 |
| 市场环境 | BTC/ETH 主导率、全球情绪（CoinGecko） |
| 新闻情绪 | 加密新闻相关度（News API） |

一键操作：分析 50 个代币，排出 Top 10，解释每个为什么值得关注。

**English:**
Our recommendation engine fuses four signal sources:

| Source | What it tells us |
|--------|-----------------|
| On-chain metrics | Holder concentration, creator behavior, buy/sell ratio |
| Technical indicators | Price momentum, trade velocity, trend direction |
| Market context | BTC/ETH dominance, global sentiment (via CoinGecko) |
| News sentiment | Crypto headlines relevance (via News API) |

One click: analyze 50 tokens, rank the top 10, explain why each stands out.

---

### 3.3.3 带保护的交易 / Trade with protection

**中文：**
我们的智能合约路由器（RobinLensRouter，部署在 Base 上）提供：

- **滑点保护** -- 设好容忍度，超了就回滚
- **过期验证** -- 交易 5 分钟后自动失效
- **批量买入** -- AI 推荐的代币一笔交易全买

**English:**
Our smart contract router (RobinLensRouter on Base) adds:

- **Slippage protection** -- set your tolerance, revert if exceeded
- **Deadline validation** -- transactions expire after 5 minutes
- **Batch buy** -- buy all AI-recommended tokens in a single transaction

---

## 3.4 已经建好的东西 / What We Have Built

**中文：**
以下不是设计稿，全部已实现并可运行：

**English:**
This is not a mockup. Everything below is live and functional:

| 功能 / Feature | 状态 / Status |
|----------------|---------------|
| 实时代币列表（Goldsky Subgraph）/ Token feed with real-time data | 已上线 / Live |
| 单个代币 AI 评分（GPT-4o / DeepSeek）/ AI scoring per token | 已上线 / Live |
| 批量 AI 推荐（可配置数据源）/ Batch AI recommendations | 已上线 / Live |
| 价格 K 线图 / Price charts (TradingView) | 已上线 / Live |
| MetaMask 钱包买卖 / Buy/sell with MetaMask | 已上线 / Live |
| 智能合约路由器 / Smart contract router | 已部署 / Deployed (Base Sepolia) |
| AI 推荐批量买入 / Batch buy from AI recommendations | 已部署 / Deployed (Base Sepolia) |
| 交易者盈亏排行榜 / Trader leaderboard by PnL | 已上线 / Live |
| 上下文感知 AI 聊天机器人 / Context-aware AI chatbot | 已上线 / Live |
| Vercel 生产环境 / Vercel production deployment | 已上线 / Live |

---

## 3.5 架构 / Architecture

**中文：**
```
Goldsky Subgraph          CoinGecko / News API
   （链上数据）                （市场环境）
        |                         |
        v                         v
+------------------------------------------+
|      React 前端（运行在浏览器里）           |
|   零后端。零服务器。零托管。               |
|   所有逻辑在客户端运行。                   |
+------------------------------------------+
        |                    |
        v                    v
   OpenAI / DeepSeek    MetaMask + Base RPC
   （AI 评分）               |
                             v
                   RobinLensRouter（Base）
                   - 滑点保护
                   - 批量交易
                   - 过期验证
```

**English:**
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

## 3.6 技术栈 / Tech Stack

| 层级 / Layer | 技术 / Technology |
|--------------|-------------------|
| 前端 / Frontend | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4 |
| 图表 / Charts | TradingView Lightweight Charts |
| Web3 | ethers.js 6, MetaMask |
| AI | OpenAI GPT-4o / DeepSeek, Zod v4 schema validation |
| 合约 / Contracts | Solidity 0.8.24, Foundry (full test coverage) |
| 数据 / Data | Goldsky Subgraph (GraphQL), CoinGecko, News API |
| 部署 / Deployment | Vercel (frontend), Base Sepolia (contracts) |

---

## 3.7 凭什么不一样 / What Makes This Different

---

**中文：**
1. **AI 是结构性的，不是套壳。** 我们计算真实的链上指标（持仓集中度、创建者抛售率、交易量动量），每个 AI 返回都用 Zod schema 校验。不是给 ChatGPT 套个前端。

**English:**
1. **AI is structural, not cosmetic.** We compute real on-chain metrics (holder concentration, creator dump ratio, volume momentum) and validate every AI response with Zod schemas. Not a ChatGPT wrapper.

---

**中文：**
2. **多源信号融合。** 推荐结果综合链上数据 + 技术分析 + 市场环境 + 新闻情绪。用户可以选择开启哪些数据源。

**English:**
2. **Multi-source signal fusion.** Recommendations combine on-chain data + technical analysis + market context + news sentiment. Users choose which sources to enable.

---

**中文：**
3. **零后端。** 没有需要维护的服务器，没有需要保护的后端 API，没有托管。整个应用跑在浏览器里。这是特性不是限制——用户数据不经过我们的服务器。

**English:**
3. **Zero backend.** No servers to scale, no API keys to protect server-side, no custody. The entire app runs in the browser. This is a feature, not a limitation -- it means users own their data and nothing goes through our servers.

---

**中文：**
4. **智能合约路由器。** 不只是前端——我们写了并部署了一个 Solidity 路由合约，提供滑点保护和批量交易。在 BaseScan 可验证，Foundry 测试通过。

**English:**
4. **Smart contract router.** Not just a frontend -- we wrote and deployed a Solidity router that adds slippage protection and batch trading. Verified on BaseScan, tested with Foundry.

---

**中文：**
5. **优雅降级。** 没有 OpenAI key 可以用演示模式，没有 CoinGecko 跳过市场数据，没有 News API 跳过新闻。应用永远不会崩。

**English:**
5. **Graceful degradation.** Works without OpenAI key (demo mode), without CoinGecko (skips market context), without News API (skips news). The app never breaks.

---

## 3.8 智能合约 / Smart Contract

**中文：**
RobinLensRouter 部署在 Base Sepolia：[`0xde8daf9599366b2ef8ae245bf574808844aa5f8a`](https://sepolia.basescan.org/address/0xde8daf9599366b2ef8ae245bf574808844aa5f8a)

**English:**
RobinLensRouter deployed on Base Sepolia: [`0xde8daf9599366b2ef8ae245bf574808844aa5f8a`](https://sepolia.basescan.org/address/0xde8daf9599366b2ef8ae245bf574808844aa5f8a)

| 函数 / Function | 说明 / Description |
|-----------------|-------------------|
| `buyToken(curve, minTokensOut, deadline)` | 带滑点保护的买入 / Buy with slippage protection |
| `sellToken(curve, token, amount, minEthOut, deadline)` | 卖回 bonding curve / Sell back to bonding curve |
| `multiBuy(curves[], ethAmounts[], minTokensOut[], deadline)` | AI 推荐批量买入 / Batch buy AI recommendations |
| `quoteBuy(curve, ethAmount)` | 执行前获取报价 / Get price quote before execution |

---

## 3.9 路线图 / Roadmap

---

### 第一周：生产就绪 / Week 1: Production-Ready

**中文：**
- 将 RobinLensRouter 部署到 Base 主网
- 把 API key 迁移到服务端（Vercel Edge Functions），消除客户端暴露
- 加 WebSocket 支持实时交易更新（替换轮询）
- UI 打磨，准备公开发布

**English:**
- Deploy RobinLensRouter to Base mainnet
- Move API keys server-side (Vercel Edge Functions) to eliminate client-side exposure
- Add WebSocket support for real-time trade updates (replacing polling)
- Polish UI for public launch

---

### 第二周：增长功能 / Week 2: Growth Features

**中文：**
- 持仓追踪——跨会话的仓位和盈亏记录
- 社交信号——Twitter/Farcaster 上的热门代币
- 多链探索——扩展到 Arbitrum、Optimism
- 正式公开发布 + 文档

**English:**
- Portfolio tracking -- persistent positions and PnL across sessions
- Social signals integration -- trending tokens from Twitter/Farcaster
- Multi-chain exploration -- extend beyond Base (Arbitrum, Optimism)
- Public launch with documentation

---

### Accelerator 之后 / Post-Accelerator

**中文：**
- 通过路由合约收取交易手续费（收入模型）
- 高级 AI 层级（更深分析、更多数据源、更快刷新）
- 移动端适配 PWA
- 协议合作（扩展到 RobinPump 以外的 bonding curve 平台）

**English:**
- Trading fee revenue model through router contract
- Premium AI tiers (deeper analysis, more data sources, faster refresh)
- Mobile-responsive PWA
- Protocol partnerships (extend to other bonding curve platforms beyond RobinPump)

---

# 第四部分：演讲稿 / Part 4: Speech Script

> 5-7 分钟，之后 Q&A
> 【方括号内容】是舞台指示 / stage directions，不念出来

---

## 4.1 开场 / Opening (~30s)

**中文：**
大家好，我是 [你的名字]，我在做 Quantara。

我一直遇到一个问题：每天有几百个新代币在 Base 的 bonding curve 上发射。大多数是噪音——随便起的名字、零牵引力、可能就是等着跑路的。但有些是真的。而现在，没有好办法分辨。

**English:**
Hi everyone, I'm [your name], and I'm building Quantara.

Here's the problem I kept running into: every day, hundreds of new tokens launch on bonding curves on Base. Most of them are noise -- meme names, zero traction, maybe a rug pull waiting to happen. But some of them are real. And right now, there's no good way to tell the difference.

---

## 4.2 痛点 / Problem (~45s)

**中文：**
如果你用过 bonding curve 发射台比如 RobinPump，你知道那个体验。你打开页面，看到五十个代币，完全不知道哪个值得花时间。

数据就在那里——全在链上。持仓集中度、创建者有没有在卖、交易量趋势、bonding curve 走到哪了。但没人有时间把所有数据拉出来、分析完、在机会消失前做出决定。

所以会怎样？交易者要么 FOMO 冲进一个看起来火的代币然后亏钱，要么坐在场外错过真正有潜力的早期代币。

**English:**
If you've ever used a bonding curve launchpad like RobinPump, you know the experience. You open the page, you see fifty tokens, and you have no idea which ones are worth your time.

The data is there -- it's all on-chain. Holder concentration, whether the creator has been selling, volume trends, how far the bonding curve has progressed. But nobody has time to pull all that data, analyze it, and make a decision before the opportunity is gone.

So what happens? Traders either FOMO into something that looks hot and lose money, or they sit on the sidelines and miss the early-stage tokens that actually had potential.

---

## 4.3 方案 / Solution (~1min)

**中文：**
Quantara 解决这个问题。我们构建了一个 Base 链上的 AI 分析和交易平台，做三件事。

**第一，我们给每个代币打分。** 我们拉取真实的链上数据——持仓分布、创建者卖出行为、交易量动量、bonding curve 进度——喂给 LLM。每个代币得到一个 RobinScore，从 0 到 100，拆成三个维度：创意质量、链上健康度、曲线位置。加上风险标志和明确的买入、持有或回避建议。

**第二，我们排名最优代币。** 我们的推荐引擎综合四个数据源——链上指标、技术指标、CoinGecko 的市场环境、新闻情绪。一键操作，分析五十个代币，返回排名 Top 10 并逐个解释。

**第三，我们让你直接交易。** 我们写了并部署了一个 Base 上的智能合约路由器，加上滑点保护、过期验证和批量买入。你可以一笔交易买下 AI 推荐的全部十个代币。

**English:**
Quantara fixes this. We built an AI-powered analytics and trading platform for Base that does three things.

**First, we score every token.** We pull real on-chain data -- holder distribution, creator sell behavior, volume momentum, bonding curve progress -- and feed it into an LLM. Every token gets a RobinScore from 0 to 100, broken into three dimensions: idea quality, on-chain health, and curve position. Plus risk flags and a clear buy, hold, or avoid recommendation.

**Second, we rank the top tokens.** Our recommendation engine combines four data sources -- on-chain metrics, technical indicators, market context from CoinGecko, and news sentiment. One click, and it analyzes fifty tokens and returns a ranked top ten with explanations for each.

**Third, we let you trade directly.** We wrote and deployed a smart contract router on Base that adds slippage protection, deadline validation, and batch buying. You can buy all ten AI-recommended tokens in a single transaction.

---

## 4.4 产品展示 / Demo (~1.5min)

**中文：**
【如果是 live demo 就切屏幕共享；如果是纯演讲就口述】

让我展示一下实际的样子。

这是我们的代币列表——来自 Goldsky subgraph 的实时数据，每十秒刷新。你可以按交易量排序，筛选活跃或已毕业的代币，按名称搜索。

【点进一个代币】

点进一个代币后，你看到完整的画面。用 TradingView 库做的价格图表。最近交易记录。一个进度条展示 bonding curve 离毕业有多近。持仓分布饼图。还有 AI 分析卡片——RobinScore、三个子分数、风险标志、推荐操作。

【切到推荐页】

这是推荐页面。你选择数据源——链上、技术、市场环境、新闻。点分析。它处理五十个代币，在浏览器里本地计算指标，发一个 API 调用给 LLM，返回排名 Top 10 加推理过程。

【如果有时间展示交易】

如果我连接钱包，就可以在这里直接交易。输入 ETH 数量，看报价，设滑点容忍度，执行——全部通过我们的智能合约路由，内置保护。

**English:**
【Screen share for live demo; narrate if presentation only】

Let me show you what this looks like in practice.

This is our token feed -- live data from Goldsky's subgraph, refreshing every ten seconds. You can sort by volume, filter by active or graduated tokens, search by name.

【Click into a token】

When you click into a token, you get the full picture. Price chart built with TradingView's library. Recent trade history. A progress bar showing how close the bonding curve is to graduation. Holder distribution as a pie chart. And the AI analysis card -- here's the RobinScore, the three sub-scores, the risk flags, and the recommended action.

【Switch to recommendations page】

This is the recommendations page. You choose your data sources -- on-chain, technical, market context, news. Hit analyze. It processes fifty tokens, computes metrics locally in your browser, sends one API call to the LLM, and returns the top ten ranked with reasoning.

【If time, show trading】

And if I connect my wallet, I can trade right here. Enter an ETH amount, see the quote, set my slippage tolerance, and execute -- all routed through our smart contract with protection built in.

---

## 4.5 技术架构 / Architecture (~30s)

**中文：**
我想强调的是，这是一个零后端的应用。整个应用跑在你的浏览器里。链上数据来自 Goldsky 的 subgraph。AI 评分走 OpenAI 或 DeepSeek。交易通过 MetaMask 到我们在 Base 上的路由合约。没有需要维护的服务器，没有用户数据经过我们，没有托管。

这不是限制——是设计选择。意味着我们能快速发布，不需要基础设施成本就能扩展，用户不需要信任我们。

**English:**
The thing I want to emphasize is that this is a zero-backend application. The entire app runs in your browser. On-chain data comes from Goldsky's subgraph. AI scoring goes through OpenAI or DeepSeek. Trading goes through MetaMask to our router contract on Base. There are no servers to maintain, no user data passing through us, no custody.

This isn't a limitation -- it's a design choice. It means we can ship fast, scale without infrastructure costs, and users don't have to trust us with anything.

---

## 4.6 已完成 / What's Built (~30s)

**中文：**
我想说清楚——这不是概念或设计稿。我们有一个部署在 Vercel 上的可用 MVP。

四个页面。十三个组件。一个完整的智能合约，有 Foundry 测试，部署在 Base Sepolia。AI 评分用 Zod schema 校验每个返回。六个集成的数据源。今天全部能用。

**English:**
I want to be clear -- this is not a concept or a mockup. We have a working MVP deployed on Vercel right now.

Four pages. Thirteen components. A full smart contract with Foundry tests deployed on Base Sepolia. AI scoring that validates every response with Zod schemas. Six integrated data sources. And it all works today.

---

## 4.7 差异化 / What's Different (~30s)

**中文：**
你可能会问，这和 Dextools 或 DEXScreener 有什么不同？

那些工具给你看图表和交易记录。我们给代币打分，解释为什么，让你对结果采取行动。是不同的产品品类——我们不是看图工具，我们是决策引擎。

AI 不是装饰。我们用链上数据计算真实指标，结构性地校验每个 AI 返回。这不是套了个加密皮肤的 ChatGPT。

**English:**
You might ask, how is this different from Dextools or DEXScreener?

Those tools show you charts and trade history. We score tokens, explain why, and let you act on it. It's a different product category -- we're not a chart viewer, we're a decision engine.

And the AI isn't cosmetic. We compute real metrics from on-chain data and validate every AI response structurally. This isn't a ChatGPT wrapper with a crypto skin.

---

## 4.8 路线图 / Roadmap (~30s)

**中文：**
这次 accelerator 的两周里，我们的计划很直接。

第一周：把路由器部署到 Base 主网，把 API key 迁移到服务端不再暴露在浏览器里，加上实时更新。

第二周：持仓追踪、社交信号集成、正式公开发布。

Accelerator 之后，收入模型很清晰——通过路由合约收交易手续费，加上给专业用户的付费 AI 层级。

**English:**
For the two weeks of this accelerator, our plan is straightforward.

Week one: deploy the router to Base mainnet, move API keys server-side so they're not exposed in the browser, and add real-time updates.

Week two: portfolio tracking, social signal integration, and public launch.

After the accelerator, the revenue model is clear -- trading fees through the router contract, and premium AI tiers for power users.

---

## 4.9 结尾 / Closing (~15s)

**中文：**
Quantara 为 bonding curve 带来智能。我们把噪音变成信号，让交易者用数据决策，而不是赌博。

谢谢。欢迎提问。

**English:**
Quantara brings intelligence to bonding curves. We turn noise into signal so traders can make informed decisions instead of gambling.

Thanks. Happy to take any questions.

---

# 第五部分：视频脚本 / Part 5: Video Script

> 给 EasyA 提交的视频，约 2 分钟
> For EasyA submission, ~2 minutes

---

## 场景 1：痛点 / Scene 1: The Problem (15s)

**中文：**
"每天几百个代币在 bonding curve 发射，大多数是噪音。交易者没有办法区分信号和骗局。"

**English:**
"Every day, hundreds of tokens launch on bonding curves. Most are noise. Traders have no way to separate signal from scam."

---

## 场景 2：Quantara 做什么 / Scene 2: What Quantara Does (20s)

**中文：**
"Quantara 用真实链上数据和 AI 给每个代币打分。RobinScore 从 0 到 100，告诉你创意质量、链上健康度、曲线位置——带风险标志和明确建议。"

**English:**
"Quantara scores every token using real on-chain data and AI. A RobinScore from 0 to 100 tells you idea quality, on-chain health, and curve position -- with risk flags and a clear recommendation."

---

## 场景 3：Live Demo / Scene 3: Live Demo (45s)

**中文：**
- 展示代币列表，实时数据
- 点进一个代币——展示 AI 分析、价格图表、持仓分布
- 展示 AI 推荐页——切换数据源，运行分析，看 Top 10 排名
- 连接钱包，执行一笔带滑点保护的交易

**English:**
- Show token feed with live data
- Click into a token -- show AI analysis, price chart, holder distribution
- Show AI recommendations page -- toggle data sources, run analysis, see top 10 ranked
- Connect wallet, execute a trade with slippage protection

---

## 场景 4：技术原理 / Scene 4: How It Works (15s)

**中文：**
"纯浏览器应用，没有后端，没有托管。链上数据来自 Goldsky，AI 来自 GPT-4o，交易通过我们部署在 Base 上的智能合约路由器，带滑点保护和批量买入。"

**English:**
"Pure browser app. No backend, no custody. On-chain data from Goldsky, AI from GPT-4o, trading through our smart contract router on Base with slippage protection and batch buy."

---

## 场景 5：下一步 / Scene 5: What's Next (15s)

**中文：**
"主网部署、持仓追踪、社交信号，以及通过交易手续费的收入模型。我们在构建 bonding curve 的智能层。"

**English:**
"Mainnet deployment, portfolio tracking, social signals, and a revenue model through trading fees. We're building the intelligence layer for bonding curves."

---

# 第六部分：Q&A 完整版 / Part 6: Full Q&A

---

## 产品类 / Product

---

**Q: Quantara 是什么？ / What is Quantara?**

**中文：**
一个 Base 链上的 AI 分析和交易平台，面向 bonding curve 代币。我们用真实链上数据给每个代币打分，排出最佳选择，让你带滑点保护地交易——全在浏览器里。

**English:**
An AI analytics and trading platform for bonding curve tokens on Base. We score every token with real on-chain data, rank the top picks, and let you trade them with slippage protection -- all from your browser.

---

**Q: 和 Dextools / DEXScreener 有什么区别？ / How is this different from Dextools / DEXScreener?**

**中文：**
它们展示图表和交易记录。我们给代币打分，解释为什么值得关注，让你批量交易推荐的结果。就像股票筛选器和彭博终端的区别——我们加了智能层。

**English:**
They show charts and trades. We score tokens, explain why they're worth attention, and let you batch-trade the recommendations. It's like the difference between a stock screener and a Bloomberg terminal -- we add the intelligence layer.

---

**Q: 为什么只做 bonding curve 代币？ / Why only bonding curve tokens?**

**中文：**
Bonding curve 是信噪比最差的地方。每天几百个新代币，大多数是垃圾。AI 分析在这里价值最大。我们先做窄做深。

**English:**
Bonding curves are where the signal-to-noise problem is worst. Hundreds of new tokens daily, most are garbage. That's where AI analysis adds the most value. We start narrow and go deep.

---

**Q: 你们的用户是谁？ / Who are your users?**

**中文：**
活跃在 bonding curve 发射台上的 DeFi 交易者，想要数据驱动的决策而不是跟风和 FOMO。特别是在 Base 上用 RobinPump 的人。

**English:**
DeFi traders who are active on bonding curve launchpads and want data-driven decision-making instead of vibes and FOMO. Especially people who trade on RobinPump on Base.

---

## 技术类 / Technical

---

**Q: AI 评分怎么工作的？ / How does the AI scoring work?**

**中文：**
我们计算真实的链上指标——持仓集中度、创建者卖出比例、交易量动量、买卖比、曲线进度。然后把数据和代币元数据一起发给 GPT-4o。返回一个用 Zod schema 校验的结构化评分。温度 0.3 保证一致性。

**English:**
We compute real on-chain metrics -- holder concentration, creator sell ratio, volume momentum, buy/sell ratio, curve progress. Then we send that data with token metadata to GPT-4o. It returns a structured score validated by a Zod schema. Temperature 0.3 for consistency.

---

**Q: 评分准确吗？ / How accurate is the scoring?**

**中文：**
我们不声称 AI 总是对的。我们做的是展示分项——三个子分数、每个风险标志、可比项目。用户看到推理过程，不只是一个数字。AI 是辅助决策工具，不是神谕。

**English:**
We don't claim the AI is always right. What we do is show the breakdown -- three sub-scores, individual risk flags, comparable projects. Users see the reasoning, not just a number. The AI is a decision aid, not an oracle.

---

**Q: 为什么没有后端？ / Why no backend?**

**中文：**
三个原因。第一，速度——链上数据本来就是公开的，不需要绕一圈服务器。第二，信任——用户数据不经过我们的服务器。第三，成本——没有需要维护或扩展的基础设施。

**English:**
Three reasons. First, speed -- no server round-trips for data that's already public on-chain. Second, trust -- users don't send data through our servers. Third, cost -- no infrastructure to maintain or scale.

---

**Q: API key 不是暴露在前端吗？ / Isn't the API key exposed in the frontend?**

**中文：**
是的，目前是。这是 MVP 阶段接受的权衡。迁移到 Vercel Edge Functions 是 accelerator 第一周的优先事项。代理模式已经在代码里了，只需要把 key 移到服务端。

**English:**
Yes, currently it is. This is a known tradeoff we accepted for the MVP. Moving to Vercel Edge Functions is our week-one priority in the accelerator. The proxy pattern is already in the code, we just need to move the key server-side.

---

**Q: 为什么用 Zod schema 校验？ / Why Zod schema validation?**

**中文：**
LLM 有时候会返回格式错误的 JSON 或意料之外的字段。Zod 校验保证每个 AI 返回在到达 UI 之前都符合预期结构。校验失败就回退到演示数据，而不是崩溃。

**English:**
LLMs sometimes return malformed JSON or unexpected fields. Zod validation ensures every AI response matches our expected structure before it hits the UI. If validation fails, we fall back to demo data instead of crashing.

---

**Q: 支持哪些钱包？ / Which wallets are supported?**

**中文：**
目前是 MetaMask。架构用的是 ethers.js BrowserProvider，任何兼容 EIP-1193 的钱包只需要很小的改动就能支持。

**English:**
MetaMask currently. The architecture uses ethers.js BrowserProvider, so any EIP-1193 compatible wallet can work with minimal changes.

---

## 智能合约类 / Smart Contract

---

**Q: 智能合约做了什么？ / What does the smart contract do?**

**中文：**
RobinLensRouter 在原始 bonding curve 上加了三样东西：滑点保护（拿到的代币少于预期就回滚）、过期验证（交易 5 分钟后失效）、批量买入（AI 推荐的代币一笔交易全买）。

**English:**
RobinLensRouter adds three things on top of the raw bonding curve: slippage protection (revert if you get fewer tokens than expected), deadline validation (transactions expire after 5 minutes), and batch buying (buy multiple tokens in one transaction from AI recommendations).

---

**Q: 合约审计了吗？ / Is the contract audited?**

**中文：**
有完整的 Foundry 测试覆盖边界情况——零值、过期 deadline、滑点失败、批量原子性。正式审计是主网部署前的优先事项。

**English:**
We have a full Foundry test suite covering edge cases -- zero values, expired deadlines, slippage failures, batch atomicity. Professional audit is a priority before mainnet deployment.

---

**Q: 部署在哪里？ / Where is it deployed?**

**中文：**
现在在 Base Sepolia 测试网。地址：`0xde8daf9599366b2ef8ae245bf574808844aa5f8a`，在 BaseScan 上已验证。主网部署是 accelerator 第一周的任务。

**English:**
Base Sepolia testnet right now. Address: `0xde8daf9599366b2ef8ae245bf574808844aa5f8a`, verified on BaseScan. Mainnet deployment is week-one of the accelerator.

---

**Q: 批量买入是原子操作吗？ / Is the batch buy atomic?**

**中文：**
multiBuy 函数设计为容错的——如果单个代币买入失败，其他的照常执行，未使用的 ETH 退还给用户。

**English:**
The multiBuy function is designed to be fault-tolerant -- if one token buy fails, the others still execute and unused ETH is refunded to the user.

---

## 商业类 / Business

---

**Q: 怎么赚钱？ / How do you make money?**

**中文：**
两条路。第一，通过路由合约收交易手续费——每笔通过 RobinLensRouter 的交易可以加一个小费用。第二，高级 AI 层级——更深的分析、更多数据源、更快的刷新、持仓追踪。

**English:**
Two paths. First, trading fees through the router contract -- we can add a small fee on each trade routed through RobinLensRouter. Second, premium AI tiers -- deeper analysis, more data sources, faster refresh rates, portfolio tracking.

---

**Q: 市场有多大？ / How big is the market?**

**中文：**
Bonding curve 发射台赛道在快速增长。Base 上的 RobinPump，Solana 上的 pump.fun，friend.tech 是先驱。每个新发射台都会产生同样的问题——信息过载没有分析工具。我们解决这个问题。

**English:**
The bonding curve launchpad space is growing fast. RobinPump on Base, pump.fun on Solana, friend.tech was a precursor. Every new launchpad creates the same problem -- information overload with no analysis tools. We solve that.

---

**Q: 有竞争对手吗？ / Any competitors?**

**中文：**
Dextools 和 DEXScreener 展示图表但不打分也不推荐。BubbleMaps 展示持仓可视化但不能交易。我们把分析、排名和执行整合在一个产品里。没有其他人专门为 bonding curve 代币做这三件事。

**English:**
Dextools and DEXScreener show charts but don't score or recommend. BubbleMaps shows holder visualization but no trading. We combine analysis, ranking, and execution in one product. Nobody else does all three for bonding curve tokens specifically.

---

**Q: 目前有用户吗？ / Do you have users?**

**中文：**
我们处于 MVP 阶段，部署在 Vercel 上。Accelerator 的目标就是从可用产品走到公开发布、获取早期用户。

**English:**
We're at MVP stage, deployed on Vercel. The accelerator period is about going from working product to public launch and acquiring early users.

---

## 路线图类 / Roadmap

---

**Q: Accelerator 两周打算做什么？ / What's the plan for the two weeks?**

**中文：**
第一周：主网部署、API key 迁移服务端、实时 WebSocket 更新。第二周：持仓追踪、社交信号、公开发布加文档。

**English:**
Week one: mainnet deployment, move API keys server-side, add real-time WebSocket updates. Week two: portfolio tracking, social signals, public launch with documentation.

---

**Q: 长期愿景是什么？ / What's the long-term vision?**

**中文：**
成为所有链上 bonding curve 代币的默认智能层。从 Base 和 RobinPump 开始，扩展到其他发射台和网络。每个 bonding curve 平台都需要我们建的东西。

**English:**
Become the default intelligence layer for bonding curve tokens across all chains. Start with Base and RobinPump, expand to other launchpads and networks. Every bonding curve platform needs what we built.

---

**Q: 会支持其他链吗？ / Will you support other chains?**

**中文：**
会。架构是链无关的。我们需要一个 subgraph 获取数据和 bonding curve 合约来交互就行。Arbitrum 和 Optimism 是自然的下一步。

**English:**
Yes. The architecture is chain-agnostic. We need a subgraph for data and bonding curve contracts to interact with. Arbitrum and Optimism are natural next steps.

---

## 难题类 / Hard Questions

---

**Q: OpenAI 调用费用怎么控制？ / How do you manage AI API costs?**

**中文：**
单个分析是每个代币一次 API 调用。批量推荐是五十个代币一次调用。结果在 localStorage 缓存 15 分钟。每次分析的成本是几分钱。规模化后，付费层级的收入远超 AI 成本。

**English:**
Single analysis is one API call per token. Batch recommendations is one call for all fifty tokens. We cache results in localStorage for 15 minutes. The cost per analysis is fractions of a cent. At scale, the premium tier revenue covers AI costs many times over.

---

**Q: 如果 bonding curve 平台关了怎么办？ / What if the launchpad shuts down?**

**中文：**
我们不依赖单一平台。分析和评分逻辑适用于任何通过 subgraph 暴露数据的 bonding curve。如果 RobinPump 关了，我们指向下一个。

**English:**
We're not dependent on one platform. The analysis and scoring logic works with any bonding curve that exposes data through a subgraph. If RobinPump shuts down, we point at the next one.

---

**Q: 纯前端怎么保护 API key？ / How do you protect the API key with no backend?**

**中文：**
短期：通过 Vercel rewrite 代理（已实现）。中期：Vercel Edge Functions 服务端存储 key（accelerator 第一周任务）。方案是现成的，只需要迁移。

**English:**
Short-term: proxy through Vercel rewrites (already implemented). Medium-term: Vercel Edge Functions with server-side key storage (week-one accelerator task). The pattern is solved, just needs migration.

---

**Q: 用户为什么要信你的 AI？ / Why should users trust your AI?**

**中文：**
他们不需要盲目信任。我们展示每个指标、每个子分数、每个风险标志。AI 做汇总和解释——用户做决定。我们对输入和输出是透明的。如果有人想忽略评分只用我们的图表和数据，也完全可以。

**English:**
They don't have to trust it blindly. We show every metric, every sub-score, every risk flag. The AI aggregates and explains -- the user decides. We're transparent about inputs and outputs. If someone wants to ignore the score and just use our charts and data, that works too.

---

**Q: 团队几个人？ / How big is the team?**

**中文：**
【根据实际情况回答】

**English:**
【Answer based on your actual team】

---

## 冷场备用 / If There's a Lull

**中文：**
可以主动说："有一个我特别想听反馈的点是我们的推荐引擎——多数据源的方式是否有共鸣，还是交易者会更偏好一个简单的单一评分视图。"

**English:**
"One thing I'd love feedback on is our recommendation engine -- whether the multi-source approach resonates, or if traders would prefer a simpler single-score view."
