import { useState, useCallback } from 'react'
import type { TokenRecommendation } from '../lib/recommendationSchema'
import { executeMultiBuy, type MultiBuyItem } from '../lib/contracts'
import { basescanTxUrl } from '../lib/chains'
import { useWallet } from '../hooks/useWallet'

interface BatchBuyButtonProps {
  recommendations: TokenRecommendation[]
}

export function BatchBuyButton({ recommendations }: BatchBuyButtonProps) {
  const { signer, address, isWrongChain } = useWallet()
  const [ethPerToken, setEthPerToken] = useState('0.001')
  const [status, setStatus] = useState<'idle' | 'buying' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  // Filter to actionable recommendations (not demos, buy/strong_buy only)
  const buyable = recommendations.filter(
    (r) =>
      !r.curveId.startsWith('demo-') &&
      (r.suggestedAction === 'buy' || r.suggestedAction === 'strong_buy'),
  )

  const handleBatchBuy = useCallback(async () => {
    if (!signer || buyable.length === 0) return

    setStatus('buying')
    setError(null)
    setTxHash(null)

    try {
      const items: MultiBuyItem[] = buyable.map((r) => ({
        curveAddress: r.curveId,
        ethAmount: ethPerToken,
      }))

      const result = await executeMultiBuy(items, signer)
      setTxHash(result.txHash)
      setStatus('success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Batch buy failed'
      // Friendlier error messages
      if (msg.includes('user rejected')) {
        setError('Transaction cancelled')
      } else if (msg.includes('insufficient funds')) {
        setError('Insufficient ETH balance')
      } else {
        setError(msg)
      }
      setStatus('error')
    }
  }, [signer, buyable, ethPerToken])

  if (buyable.length === 0) return null

  const totalEth = (parseFloat(ethPerToken) * buyable.length).toFixed(4)

  return (
    <div className="rounded-xl border border-blue/30 bg-blue/5 p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🛒</span>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Batch Buy Top Picks
            </p>
            <p className="text-xs text-text-muted">
              {buyable.length} tokens via RobinLensRouter
            </p>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {/* Token list */}
          <div className="space-y-1">
            {buyable.map((r, i) => (
              <div key={r.curveId} className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">
                  #{i + 1} {r.name} (${r.symbol})
                </span>
                <span className="font-mono text-text-muted">{ethPerToken} ETH</span>
              </div>
            ))}
          </div>

          {/* ETH per token input */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-text-muted">
              ETH per token
            </label>
            <div className="mt-1 flex gap-2">
              {['0.001', '0.005', '0.01', '0.05'].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setEthPerToken(amount)}
                  className={`rounded px-2 py-1 text-xs transition-colors ${
                    ethPerToken === amount
                      ? 'bg-blue text-white'
                      : 'bg-bg-tertiary text-text-secondary hover:bg-bg-hover'
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
            <span className="text-text-muted">Total</span>
            <span className="font-mono font-semibold text-text-primary">{totalEth} ETH</span>
          </div>

          {/* Status messages */}
          {status === 'success' && txHash && (
            <div className="rounded-lg border border-green/30 bg-green/10 px-3 py-2">
              <p className="text-xs text-green">
                Batch buy successful!{' '}
                <a
                  href={basescanTxUrl(txHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  View on BaseScan
                </a>
              </p>
            </div>
          )}
          {status === 'error' && error && (
            <p className="text-xs text-red">{error}</p>
          )}

          {/* Buy button */}
          {!address ? (
            <p className="text-xs text-text-muted">Connect wallet to batch buy</p>
          ) : isWrongChain ? (
            <p className="text-xs text-yellow">Switch to the correct network</p>
          ) : (
            <button
              onClick={handleBatchBuy}
              disabled={status === 'buying'}
              className="w-full rounded-lg bg-blue px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue/80 disabled:opacity-50"
            >
              {status === 'buying' ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" fill="currentColor" className="opacity-75" />
                  </svg>
                  Buying {buyable.length} tokens...
                </span>
              ) : (
                `Buy ${buyable.length} tokens for ${totalEth} ETH`
              )}
            </button>
          )}

          <p className="text-center text-[9px] text-text-muted">
            Uses RobinLensRouter with 5% slippage protection per token
          </p>
        </div>
      )}
    </div>
  )
}
