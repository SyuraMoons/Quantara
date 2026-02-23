# Quantara -- EasyA Kickstart 演讲稿

> 场景：Kickoff Meeting，5-7 分钟介绍，之后 Q&A
> 语言：English（实际演讲用）
> 下方【括号内容】是舞台指示，不念出来

---

## Opening（开场 ~30s）

Hi everyone, I'm [你的名字], and I'm building Quantara.

Here's the problem I kept running into: every day, hundreds of new tokens launch on bonding curves on Base. Most of them are noise -- meme names, zero traction, maybe a rug pull waiting to happen. But some of them are real. And right now, there's no good way to tell the difference.

---

## Problem（痛点 ~45s）

If you've ever used a bonding curve launchpad like RobinPump, you know the experience. You open the page, you see fifty tokens, and you have no idea which ones are worth your time.

The data is there -- it's all on-chain. Holder concentration, whether the creator has been selling, volume trends, how far the bonding curve has progressed. But nobody has time to pull all that data, analyze it, and make a decision before the opportunity is gone.

So what happens? Traders either FOMO into something that looks hot and lose money, or they sit on the sidelines and miss the early-stage tokens that actually had potential.

---

## Solution（解决方案 ~1min）

Quantara fixes this. We built an AI-powered analytics and trading platform for Base that does three things.

**First, we score every token.** We pull real on-chain data -- holder distribution, creator sell behavior, volume momentum, bonding curve progress -- and feed it into an LLM. Every token gets a RobinScore from 0 to 100, broken into three dimensions: idea quality, on-chain health, and curve position. Plus risk flags and a clear buy, hold, or avoid recommendation.

**Second, we rank the top tokens.** Our recommendation engine combines four data sources -- on-chain metrics, technical indicators, market context from CoinGecko, and news sentiment. One click, and it analyzes fifty tokens and returns a ranked top ten with explanations for each.

**Third, we let you trade directly.** We wrote and deployed a smart contract router on Base that adds slippage protection, deadline validation, and batch buying. You can buy all ten AI-recommended tokens in a single transaction.

---

## Demo（产品展示 ~1.5min）

【如果是 live demo 就切屏幕共享；如果是纯演讲就口述】

Let me show you what this looks like in practice.

This is our token feed -- live data from Goldsky's subgraph, refreshing every ten seconds. You can sort by volume, filter by active or graduated tokens, search by name.

【点进一个代币】

When you click into a token, you get the full picture. Price chart built with TradingView's library. Recent trade history. A progress bar showing how close the bonding curve is to graduation. Holder distribution as a pie chart. And the AI analysis card -- here's the RobinScore, the three sub-scores, the risk flags, and the recommended action.

【切到推荐页】

This is the recommendations page. You choose your data sources -- on-chain, technical, market context, news. Hit analyze. It processes fifty tokens, computes metrics locally in your browser, sends one API call to the LLM, and returns the top ten ranked with reasoning.

【如果有时间，展示交易】

And if I connect my wallet, I can trade right here. Enter an ETH amount, see the quote, set my slippage tolerance, and execute -- all routed through our smart contract with protection built in.

---

## Architecture（技术架构 ~30s）

The thing I want to emphasize is that this is a zero-backend application. The entire app runs in your browser. On-chain data comes from Goldsky's subgraph. AI scoring goes through OpenAI or DeepSeek. Trading goes through MetaMask to our router contract on Base. There are no servers to maintain, no user data passing through us, no custody.

This isn't a limitation -- it's a design choice. It means we can ship fast, scale without infrastructure costs, and users don't have to trust us with anything.

---

## What's Built（已完成 ~30s）

I want to be clear -- this is not a concept or a mockup. We have a working MVP deployed on Vercel right now.

Four pages. Thirteen components. A full smart contract with Foundry tests deployed on Base Sepolia. AI scoring that validates every response with Zod schemas. Six integrated data sources. And it all works today.

---

## What's Different（差异化 ~30s）

You might ask, how is this different from Dextools or DEXScreener?

Those tools show you charts and trade history. We score tokens, explain why, and let you act on it. It's a different product category -- we're not a chart viewer, we're a decision engine.

And the AI isn't cosmetic. We compute real metrics from on-chain data and validate every AI response structurally. This isn't a ChatGPT wrapper with a crypto skin.

---

## Roadmap（路线图 ~30s）

For the two weeks of this accelerator, our plan is straightforward.

Week one: deploy the router to Base mainnet, move API keys server-side so they're not exposed in the browser, and add real-time updates.

Week two: portfolio tracking, social signal integration, and public launch.

After the accelerator, the revenue model is clear -- trading fees through the router contract, and premium AI tiers for power users.

---

## Closing（结尾 ~15s）

Quantara brings intelligence to bonding curves. We turn noise into signal so traders can make informed decisions instead of gambling.

Thanks. Happy to take any questions.

---

## Q&A 备注（不念，自己看）

**如果问"怎么赚钱"：**
路由合约可以加交易手续费，这是最直接的。另外高级 AI 功能可以做付费层级。两个都很容易加上，架构已经支持。

**如果问"为什么 Base"：**
RobinPump 原生在 Base 上。我们先做一个平台做透，再扩展到其他链。架构是链无关的，换个 subgraph 就能支持新链。

**如果问"AI 不准怎么办"：**
我们不把 AI 当黑盒。三个子分数和风险标志是分开展示的，用户看得到推理过程。AI 是辅助判断的工具，不是替用户做决定。

**如果问"合约安全吗"：**
有完整的 Foundry 测试覆盖边界情况。正式审计是主网部署前的优先事项。测试网上已经跑了一段时间没有问题。

**如果问"团队几个人"：**
【根据实际情况回答】

**如果问"用户量 / traction"：**
目前是 MVP 阶段，部署在 Vercel 上。这次 accelerator 的目标就是从 MVP 走到公开发布，开始获取早期用户。

**如果冷场：**
可以主动说："One thing I'd love feedback on is our recommendation engine -- whether the multi-source approach resonates, or if traders would prefer a simpler single-score view."
