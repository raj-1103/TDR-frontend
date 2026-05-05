'use client'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'
import { 
  getMyRequests, 
  getMyDocuments, 
  downloadTransferPDF, 
  getAdminStats,
  listForSale,
  acceptBid,
  confirmBid,
  getMarketplaceListings,
  getMyTDRs,
  getMyTransferHistory,
  MyDocument, 
  TransferRequest, 
  IssueRequest,
  MarketplaceListing,
  TDRRecord,
  TransferHistoryEntry
} from '@/lib/api'
import { Upload, ArrowLeftRight, CheckCircle, FileSearch, Clock, Copy, Bell, Download, FileText, RefreshCw, AlertCircle, XCircle, ShieldCheck, TrendingUp, FileUp, Repeat, ShoppingBag, Gavel, Tag } from 'lucide-react'
import { toast } from 'sonner'

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#10b981',
  REJECTED: '#ef4444',
  UPLOADED: '#3b82f6',
  TDR_ISSUED: '#10b981',
  TRANSFERRED: '#a78bfa',
  ANCHORED: '#06b6d4',
  ON_SALE: '#7c3aed',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-pending',
  APPROVED: 'badge-approved',
  REJECTED: 'badge-rejected',
  UPLOADED: 'badge-pending',
  TDR_ISSUED: 'badge-approved',
  TRANSFERRED: 'badge-approved',
  ON_SALE: 'badge-approved',
}

export default function DashboardPage() {
  const { user, initializing } = useAuth()
  const [docs, setDocs] = useState<MyDocument[]>([])
  const [transfers, setTransfers] = useState<TransferRequest[]>([])
  const [issues, setIssues] = useState<IssueRequest[]>([])
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [myTDRs, setMyTDRs] = useState<TDRRecord[]>([])
  const [transferHistory, setTransferHistory] = useState<TransferHistoryEntry[]>([])
  const [adminStats, setAdminStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  
  // Marketplace state
  const [listModal, setListModal] = useState<MyDocument | null>(null)
  const [askingPrice, setAskingPrice] = useState('')
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const [docsResult, reqsResult, marketResult, tdrsResult, historyResult] = await Promise.allSettled([
        getMyDocuments(user.fabricID),
        getMyRequests(user.fabricID),
        getMarketplaceListings(),
        getMyTDRs(user.fabricID),
        getMyTransferHistory(user.fabricID),
      ])

      if (docsResult.status === 'fulfilled')    setDocs(docsResult.value.documents || [])
      if (reqsResult.status === 'fulfilled') {
        setTransfers(reqsResult.value.transferRequests || [])
        setIssues(reqsResult.value.issueRequests || [])
      }
      if (marketResult.status === 'fulfilled')  setListings(marketResult.value.listings || [])
      if (tdrsResult.status === 'fulfilled')    setMyTDRs(tdrsResult.value.tdrs || [])
      if (historyResult.status === 'fulfilled') setTransferHistory(historyResult.value.history || [])

      // Log any non-critical failures (missing backend endpoints)
      ;[docsResult, reqsResult, marketResult, tdrsResult, historyResult].forEach((r, i) => {
        if (r.status === 'rejected') console.warn(`Dashboard API call ${i} failed (non-critical):`, r.reason)
      })

      const adminRoles = ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']
      if (adminRoles.includes(user.role)) {
        try { const stats = await getAdminStats(); setAdminStats(stats) } catch {}
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [user])

  useEffect(() => {
    if (!initializing && !user) {
      window.location.href = '/login'
    } else if (user) {
      load()
    }
  }, [user, initializing, load])

  if (initializing || (!user && initializing)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: 'var(--text-secondary)' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={24} className="animate-spin" style={{ marginBottom: 16 }} />
          <p style={{ fontSize: 13 }}>Restoring session...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const handleListForSale = async () => {
    if (!listModal || !askingPrice) return
    setActing(listModal.docID)
    try {
      await listForSale(user.fabricID, listModal.tdrID, parseFloat(askingPrice))
      toast.success('TDR listed for sale on Marketplace')
      setListModal(null)
      setAskingPrice('')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
    setActing(null)
  }

  const handleAcceptBid = async (bidID: string) => {
    setActing(bidID)
    try {
      await acceptBid(user.fabricID, bidID)
      toast.success('Bid accepted! Awaiting buyer confirmation.')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
    setActing(null)
  }

  const handleConfirmPurchase = async (bidID: string) => {
    setActing(bidID)
    try {
      await confirmBid(user.fabricID, bidID)
      toast.success('Purchase confirmed! Initiating final approval chain.')
      load()
    } catch (e: any) {
      toast.error(e.message)
    }
    setActing(null)
  }

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

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  // Role-based quick actions
  const isAdmin = user?.role !== 'USER'

  const userQuickLinks = [
    { href: '/dashboard/upload', icon: Upload, title: 'Upload Document', desc: 'Add a new TDR document', color: '#3b82f6' },
    { href: '/marketplace', icon: ShoppingBag, title: 'Marketplace', desc: 'Browse TDR for sale', color: '#10b981' },
    { href: '/dashboard/issue', icon: CheckCircle, title: 'Request TDR Issue', desc: 'Submit an issuance request', color: '#f59e0b' },
    { href: '/verify', icon: FileSearch, title: 'Verify Document', desc: 'Check document authenticity', color: '#a78bfa' },
  ]

  const adminQuickLinks = [
    { href: '/admin/approvals', icon: ShieldCheck, title: 'Approval Queue', desc: 'Review pending actions', color: '#7c3aed' },
    { href: '/marketplace', icon: ShoppingBag, title: 'Marketplace', desc: 'Browse TDR for sale', color: '#10b981' },
    { href: '/dashboard/upload', icon: Upload, title: 'Upload Document', desc: 'Add a new TDR document', color: '#3b82f6' },
    { href: '/verify', icon: FileSearch, title: 'Verify Document', desc: 'Check document authenticity', color: '#a78bfa' },
  ]

  const quickLinks = isAdmin ? adminQuickLinks : userQuickLinks

  // Stats
  const totalDocs = docs.length
  const issuedDocs = docs.filter(d => d.status === 'TDR_ISSUED').length
  const transferredDocs = docs.filter(d => d.status === 'TRANSFERRED').length
  const uploadedDocs = docs.filter(d => d.status === 'UPLOADED').length

  const stats = isAdmin && adminStats
    ? [
      { label: 'System Documents', value: adminStats.totalDocuments, color: '#3b82f6', icon: FileText },
      { label: 'Pending Globally', value: adminStats.pendingRequests, color: '#f59e0b', icon: Clock },
      { label: 'Total TDR Issued', value: adminStats.tdrIssued, color: '#10b981', icon: CheckCircle },
      { label: 'System Transfers', value: adminStats.transferred, color: '#a78bfa', icon: Repeat },
    ]
    : [
      { label: 'Total Documents', value: totalDocs, color: '#3b82f6', icon: FileText },
      { label: 'Awaiting Upload', value: uploadedDocs, color: '#f59e0b', icon: FileUp },
      { label: 'TDR Issued', value: issuedDocs, color: '#10b981', icon: CheckCircle },
      { label: 'Received via Transfer', value: transferredDocs, color: '#a78bfa', icon: Repeat },
    ]

  const myListings = listings.filter(l => l.seller === user.fabricID)

  const getApprovalLevel = (approvals: number) => {
    const levels = ['JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']
    if (approvals < levels.length) return `Awaiting ${levels[approvals]} Approval`
    return 'Finalizing...'
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <Link href="/" style={{ color: 'var(--navy-400)', textDecoration: 'none' }}>Home</Link>
        <span style={{ opacity: 0.5 }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Dashboard</span>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--navy-hero)', letterSpacing: '-0.01em' }}>
            Dashboard Overview
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 4, fontWeight: 500 }}>
            Welcome back, <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{user?.name || 'Officer'}</span>. {user.role} Role Active.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-ghost" onClick={load} disabled={loading} style={{ background: 'white', borderRadius: 10, padding: '10px 16px' }}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Sync Ledger
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        {stats.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, background: `${color}10`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 700 }}>{label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Quick Actions
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 28 }}>
        {quickLinks.map(({ href, icon: Icon, title, desc, color }) => (
          <Link key={href} href={href} style={{ textDecoration: 'none' }}>
            <div className="animate-in" style={{ 
                padding: '24px 18px', 
                background: '#11233d', 
                borderRadius: 16,
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
                cursor: 'pointer',
                color: '#ffffff'
              }}
              onMouseEnter={e => { 
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={e => { 
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              }}
            >
              <div style={{ width: 42, height: 42, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={20} color="#ffffff" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.01em' }}>{title}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontWeight: 500 }}>{desc}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Marketplace Listings - If Seller */}
      {myListings.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={13} /> My Marketplace Listings ({myListings.length})
          </div>
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table">
              <thead>
                <tr><th>TDR ID</th><th>Asking Price</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {myListings.map(l => (
                  <tr key={l.id}>
                    <td><code style={{ fontFamily: 'var(--font-mono)' }}>{l.tdrID}</code></td>
                    <td>₹ {l.askingPrice.toLocaleString()}</td>
                    <td><span className={`badge ${l.status === 'ACTIVE' ? 'badge-approved' : 'badge-pending'}`}>{l.status}</span></td>
                    <td>
                      <Link href="/marketplace" className="btn-ghost" style={{ fontSize: 11 }}>View Bids</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* My TDRs (owned via issuance or marketplace purchase) */}
      {myTDRs.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={13} color="#10b981" /> My TDRs ({myTDRs.length})
          </div>
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table">
              <thead>
                <tr>
                  <th>TDR ID</th>
                  <th>Area</th>
                  <th>Status</th>
                  <th>Acquired From</th>
                  <th>Acquired At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {myTDRs.map(tdr => (
                  <tr key={tdr.tdrID}>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#7c3aed', fontWeight: 700 }}>
                        {tdr.tdrID}
                      </code>
                    </td>
                    <td>{tdr.area ? `${tdr.area.toLocaleString()} sq m` : '—'}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                        background: tdr.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)'
                          : tdr.status === 'LISTED' ? 'rgba(124,58,237,0.1)'
                          : 'rgba(148,163,184,0.1)',
                        color: tdr.status === 'ACTIVE' ? '#10b981'
                          : tdr.status === 'LISTED' ? '#7c3aed'
                          : '#94a3b8',
                      }}>
                        {tdr.status}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
                        {tdr.acquiredFrom ? tdr.acquiredFrom.slice(0, 16) + '...' : 'Original Issue'}
                      </code>
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {tdr.acquiredAt ? new Date(tdr.acquiredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {tdr.status === 'ACTIVE' && (
                          <button
                            className="btn-primary"
                            style={{ fontSize: 11, padding: '5px 10px' }}
                            onClick={() => {
                              // Find matching doc and open list modal
                              const doc = docs.find(d => d.tdrID === tdr.tdrID)
                              if (doc) setListModal(doc)
                              else toast.error('Document not found for this TDR')
                            }}
                          >
                            <Tag size={11} /> List for Sale
                          </button>
                        )}
                        {tdr.status === 'LISTED' && (
                          <Link href="/marketplace">
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }}>
                              <ShoppingBag size={11} /> View Listing
                            </button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transfer History */}
      {transferHistory.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ArrowLeftRight size={13} color="#a78bfa" /> TDR Transfer History ({transferHistory.length})
          </div>
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table">
              <thead>
                <tr>
                  <th>TDR ID</th>
                  <th>Action</th>
                  <th>Direction</th>
                  <th>Counterparty</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transferHistory.map((h, i) => (
                  <tr key={i}>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#7c3aed', fontWeight: 700 }}>
                        {h.tdrID}
                      </code>
                    </td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {h.action}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 12,
                        background: h.direction === 'RECEIVED' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)',
                        color: h.direction === 'RECEIVED' ? '#10b981' : '#f59e0b',
                        display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content'
                      }}>
                        {h.direction === 'RECEIVED' ? '↓ RECEIVED' : '↑ SENT'}
                      </span>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                        {h.direction === 'RECEIVED'
                          ? (h.sellerName || h.fromOwner?.slice(0, 14) + '...')
                          : (h.buyerName  || h.toOwner?.slice(0, 14)   + '...')}
                      </code>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {h.soldAmount > 0 ? `₹ ${h.soldAmount.toLocaleString()}` : '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      {h.timestamp ? new Date(h.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                  <th>TDR ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {docs.map(doc => (
                  <tr key={doc.docID}>
                    <td>
                      <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>{doc.docID}</code>
                    </td>
                    <td>
                      {doc.tdrID
                        ? <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#7c3aed' }}>{doc.tdrID}</code>
                        : <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Not issued</span>
                      }
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[doc.status] || 'badge-pending'}`}>{doc.status}</span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {doc.status === 'TDR_ISSUED' && (
                          <button 
                            className="btn-primary" 
                            style={{ fontSize: 11, padding: '5px 10px' }}
                            onClick={() => setListModal(doc)}
                          >
                            <Tag size={11} /> List for Sale
                          </button>
                        )}
                        {doc.status === 'ON_SALE' && (
                          <span style={{ fontSize: 11, color: 'var(--navy-400)', fontWeight: 700, padding: '5px 10px', background: '#f0f9ff', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                             <Tag size={11} /> Already Listed
                          </span>
                        )}
                        {(doc.status === 'TDR_ISSUED' || doc.status === 'TRANSFERRED') && (
                          <Link href={`/dashboard/transfer?docID=${doc.docID}`} style={{ textDecoration: 'none' }}>
                            <button className="btn-ghost" style={{ fontSize: 11, padding: '5px 10px' }}>
                              <ArrowLeftRight size={11} /> Transfer
                            </button>
                          </Link>
                        )}
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

      {/* My Requests & Approval Progress */}
      {(transfers.length > 0 || issues.length > 0) && (
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={13} /> My Request Progress
          </div>
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table">
              <thead>
                <tr><th>Type</th><th>ID</th><th>Status</th><th>Approval Progress</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {issues.map(r => (
                  <tr key={r.requestID}>
                    <td><span style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 700 }}>{r.typeText || 'ISSUE'}</span></td>
                    <td><code style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{r.requestID.slice(0,8)}...</code></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className={`badge ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span>
                        {r.status === 'PENDING' && r.approvals !== undefined && (
                          <span style={{ fontSize: 10, color: 'var(--navy-400)', fontWeight: 700 }}>{getApprovalLevel(r.approvals)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {r.status === 'PENDING' && r.approvals !== undefined ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                           <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(r.approvals / (r.totalRequired || 5)) * 100}%`, height: '100%', background: 'var(--emerald)' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.approvals}/{r.totalRequired || 5}</span>
                        </div>
                      ) : <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>-</span>}
                    </td>
                    <td>
                      {r.status === 'REJECTED' && r.reason && (
                        <span style={{ fontSize: 11, color: '#f87171' }}><AlertCircle size={11} /> {r.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {transfers.map(r => (
                  <tr key={r.requestID}>
                    <td><span style={{ fontSize: 11, color: 'var(--navy-accent)', fontWeight: 700 }}>{r.typeText || 'TRANSFER'}</span></td>
                    <td><code style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{r.requestID.slice(0,8)}...</code></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span className={`badge ${STATUS_BADGE[r.status] || 'badge-pending'}`}>{r.status}</span>
                        {r.status === 'PENDING' && r.approvals !== undefined && (
                          <span style={{ fontSize: 10, color: 'var(--navy-400)', fontWeight: 700 }}>{getApprovalLevel(r.approvals)}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {r.status === 'PENDING' && r.approvals !== undefined ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                           <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(r.approvals / (r.totalRequired || 5)) * 100}%`, height: '100%', background: 'var(--emerald)' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{r.approvals}/{r.totalRequired || 5}</span>
                        </div>
                      ) : <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>-</span>}
                    </td>
                    <td>
                      {r.status === 'APPROVED' && (
                        <button className="btn-success" style={{ fontSize: 11 }} onClick={() => handleDownload(r.docID, r.tdrID)}>
                          <Download size={11} /> PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* List for Sale Modal */}
      {listModal && (
        <div style={{ 
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>List TDR for Sale</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Listing TDR ID: <strong>{listModal.tdrID}</strong>
            </p>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>Asking Price (₹)</label>
              <input 
                type="number" 
                className="tdr-input" 
                style={{ width: '100%' }} 
                placeholder="Enter asking price..." 
                value={askingPrice}
                onChange={e => setAskingPrice(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button className="btn-ghost" onClick={() => setListModal(null)}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleListForSale}
                disabled={acting !== null || !askingPrice}
              >
                {acting ? 'Listing...' : 'List on Marketplace'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ) 
}
