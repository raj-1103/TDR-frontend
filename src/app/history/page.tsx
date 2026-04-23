'use client'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { getHistory, getMutationGraph } from '@/lib/api'
import { Search, Clock, ArrowRight, Copy, ExternalLink, GitBranch } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  UPLOADED: '#3b82f6',
  TDR_ISSUED: '#10b981',
  ISSUE_REQUESTED: '#f59e0b',
  TRANSFER_REQUESTED: '#a78bfa',
  TRANSFERRED: '#06b6d4',
  ANCHORED: '#34d399',
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [docID, setDocID] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<any[] | null>(null)
  const [chain, setChain] = useState<string>('')
  const [error, setError] = useState('')

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setHistory(null); setChain('')
    setLoading(true)
    try {
      const [h, g] = await Promise.all([getHistory(docID), getMutationGraph(docID)])
      setHistory(h.history || [])
      setChain(g.chain || '')
    } catch (err: any) {
      setError(err.message || 'Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string) => navigator.clipboard.writeText(text)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', minHeight: 'calc(100vh - 100px)' }}>
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Document History</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>View the full blockchain audit trail for any TDR document.</p>
          </div>

          {/* Search */}
          <div className="glass-card" style={{ padding: '20px 24px', marginBottom: 24 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
              <input
                className="tdr-input"
                placeholder="Enter Document ID — e.g. TDR-2026-XXXX"
                value={docID}
                onChange={e => setDocID(e.target.value)}
                required
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn-primary" disabled={loading}>
                <Search size={15} />
                {loading ? 'Searching…' : 'Search'}
              </button>
            </form>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>
              {error}
            </div>
          )}

          {history !== null && (
            <>
              {/* Ownership chain */}
              {chain && (
                <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <GitBranch size={15} color="#a78bfa" />
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ownership Chain</span>
                  <span style={{ fontSize: 13, color: '#c4b5fd', fontFamily: 'var(--font-mono)' }}>{chain}</span>
                </div>
              )}

              {history.length === 0 ? (
                <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  No history found for this document.
                </div>
              ) : (
                <div className="glass-card" style={{ padding: '24px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Clock size={14} />
                    {history.length} event{history.length !== 1 ? 's' : ''} for <code style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa', fontSize: 12 }}>{docID}</code>
                  </div>

                  {/* Timeline */}
                  <div style={{ position: 'relative' }}>
                    {/* Vertical line */}
                    <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: 'var(--border)' }} />

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {history.map((entry, i) => {
                        const color = ACTION_COLORS[entry.action] || '#64748b'
                        return (
                          <div key={i} style={{ display: 'flex', gap: 20, paddingBottom: 28, position: 'relative' }}>
                            {/* Dot */}
                            <div style={{
                              width: 34, height: 34, borderRadius: '50%',
                              background: `${color}20`,
                              border: `2px solid ${color}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, position: 'relative', zIndex: 1,
                            }}>
                              <div style={{ width: 8, height: 8, background: color, borderRadius: '50%' }} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, paddingTop: 4 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                                <span style={{ fontSize: 13, fontWeight: 700, color, letterSpacing: '0.03em' }}>{entry.action}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{entry.timestamp}</span>
                              </div>

                              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                                {entry.fromOwner && entry.toOwner && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 10px' }}>
                                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{entry.fromOwner?.slice(0, 14)}…</code>
                                    <ArrowRight size={11} color="var(--text-secondary)" />
                                    <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#60a5fa' }}>{entry.toOwner?.slice(0, 14)}…</code>
                                  </div>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Tx:</span>
                                <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>
                                  {entry.txID?.slice(0, 30)}…
                                </code>
                                <button onClick={() => copy(entry.txID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                  <Copy size={11} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
