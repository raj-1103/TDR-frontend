'use client'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { getMyRequests, getMyDocuments, downloadTransferPDF, MyDocument, TransferRequest, IssueRequest } from '@/lib/api'
import { Upload, ArrowLeftRight, CheckCircle, FileSearch, Clock, Copy, Bell, Download, FileText, RefreshCw, AlertCircle, XCircle } from 'lucide-react'

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  UPLOADED: '#3b82f6',
  TDR_ISSUED: '#10b981',
  TRANSFERRED: '#a78bfa',
  ANCHORED: '#06b6d4',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
  UPLOADED: 'badge-pending',
  TDR_ISSUED: 'badge-approved',
  TRANSFERRED: 'badge-approved',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [docs, setDocs] = useState<MyDocument[]>([])
  const [transfers, setTransfers] = useState<TransferRequest[]>([])
  const [issues, setIssues] = useState<IssueRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [docsRes, reqsRes] = await Promise.all([
        getMyDocuments(user.fabricID),
        getMyRequests(user.fabricID),
      ])
      setDocs(docsRes.documents || [])
      setTransfers(reqsRes.transferRequests || [])
      setIssues(reqsRes.issueRequests || [])
    } catch {}
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  // Notifications: recently resolved requests
  const notifications = [
    ...transfers.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED').map(r => ({
      id: r.requestID,
      type: 'transfer' as const,
      status: r.status,
      label: `Transfer ${r.status.toLowerCase()} — ${r.tdrID}`,
      sub: r.status === 'APPROVED' ? 'PDF ready to download' : (r.reason || ''),
      docID: r.docID,
      tdrID: r.tdrID,
      date: r.resolvedAt || r.createdAt,
    })),
    ...issues.filter(r => r.status === 'APPROVED' || r.status === 'REJECTED').map(r => ({
      id: r.requestID,
      type: 'issue' as const,
      status: r.status,
      label: `TDR issuance ${r.status.toLowerCase()} — ${r.tdrID}`,
      sub: r.status === 'REJECTED' ? (r.reason || '') : 'TDR minted on blockchain',
      docID: r.docID,
      tdrID: r.tdrID,
      date: r.resolvedAt || r.createdAt,
    })),
  ].sort((a, b) => b.date?.localeCompare(a.date || '') || 0)

  const pendingCount = [...transfers, ...issues].filter(r => r.status === 'PENDING').length

  const handleDownload = async (docID: string, tdrID: string) => {
    setDownloading(docID)
    setDownloadError(null)
    try {
      await downloadTransferPDF(docID, tdrID)
    } catch (err: any) {
      setDownloadError(err.message || 'PDF download failed. Ensure the backend /download-pdf endpoint is set up.')
    }
    setDownloading(null)
  }

  const copy = (text: string) => navigator.clipboard.writeText(text)

  const quickLinks = [
    { href: '/dashboard/upload', icon: Upload, title: 'Upload Document', desc: 'Add a new TDR document', color: '#3b82f6' },
    { href: '/dashboard/issue', icon: CheckCircle, title: 'Request TDR Issue', desc: 'Submit an issuance request', color: '#10b981' },
    { href: '/dashboard/transfer', icon: ArrowLeftRight, title: 'Request Transfer', desc: 'Transfer TDR to another user', color: '#f59e0b' },
    { href: '/verify', icon: FileSearch, title: 'Verify Document', desc: 'Check document authenticity', color: '#a78bfa' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
            🏠 <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link> › Dashboard
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>
            Welcome back, {user?.name || 'User'} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4 }}>
            Manage your TDR documents and track blockchain transactions.
          </p>
        </div>
        <button className="btn-ghost" onClick={load} disabled={loading} style={{ fontSize: 13 }}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {/* Download error banner */}
      {downloadError && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#f87171' }}>
          <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>PDF Download Failed</strong><br />
            <span style={{ fontSize: 12, opacity: 0.8 }}>{downloadError}</span>
          </div>
          <button onClick={() => setDownloadError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', flexShrink: 0 }}>✕</button>
        </div>
      )}

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bell size={13} />
            Notifications
            {pendingCount > 0 && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 99 }}>{pendingCount} pending</span>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map(n => (
              <div key={n.id} className="glass-card animate-in" style={{
                padding: '14px 18px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                borderColor: n.status === 'APPROVED' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
                flexWrap: 'wrap',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: n.status === 'APPROVED' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${n.status === 'APPROVED' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {n.status === 'APPROVED'
                      ? <CheckCircle size={16} color="#34d399" />
                      : <XCircle size={16} color="#f87171" />
                    }
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: n.status === 'APPROVED' ? '#34d399' : '#f87171' }}>
                      {n.label}
                    </div>
                    {n.sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{n.sub}</div>}
                  </div>
                </div>

                {/* Download PDF button for approved transfers */}
                {n.type === 'transfer' && n.status === 'APPROVED' && (
                  <button
                    className="btn-success"
                    onClick={() => handleDownload(n.docID, n.tdrID)}
                    disabled={downloading === n.docID}
                    style={{ fontSize: 12, whiteSpace: 'nowrap' }}
                  >
                    <Download size={13} />
                    {downloading === n.docID ? 'Downloading…' : 'Download PDF'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Quick Actions
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
        {quickLinks.map(({ href, icon: Icon, title, desc, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div className="glass-card animate-in" style={{ padding: '18px', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <div style={{ width: 36, height: 36, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* My Documents */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileText size={13} /> My Documents ({docs.length})
        </div>
        {loading ? (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>Loading…</div>
        ) : docs.length === 0 ? (
          <div className="glass-card" style={{ padding: '24px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 10 }}>No documents uploaded yet.</div>
            <Link href="/dashboard/upload" className="btn-primary" style={{ textDecoration: 'none', fontSize: 13 }}>
              <Upload size={14} /> Upload Your First Document
            </Link>
          </div>
        ) : (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table">
              <thead>
                <tr>
                  <th>Document ID</th>
                  <th>Filename</th>
                  <th>TDR ID</th>
                  <th>Status</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.docID}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{doc.docID}</code>
                        <button onClick={() => copy(doc.docID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                          <Copy size={11} />
                        </button>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.filename}
                    </td>
                    <td>
                      {doc.tdrID
                        ? <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#a78bfa' }}>{doc.tdrID}</code>
                        : <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Not issued</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[doc.status] || 'badge-pending'}`}>{doc.status}</span>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{doc.createdAt}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {/* Download PDF if transferred */}
                        {doc.status === 'TRANSFERRED' && (
                          <button
                            className="btn-success"
                            style={{ fontSize: 11 }}
                            onClick={() => handleDownload(doc.docID, doc.tdrID)}
                            disabled={downloading === doc.docID}
                          >
                            <Download size={11} />
                            {downloading === doc.docID ? '…' : 'PDF'}
                          </button>
                        )}
                        {/* Request issue if only uploaded */}
                        {doc.status === 'UPLOADED' && (
                          <Link href={`/dashboard/issue?docID=${doc.docID}`} style={{ textDecoration: 'none' }}>
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }}>
                              <CheckCircle size={11} /> Request Issue
                            </button>
                          </Link>
                        )}
                        {/* Request transfer if TDR issued */}
                        {doc.status === 'TDR_ISSUED' && (
                          <Link href={`/dashboard/transfer?docID=${doc.docID}`} style={{ textDecoration: 'none' }}>
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }}>
                              <ArrowLeftRight size={11} /> Transfer
                            </button>
                          </Link>
                        )}
                        {/* History link always */}
                        <Link href={`/history?docID=${doc.docID}`} style={{ textDecoration: 'none' }}>
                          <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }}>
                            <Clock size={11} /> History
                          </button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* My Requests */}
      {(transfers.length > 0 || issues.length > 0) && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} /> My Requests
          </div>
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table">
              <thead>
                <tr><th>Type</th><th>Request ID</th><th>TDR / Doc</th><th>Status</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {issues.map(r => (
                  <tr key={r.requestID}>
                    <td><span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>ISSUE</span></td>
                    <td><code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{r.requestID}</code></td>
                    <td style={{ fontSize: 12 }}>{r.tdrID}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.createdAt}</td>
                    <td>
                      {r.status === 'REJECTED' && r.reason && (
                        <span style={{ fontSize: 11, color: '#f87171' }} title={r.reason}>
                          <AlertCircle size={11} /> {r.reason.slice(0, 30)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {transfers.map(r => (
                  <tr key={r.requestID}>
                    <td><span style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600 }}>TRANSFER</span></td>
                    <td><code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>{r.requestID}</code></td>
                    <td style={{ fontSize: 12 }}>{r.tdrID}</td>
                    <td><span className={`badge ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.createdAt}</td>
                    <td>
                      {r.status === 'APPROVED' && (
                        <button className="btn-success" style={{ fontSize: 11 }} onClick={() => handleDownload(r.docID, r.tdrID)} disabled={downloading === r.docID}>
                          <Download size={11} /> {downloading === r.docID ? '…' : 'PDF'}
                        </button>
                      )}
                      {r.status === 'REJECTED' && r.reason && (
                        <span style={{ fontSize: 11, color: '#f87171' }}><AlertCircle size={11} /> {r.reason.slice(0, 30)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
