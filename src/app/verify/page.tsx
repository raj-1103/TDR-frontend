'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { verifyDocument } from '@/lib/api'
import { Search, CheckCircle, XCircle, AlertCircle, Shield, ExternalLink, RefreshCw } from 'lucide-react'
import { Card, CardBody } from '@/components/Card'

function VerifyContent() {
  const { user } = useAuth()
  const params = useSearchParams()
  const [form, setForm] = useState({ docID: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Auto-verify if URL has query params (from QR code scan)
  useEffect(() => {
    const docID = params.get('docID')
    if (docID) {
      setForm({ docID })
      doVerify(docID)
    }
  }, [params])

  const doVerify = async (docID: string) => {
    setError(''); setResult(null); setLoading(true)
    try {
      const res = await verifyDocument(docID)
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    doVerify(form.docID)
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div style={{ width: 72, height: 72, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 16px rgba(59,130,246,0.1)' }}>
          <Shield size={32} className="text-blue-600" />
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.02em' }}>
          Verify TDR Document
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, lineHeight: 1.6, maxWidth: 500, margin: '0 auto', fontWeight: 500 }}>
          Enter a Document ID to verify authenticity on the Hyperledger Fabric blockchain. This validation is publicly accessible.
        </p>
      </div>

      {/* Form */}
      <Card hoverable className="mb-6 border-slate-200 shadow-xl shadow-slate-200/40">
        <CardBody className="p-8">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                Unique Document ID
              </label>
              <input
                className="tdr-input"
                placeholder="e.g., TDR-2026-XXXX"
                style={{ height: 52, fontSize: 16, fontWeight: 600, borderRadius: 14 }}
                value={form.docID}
                onChange={e => setForm({ ...form, docID: e.target.value })}
                required
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', height: 52, borderRadius: 14, fontSize: 15, fontWeight: 900, boxShadow: '0 8px 16px -4px rgba(37,99,235,0.25)' }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={18} className="animate-spin opacity-50" />
                  Verifying on Ledger...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Search size={18} /> Verify Authenticity
                </span>
              )}
            </button>
          </form>
        </CardBody>
      </Card>

      {/* Result */}
      {result && (
        <Card 
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl shadow-slate-200/50"
          style={{
            borderColor: result.valid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
            background: result.valid ? 'rgba(16,185,129,0.01)' : 'rgba(239,68,68,0.01)',
          }}
        >
          <CardBody className="p-8">
            {/* Status banner */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--border)' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '18px',
                background: result.valid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${result.valid ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                boxShadow: result.valid ? '0 8px 16px -4px rgba(16,185,129,0.2)' : 'none'
              }}>
                {result.valid
                  ? <CheckCircle size={28} color="#10b981" />
                  : <XCircle size={28} color="#ef4444" />
                }
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: result.valid ? '#10b981' : '#ef4444', fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                  {result.valid ? 'Document Authentic' : 'Verification Failed'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2, fontWeight: 500 }}>{result.reason}</div>
              </div>
            </div>

            {/* Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Asset Status', value: result.status, mono: false },
                { label: 'Blockchain ID', value: result.docID, mono: true },
                result.hash ? { label: 'Ledger Hash', value: result.hash, mono: true } : null,
                result.ethTxHash ? { label: 'Settlement Hash', value: result.ethTxHash, mono: true } : null,
                result.merkleRoot ? { label: 'Merkle Root', value: result.merkleRoot, mono: true } : null,
                result.batchID ? { label: 'Batch ID', value: result.batchID, mono: false } : null,
              ].filter(Boolean).map((item: any) => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', flexShrink: 0, paddingTop: 4 }}>{item.label}</span>
                  <span style={{
                    fontSize: item.mono ? 11 : 14,
                    fontFamily: item.mono ? 'var(--font-mono)' : 'inherit',
                    color: '#0f172a',
                    wordBreak: 'break-all',
                    textAlign: 'right',
                    fontWeight: item.mono ? 600 : 700,
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Etherscan link */}
            {result.ethTxHash && (
              <div className="mt-8 text-right">
                <a
                  href={`https://sepolia.etherscan.io/tx/${result.ethTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ fontSize: 12, display: 'inline-flex', background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', color: '#64748b', fontWeight: 700 }}
                >
                  <ExternalLink size={13} className="mr-2" /> View Settlement on Etherscan
                </a>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Info footer */}
      <div style={{ marginTop: 32, fontSize: 12, color: '#94a3b8', textAlign: 'center', lineHeight: 1.7, fontWeight: 500 }}>
        Blockchain verification is powered by Hyperledger Fabric & Ethereum Sepolia.<br />
        <span className="font-bold text-slate-400">Surat Municipal Corporation</span> · Official e-TDR Trust Portal
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <main>
        <Suspense fallback={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <RefreshCw size={32} className="animate-spin text-blue-500 opacity-20" />
          </div>
        }>
          <VerifyContent />
        </Suspense>
      </main>
    </div>
  )
}
