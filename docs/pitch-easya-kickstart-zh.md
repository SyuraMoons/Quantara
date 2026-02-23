# Quantara -- EasyA Kickstart Accelerator Pitch（中文版）

> 会议：2026 年 2 月 23 日周一 11:00 GMT | Google Meet: meet.google.com/oxi-usdg-bpk
> 组织者：Philip Kwok (phil@easya.io)

---

## 一句话介绍（30 秒）

每天有几百个代币在 bonding curve 上发射，99% 是垃圾。Quantara 是 Base 链上的 AI 分析层——实时给每个代币打分，告诉你哪些值得关注，并且可以直接带滑点保护交易——全在浏览器里运行，没有后端，不用注册。

---

## 痛点

Base 链上的 bonding curve 发射台（如 RobinPump）每天产生大量新代币，交易者面临三个问题：

- **信息过载** -- 随时有 50+ 活跃代币，每个都有链上数据，但没人有时间逐个分析
- **没有信号** -- 持仓集中度、创建者是否跑路、交易量趋势，这些数据都是公开的，但肉眼看不出来
- **执行风险** -- 在 bonding curve 上买 meme 币意味着高滑点、没保护、一次只能买一个

结果：交易者要么 FOMO 冲进骗局，要么错过真正的早期机会。

---

## 解决方案：Quantara（产品名 RobinLens）

Quantara 是一个运行在浏览器里的 DeFi 分析 + 交易平台，做三件事：

### 1. 用 AI 给每个代币打分

我们拉取真实的链上数据（持仓分布、创建者卖出行为、交易量动量、曲线进度），喂给 LLM。每个代币得到一个 **RobinScore（0-100）**，拆成三个维度：

- **创意质量** -- 这个项目概念靠谱吗？还是随便起了个名字？
- **链上健康度** -- 持仓集中吗？创建者跑了吗？
- **曲线位置** -- bonding curve 走到哪了？势头在涨吗？

附带风险标志、可比项目、以及明确的"买入/持有/回避"建议。

### 2. 多数据源批量排名 Top 10

推荐引擎融合四类信号：

| 数据源 | 告诉我们什么 |
|--------|-------------|
| 链上指标 | 持仓集中度、创建者行为、买卖比 |
| 技术指标 | 价格动量、交易速度、趋势方向 |
| 市场环境 | BTC/ETH 主导率、全球情绪（CoinGecko） |
| 新闻情绪 | 加密新闻相关度（News API） |

一键操作：分析 50 个代币，排出 Top 10，解释每个为什么值得关注。

### 3. 带保护的交易

我们的智能合约路由器（RobinLensRouter，部署在 Base 上）提供：

- **滑点保护** -- 设好容忍度，超了就回滚
- **过期验证** -- 交易 5 分钟后自动失效
- **批量买入** -- AI 推荐的代币一笔交易全买

---

## 已经建好的东西（可用 MVP）

以下不是设计稿，全部已实现并可运行：

| 功能 | 状态 |
|------|------|
| 实时代币列表（数据来自 Goldsky Subgraph） | 已上线 |
| 单个代币 AI 评分（GPT-4o / DeepSeek） | 已上线 |
| 批量 AI 推荐（可配置数据源） | 已上线 |
| 价格 K 线图（TradingView Lightweight Charts） | 已上线 |
| MetaMask 钱包买卖交易 | 已上线 |
| 智能合约路由器（滑点保护） | 已部署（Base Sepolia 测试网） |
| AI 推荐批量买入 | 已部署（Base Sepolia 测试网） |
| 交易者盈亏排行榜 | 已上线 |
| 上下文感知 AI 聊天机器人 | 已上线 |
| Vercel 生产环境部署 | 已上线 |

**4 个页面、13 个组件、7 个自定义 hook、14 个库模块、1 个智能合约（含完整 Foundry 测试）。**

---

## 架构

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

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19, TypeScript 5.9, Vite 7, Tailwind CSS 4 |
| 图表 | TradingView Lightweight Charts |
| Web3 | ethers.js 6, MetaMask |
| AI | OpenAI GPT-4o / DeepSeek，Zod v4 schema 校验 |
| 合约 | Solidity 0.8.24, Foundry（完整测试覆盖） |
| 数据 | Goldsky Subgraph (GraphQL), CoinGecko, News API |
| 部署 | Vercel（前端），Base Sepolia（合约） |

---

## 凭什么不一样

1. **AI 是结构性的，不是套壳。** 我们计算真实的链上指标（持仓集中度、创建者抛售率、交易量动量），每个 AI 返回都用 Zod schema 校验。不是给 ChatGPT 套个前端。

2. **多源信号融合。** 推荐结果综合链上数据 + 技术分析 + 市场环境 + 新闻情绪。用户可以选择开启哪些数据源。

3. **零后端。** 没有需要维护的服务器，没有需要保护的后端 API，没有托管。整个应用跑在浏览器里。这是特性不是限制——用户数据不经过我们的服务器。

4. **智能合约路由器。** 不只是前端——我们写了并部署了一个 Solidity 路由合约，提供滑点保护和批量交易。在 BaseScan 可验证，Foundry 测试通过。

5. **优雅降级。** 没有 OpenAI key 可以用演示模式，没有 CoinGecko 跳过市场数据，没有 News API 跳过新闻。应用永远不会崩。

---

## 路线图（Accelerator 两周期间）

### 第一周：生产就绪

- 将 RobinLensRouter 部署到 Base 主网
- 把 API key 迁移到服务端（Vercel Edge Functions），消除客户端暴露
- 加 WebSocket 支持实时交易更新（替换轮询）
- UI 打磨，准备公开发布

### 第二周：增长功能

- 持仓追踪 -- 跨会话的仓位和盈亏记录
- 社交信号 -- Twitter/Farcaster 上的热门代币
- 多链探索 -- 扩展到 Arbitrum、Optimism
- 正式公开发布 + 文档

### Accelerator 之后

- 通过路由合约收取交易手续费（收入模型）
- 高级 AI 层级（更深分析、更多数据源、更快刷新）
- 移动端适配 PWA
- 协议合作（扩展到 RobinPump 以外的 bonding curve 平台）

---

## 智能合约

RobinLensRouter 部署在 Base Sepolia：[`0xde8daf9599366b2ef8ae245bf574808844aa5f8a`](https://sepolia.basescan.org/address/0xde8daf9599366b2ef8ae245bf574808844aa5f8a)

| 函数 | 说明 |
|------|------|
| `buyToken(curve, minTokensOut, deadline)` | 带滑点保护的买入 |
| `sellToken(curve, token, amount, minEthOut, deadline)` | 卖回 bonding curve |
| `multiBuy(curves[], ethAmounts[], minTokensOut[], deadline)` | AI 推荐批量买入 |
| `quoteBuy(curve, ethAmount)` | 执行前获取报价 |

---

## 视频脚本大纲（给 EasyA 提交用）

### 场景 1：痛点（15 秒）
"每天几百个代币在 bonding curve 发射，大多数是噪音。交易者没有办法区分信号和骗局。"

### 场景 2：Quantara 做什么（20 秒）
"Quantara 用真实链上数据和 AI 给每个代币打分。RobinScore 从 0 到 100，告诉你创意质量、链上健康度、曲线位置——带风险标志和明确建议。"

### 场景 3：Live Demo（45 秒）
- 展示代币列表，实时数据
- 点进一个代币——展示 AI 分析、价格图表、持仓分布
- 展示 AI 推荐页——切换数据源，运行分析，看 Top 10 排名
- 连接钱包，执行一笔带滑点保护的交易

### 场景 4：技术原理（15 秒）
"纯浏览器应用，没有后端，没有托管。链上数据来自 Goldsky，AI 来自 GPT-4o，交易通过我们部署在 Base 上的智能合约路由器，带滑点保护和批量买入。"

### 场景 5：下一步（15 秒）
"主网部署、持仓追踪、社交信号，以及通过交易手续费的收入模型。我们在构建 bonding curve 的智能层。"

**总时长：约 2 分钟**

---

## Q&A 准备

| 问题 | 回答 |
|------|------|
| 为什么没有后端？ | 速度、简洁和信任。用户数据不经过我们的服务器，所有逻辑本地运行。 |
| 怎么赚钱？ | 路由合约可以收交易手续费。高级 AI 层级给专业用户。两个都很容易加上。 |
| 为什么选 Base？ | RobinPump 原生在 Base 上，我们去 bonding curve 在的地方。 |
| AI 评分准确吗？ | 每个返回都用 Zod schema 校验。温度 0.3 保证一致性。结构化评分标准，不是靠感觉。我们展示分项评分让用户自己判断。 |
| AI 评错了怎么办？ | 我们分别展示三个子分数和风险标志。用户看到的是推理过程，不只是一个数字。AI 是工具，不是神谕。 |
| 和 Dextools / DEXScreener 有什么区别？ | 它们展示图表和交易记录。我们给代币打分、解释原因、并且让你批量交易 AI 推荐的结果。不同的产品品类。 |
| 智能合约审计了吗？ | 有完整的 Foundry 测试覆盖边界情况。还没有专业审计——这是主网部署前的优先事项。 |
| 能支持其他链吗？ | 架构是链无关的。我们需要一个 subgraph 和 bonding curve 合约就行。扩展到 Arbitrum/Optimism 在计划中。 |
