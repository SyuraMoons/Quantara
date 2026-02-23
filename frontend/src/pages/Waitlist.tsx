import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Waitlist() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const { error } = await supabase.from('waitlist').insert({ email: email.trim().toLowerCase() })

    if (error) {
      if (error.code === '23505') {
        setStatus('success')
        return
      }
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('error')
      return
    }

    setStatus('success')
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] flex-col items-center justify-center px-4">
      <div className="w-full max-w-2xl text-center">

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue-dim px-4 py-1.5 text-sm text-blue">
          <span className="inline-block h-2 w-2 rounded-full bg-blue animate-pulse" />
          Backed by EasyA Kickstart Accelerator
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl font-bold leading-tight tracking-tight md:text-6xl">
          AI Token Analyst
          <br />
          <span className="text-green">for Base</span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-text-secondary">
          Hundreds of tokens launch on bonding curves every day. 99% are noise.
          Quantara scores every one and tells you which are worth your attention.
        </p>

        {/* How it works */}
        <div className="mx-auto mt-10 grid max-w-lg gap-4 text-left md:max-w-xl md:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-card p-4">
            <div className="mb-2 text-2xl font-bold text-green">01</div>
            <div className="font-display font-semibold">Score</div>
            <p className="mt-1 text-sm text-text-muted">AI reads on-chain data and rates every token 0-100</p>
          </div>
          <div className="rounded-xl border border-border bg-bg-card p-4">
            <div className="mb-2 text-2xl font-bold text-blue">02</div>
            <div className="font-display font-semibold">Rank</div>
            <p className="mt-1 text-sm text-text-muted">Multi-source engine picks the top 10 from 50+ tokens</p>
          </div>
          <div className="rounded-xl border border-border bg-bg-card p-4">
            <div className="mb-2 text-2xl font-bold text-purple">03</div>
            <div className="font-display font-semibold">Trade</div>
            <p className="mt-1 text-sm text-text-muted">Batch-buy recommendations with slippage protection</p>
          </div>
        </div>

        {/* Form or success */}
        <div className="mt-12">
          {status === 'success' ? (
            <div className="rounded-xl border border-green/30 bg-green-dim px-6 py-4">
              <p className="font-display text-lg font-semibold text-green">You're on the list.</p>
              <p className="mt-1 text-sm text-text-secondary">We'll notify you when Quantara launches.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-md gap-3">
              <input
                type="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-bg-secondary px-4 py-3 text-text-primary placeholder:text-text-muted outline-none transition-colors focus:border-green"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="rounded-lg bg-green px-6 py-3 font-display font-semibold text-bg-primary transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {status === 'submitting' ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          )}
          {status === 'error' && (
            <p className="mt-3 text-sm text-red">{errorMsg}</p>
          )}
        </div>

        {/* Social */}
        <div className="mt-8 flex items-center justify-center gap-6 text-sm text-text-muted">
          <a
            href="https://x.com/quantara_ai"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text-primary"
          >
            Follow on X
          </a>
          <span className="text-border">|</span>
          <a
            href="https://www.linkedin.com/in/quantara-a7ab443b2/"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text-primary"
          >
            LinkedIn
          </a>
          <span className="text-border">|</span>
          <a
            href="https://github.com/SyuraMoons/RobinLens"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-text-primary"
          >
            GitHub
          </a>
        </div>

        {/* Footer tagline */}
        <p className="mt-16 text-xs text-text-muted">
          Signal, not noise. Built on Base.
        </p>
      </div>
    </div>
  )
}
