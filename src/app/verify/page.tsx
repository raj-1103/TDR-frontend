'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { verifyDocument } from '@/lib/api'
import { Search, CheckCircle, XCircle, AlertCircle, Shield, ExternalLink } from 'lucide-react'

export default function VerifyPage() {
  const { user } = useAuth()
  const params = useSearchParams()
  const [form, setForm] = useState({ docID: '', hash: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Auto-verify if URL has query params (from QR code scan)
  useEffect(() => {
    const docID = params.get('docID')
    const hash = params.get('hash')
    if (docID && hash) {
      setForm({ docID, hash })
      doVerify(docID, hash)
    }
  }, [])

  const doVerify = async (docID: string, hash: string) => {
    setError(''); setResult(null); setLoading(true)
    try {
      const res = await verifyDocument(docID, hash)
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doVerify(form.docID, form.hash)
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <Navbar />

      <div style={{ display: 'flex' }}>
        {user && <Sidebar />}
        <main style={{ flex: 1, padding: user ? '32px' : '48px 24px', minHeight: 'calc(100vh - 100px)' }}>
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <div style={{ width: 64, height: 64, background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.25)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <Shield size={28} color="#60a5fa" />
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, marginBottom: 10 }}>
                Verify TDR Document
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, maxWidth: 480, margin: '0 auto' }}>
                Enter a Document ID and hash to verify authenticity on the Hyperledger Fabric blockchain. This page is publicly accessible.
              </p>
            </div>

            {/* Form */}
            <div className="glass-card" style={{ padding: 32, marginBottom: 20 }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Document ID
                  </label>
                  <input
                    className="tdr-input"
                    placeholder="TDR-2026-XXXX"
                    value={form.docID}
                    onChange={e => setForm({ ...form, docID: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Document Hash (Keccak-256)
                  </label>
                  <input
                    className="tdr-input"
                    placeholder="64-character hex hash"
                    value={form.hash}
                    onChange={e => setForm({ ...form, hash: e.target.value })}
                    required
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Found on the TDR certificate PDF under "Blockchain Verification"
                  </div>
                </div>

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171' }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
                  {loading ? '🔍 Verifying on blockchain…' : <><Search size={15} /> Verify Document</>}
                </button>
              </form>
            </div>

            {/* Result */}
            {result && (
              <div
                className="glass-card animate-in"
                style={{
                  padding: 28,
                  borderColor: result.valid ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
                  background: result.valid ? 'rgba(16,185,129,0.04)' : 'rgba(239,68,68,0.04)',
                }}
              >
                {/* Status banner */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: result.valid ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${result.valid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    {result.valid
                      ? <CheckCircle size={26} color="#34d399" />
                      : <XCircle size={26} color="#f87171" />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: result.valid ? '#34d399' : '#f87171', fontFamily: 'var(--font-display)' }}>
                      {result.valid ? 'Document Authentic' : 'Verification Failed'}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{result.reason}</div>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Status', value: result.status, mono: false },
                    { label: 'Document ID', value: result.docID, mono: true },
                    result.ethTxHash ? { label: 'Ethereum Tx Hash', value: result.ethTxHash, mono: true } : null,
                    result.merkleRoot ? { label: 'Merkle Root', value: result.merkleRoot, mono: true } : null,
                    result.batchID ? { label: 'Batch ID', value: result.batchID, mono: false } : null,
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', flexShrink: 0, paddingTop: 2 }}>{item.label}</span>
                      <span style={{
                        fontSize: item.mono ? 11 : 13,
                        fontFamily: item.mono ? 'var(--font-mono)' : 'var(--font-body)',
                        color: '#60a5fa',
                        wordBreak: 'break-all',
                        textAlign: 'right',
                      }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Etherscan link */}
                {result.ethTxHash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${result.ethTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost"
                    style={{ marginTop: 20, fontSize: 12, display: 'inline-flex' }}
                  >
                    <ExternalLink size={13} /> View on Etherscan
                  </a>
                )}
              </div>
            )}

            {/* Info footer */}
            <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(148,163,184,0.5)', textAlign: 'center', lineHeight: 1.7 }}>
              This verification checks the document hash against the Hyperledger Fabric ledger.<br />
              Surat Municipal Corporation · e-TDR Blockchain Portal
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
