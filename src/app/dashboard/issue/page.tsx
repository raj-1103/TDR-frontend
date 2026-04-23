'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { requestIssueTDR } from '@/lib/api'
import { CheckCircle, AlertCircle, Copy, Info } from 'lucide-react'

export default function IssuePage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ docID: '', tdrID: '', area: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await requestIssueTDR({
        fabricID: user!.fabricID,
        docID: form.docID,
        tdrID: form.tdrID,
        area: parseInt(form.area),
      })
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string) => navigator.clipboard.writeText(text)

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link> › Request TDR Issue
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Request TDR Issuance</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Submit a request to issue a Transfer of Development Rights certificate for your uploaded document.
        </p>
      </div>

      {result ? (
        <div className="glass-card animate-in" style={{ padding: 32 }}>
          <div style={{ width: 52, height: 52, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <CheckCircle size={26} color="#34d399" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Request Submitted!</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Your TDR issuance request is now on the blockchain and awaiting admin approval.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span className="badge badge-pending">PENDING APPROVAL</span>
          </div>

          {[
            { label: 'Request ID', value: result.requestID },
            { label: 'Transaction ID', value: result.txID },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#60a5fa', wordBreak: 'break-all' }}>{value}</code>
                <button onClick={() => copy(value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  <Copy size={13} />
                </button>
              </div>
            </div>
          ))}

          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fbbf24', marginTop: 8, marginBottom: 20, lineHeight: 1.6 }}>
            ℹ️ An admin will review your request. Once approved, the TDR will be minted on the Fabric blockchain and linked to your document.
          </div>

          <button className="btn-ghost" onClick={() => { setResult(null); setForm({ docID: '', tdrID: '', area: '' }) }}>
            Submit Another Request
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 32 }}>
          {/* Info box */}
          <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#93c5fd', marginBottom: 22, display: 'flex', gap: 10, lineHeight: 1.6 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Make sure you have already uploaded the document and noted its <strong>Document ID</strong>. The TDR ID must be unique — choose a meaningful identifier like <code style={{ fontFamily: 'var(--font-mono)' }}>TDRID-2026-001</code>.
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Document ID <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                className="tdr-input"
                placeholder="TDR-2026-XXXX"
                value={form.docID}
                onChange={e => setForm({ ...form, docID: e.target.value })}
                required
              />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                From the upload step — e.g. TDR-2026-AB3F
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                TDR ID (unique) <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                className="tdr-input"
                placeholder="TDRID-2026-001"
                value={form.tdrID}
                onChange={e => setForm({ ...form, tdrID: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Surrendered Area (sq. metres) <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                type="number"
                className="tdr-input"
                placeholder="500"
                min="1"
                value={form.area}
                onChange={e => setForm({ ...form, area: e.target.value })}
                required
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
              {loading ? '⏳ Submitting to Blockchain…' : <><CheckCircle size={15} /> Submit Issue Request</>}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
