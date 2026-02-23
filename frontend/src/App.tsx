import { Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { TokenFeed } from './pages/TokenFeed'
import { TokenDetail } from './pages/TokenDetail'
import { Leaderboard } from './pages/Leaderboard'
import { Recommendations } from './pages/Recommendations'
import { Waitlist } from './pages/Waitlist'
import { WalletContext, useWalletState } from './hooks/useWallet'

export default function App() {
  const walletState = useWalletState()

  return (
    <WalletContext value={walletState}>
      <Layout>
        <Routes>
          <Route path="/" element={<TokenFeed />} />
          <Route path="/token/:id" element={<TokenDetail />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/waitlist" element={<Waitlist />} />
        </Routes>
      </Layout>
    </WalletContext>
  )
}
