'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { requestTransfer, lookupFabricID } from '@/lib/api'
import { ArrowLeftRight, AlertCircle, CheckCircle, Copy, Info, Mail, Search } from 'lucide-react'
import { toast } from 'sonner'

export default function TransferPage() {
  const { user } = useAuth()
  const [docID, setDocID] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [resolvedName, setResolvedName] = useState('')
  const [resolvedFabricID, setResolvedFabricID] = useState('')
  const [looking, setLooking] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Live lookup when email field blurs
  const handleEmailBlur = async () => {
    if (!recipientEmail || !recipientEmail.includes('@')) return
    setLooking(true)
    setLookupError('')
    setResolvedFabricID('')
    setResolvedName('')
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/get-user?email=${encodeURIComponent(recipientEmail)}`
      )
      if (!res.ok) throw new Error('User not found')
      const data = await res.json()
      setResolvedFabricID(data.fabricID)
      setResolvedName(data.name || data.email)
    } catch {
      setLookupError('No registered user found with this email.')
    } finally {
      setLooking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!resolvedFabricID) {
      setError('Please enter a valid recipient email and wait for lookup.')
      return
    }
    setLoading(true)
    try {
      const res = await requestTransfer({
        fabricID: user!.fabricID,
        docID,
        newOwner: resolvedFabricID,
      })
      setResult(res)
    } catch (err: any) {
      setError(err.message || 'Transfer request failed')
    } finally {
      setLoading(false)
    }
  }

  const reset = () => {
    setResult(null)
    setDocID('')
    setRecipientEmail('')
    setResolvedFabricID('')
    setResolvedName('')
    setError('')
    setLookupError('')
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link> › Request Transfer
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Request TDR Transfer</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
          Initiate a transfer of TDR rights to another registered user. Admin approval is required.
        </p>
      </div>

      {result ? (
        <div className="glass-card animate-in" style={{ padding: 32 }}>
          <div style={{ width: 52, height: 52, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <CheckCircle size={26} color="#34d399" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Transfer Requested!</h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Your transfer request is on the blockchain and awaiting multi-step authority approval. You can track the 5-signature progress on your dashboard.
          </p>

          <span className="badge badge-pending" style={{ marginBottom: 16, display: 'inline-flex' }}>PENDING APPROVAL</span>

          {[
            { label: 'Request ID', value: result.requestID },
            { label: 'Transaction ID', value: result.txID },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)', wordBreak: 'break-all' }}>{value}</code>
                <button onClick={() => copy(value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}>
                  <Copy size={13} />
                </button>
              </div>
            </div>
          ))}

          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fbbf24', marginTop: 8, marginBottom: 20 }}>
            📄 You'll receive a notification in your dashboard once the admin approves. The PDF will be available for download immediately after approval.
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/dashboard" className="btn-primary" style={{ textDecoration: 'none' }}>
              Go to Dashboard
            </Link>
            <button className="btn-ghost" onClick={reset}>New Request</button>
          </div>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 32 }}>
          <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: 'var(--navy-accent)', marginBottom: 22, display: 'flex', gap: 10, lineHeight: 1.6 }}>
            <Info size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Enter the <strong>email address</strong> of the recipient. They must already be registered on the portal. Their identity will be verified automatically.
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Document ID */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Document ID <span style={{ color: '#f87171' }}>*</span>
              </label>
              <input
                className="tdr-input"
                placeholder="TDR-2026-XXXX"
                value={docID}
                onChange={e => setDocID(e.target.value)}
                required
              />
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                The document must have an approved TDR issued.
              </div>
            </div>

            {/* Recipient email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Recipient Email <span style={{ color: '#f87171' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                <input
                  type="email"
                  className="tdr-input"
                  style={{ paddingLeft: 36, paddingRight: looking ? 36 : 12 }}
                  placeholder="recipient@example.com"
                  value={recipientEmail}
                  onChange={e => {
                    setRecipientEmail(e.target.value)
                    setResolvedFabricID('')
                    setResolvedName('')
                    setLookupError('')
                  }}
                  onBlur={handleEmailBlur}
                  required
                />
                {looking && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }}>
                    <div style={{ width: 14, height: 14, border: '2px solid rgba(37,99,235,0.2)', borderTop: '2px solid var(--navy-400)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                )}
              </div>

              {/* Lookup result */}
              {resolvedFabricID && (
                <div style={{ marginTop: 8, background: 'rgba(5,150,105,0.03)', border: '1px solid rgba(5,150,105,0.15)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle size={14} color="var(--emerald)" />
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 700 }}>
                      {resolvedName} — user verified
                    </div>
                    <code style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {resolvedFabricID}
                    </code>
                  </div>
                </div>
              )}

              {lookupError && (
                <div style={{ marginTop: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#f87171', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertCircle size={13} /> {lookupError}
                </div>
              )}
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !resolvedFabricID || !docID}
              style={{ justifyContent: 'center', padding: '12px' }}
            >
              {loading ? '⏳ Submitting to Blockchain…' : <><ArrowLeftRight size={15} /> Request Transfer</>}
            </button>
          </form>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
