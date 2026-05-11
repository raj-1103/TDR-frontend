'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getPendingActions, approveAction, rejectAction, listUsers, PendingAction } from '@/lib/api'
import { CheckCircle, XCircle, RefreshCw, ShieldCheck, Eye, ArrowLeftRight, Clock, ListChecks, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody } from '@/components/Card'

const ACTION_MAP: Record<string, string> = {
  ISSUE_TDR: 'TDR Issuance',
  TRANSFER_TDR: 'TDR Transfer',
  ACCEPT_BID: 'Bid Acceptance',
  PROMOTE_ADMIN: 'Admin Promotion',
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [tab, setTab] = useState<'control' | 'queue'>('control')
  const [allActions, setAllActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [userMap, setUserMap] = useState<Record<string, string>>({})
  const [showModal, setShowModal] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null)
  const [modalText, setModalText] = useState('')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    const adminRoles = ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']
    if (!adminRoles.includes(user.role)) { router.push('/dashboard'); return }
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    try {
      const [actionsRes, usersRes] = await Promise.allSettled([
        getPendingActions(user?.role, user?.fabricID),
        listUsers(),
      ])
      if (usersRes.status === 'fulfilled') {
        const map: Record<string, string> = {}
        ;(usersRes.value.users || []).forEach((u: any) => {
          if (u.fabricID) map[u.fabricID] = u.name || u.email || u.fabricID
        })
        setUserMap(map)
      }
      if (actionsRes.status === 'fulfilled') {
        const raw = actionsRes.value.actions || []
        setAllActions(raw.map((a: any) => ({
          id: a.actionId || a.ActionID || a.id || a.ID || '',
          type: a.actionType || a.ActionType || a.type || a.Type || '',
          requester: a.requestedBy || a.RequestedBy || a.requester || a.Requester || '',
          createdAt: a.requestedAt || a.RequestedAt || a.createdAt || a.CreatedAt || '',
          status: a.status || a.Status || '',
          details: a.payload || a.Payload || a.details || a.Details || {},
          approvals: a.approvals ?? 0,
          totalRequired: a.totalRequired ?? a.TotalRequired ?? 5,
        })))
      } else {
        toast.error(actionsRes.reason?.message || 'Failed to load actions')
      }
    } catch (e: any) { toast.error(e.message) }
    setLoading(false)
  }

  const issues    = allActions.filter(a => a.type === 'ISSUE_TDR')
  const transfers = allActions.filter(a => a.type === 'TRANSFER_TDR')

  const handleApprove = async (id: string, comment = 'Approved via Admin Panel') => {
    setActing(id)
    try {
      await approveAction(user!.fabricID, id, comment)
      toast.success('Approved!')
      await load()
    } catch (e: any) { toast.error(e.message) }
    setActing(null)
  }

  const handleReject = async (id: string, reason: string) => {
    setActing(id)
    try {
      await rejectAction(user!.fabricID, id, reason || 'Rejected by admin')
      toast.success('Rejected.')
      await load()
    } catch (e: any) { toast.error(e.message) }
    setActing(null)
  }

  const handleModalAction = async () => {
    if (!showModal) return
    if (showModal.type === 'approve') await handleApprove(showModal.id, modalText)
    else await handleReject(showModal.id, modalText)
    setShowModal(null)
    setModalText('')
  }

  const promptReject = (id: string) => {
    const reason = window.prompt('Enter rejection reason:')
    if (reason === null) return
    handleReject(id, reason)
  }

  const TAB_STYLE = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--navy-400)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
  })

  return (
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <main>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }}>Dashboard</Link>
              <span style={{ margin: '0 8px', opacity: 0.5 }}>/</span>
              Governance Panel
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.02em' }}>
              Administrative Oversight
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
              Review and authorize pending TDR lifecycle operations across the decentralized ledger.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 900, padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase' }}>
              <ShieldCheck size={14} /> Authority: {user?.role}
            </div>
            <button className="btn-ghost" onClick={load} disabled={loading} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 38, padding: '0 14px', fontSize: 13, fontWeight: 700 }}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Synchronize
            </button>
            {user?.role === 'SUPERADMIN' && (
              <Link href="/admin/users" className="btn-primary" style={{ fontSize: 13, height: 38, padding: '0 16px', borderRadius: 12, fontWeight: 800 }}>
                User Registry
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Pending Issuance', value: issues.length, color: '#f59e0b', icon: <CheckCircle size={20} /> },
            { label: 'Pending Transfers', value: transfers.length, color: '#2563eb', icon: <ArrowLeftRight size={20} /> },
            { label: 'System Queue', value: allActions.length, color: '#7c3aed', icon: <Clock size={20} /> },
          ].map(({ label, value, color, icon }) => (
            <Card key={label} hoverable className="border-slate-300">
              <CardBody className="p-6 flex items-center justify-between">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#0f172a', lineHeight: 1 }}>{value}</div>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}10`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', borderRadius: 12, padding: 4, marginBottom: 24, width: 'fit-content' }}>
          <button style={TAB_STYLE(tab === 'control')} onClick={() => setTab('control')}>
            <ShieldCheck size={13} style={{ display: 'inline', marginRight: 6 }} />
            Admin Control
          </button>
          <button style={TAB_STYLE(tab === 'queue')} onClick={() => setTab('queue')}>
            <ListChecks size={13} style={{ display: 'inline', marginRight: 6 }} />
            Approval Queue
            {allActions.length > 0 && (
              <span style={{ marginLeft: 8, background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 900, padding: '1px 7px' }}>
                {allActions.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <RefreshCw size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', display: 'block', opacity: 0.3 }} />
            Querying Blockchain Consensus...
          </div>
        ) : tab === 'control' ? (
          // ── ADMIN CONTROL TAB ──
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            {/* Issuance Queue */}
            <section>
              <h2 style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                Asset Issuance Queue ({issues.length})
              </h2>
              {issues.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200">
                  <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>No pending issuance requests.</div>
                </Card>
              ) : (
                <Card className="border-slate-300 overflow-hidden">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tdr-table w-full">
                      <thead>
                        <tr>
                          <th>Request / Asset</th>
                          <th>Progress</th>
                          <th>Applicant / Area</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.map(req => (
                          <tr key={req.id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <code style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748b' }}>{(req.id || '').slice(0, 10)}</code>
                                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 12 }}>{req.details?.tdrID || req.details?.TdrID || '—'}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ width: 80, height: 5, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                  <div style={{ width: `${(req.approvals / req.totalRequired) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#10b981,#34d399)' }} />
                                </div>
                                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>{req.approvals}/{req.totalRequired}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: 700 }}>{userMap[req.requester] || req.requester?.slice(0, 10) + '...' || 'Unknown'}</span>
                                <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-secondary)' }}>{(req.details?.area || 0).toLocaleString()} m²</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: '#64748b' }}>{req.createdAt ? new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button className="btn-ghost" title="Preview" style={{ padding: '5px 7px' }} onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/download-pdf?docID=${req.details?.docID}`, '_blank')}><Eye size={14} /></button>
                                <button className="btn-success" style={{ height: 30, padding: '0 10px', fontSize: 12 }} onClick={() => handleApprove(req.id)} disabled={acting === req.id}>{acting === req.id ? '...' : 'Approve'}</button>
                                <button className="btn-danger" style={{ height: 30, padding: '0 10px', fontSize: 12, background: 'transparent', border: '1px solid #fee2e2', color: '#ef4444' }} onClick={() => promptReject(req.id)} disabled={acting === req.id}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </section>

            {/* Transfer Queue */}
            <section>
              <h2 style={{ fontSize: 13, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                Ownership Transfer Queue ({transfers.length})
              </h2>
              {transfers.length === 0 ? (
                <Card className="border-dashed border-2 border-slate-200">
                  <div style={{ padding: 40, textAlign: 'center', color: '#64748b', fontSize: 14 }}>No pending transfer requests.</div>
                </Card>
              ) : (
                <Card className="border-slate-200 overflow-hidden">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tdr-table w-full">
                      <thead>
                        <tr>
                          <th>Request / Asset</th>
                          <th>Progress</th>
                          <th>Transfer Path</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transfers.map(req => (
                          <tr key={req.id}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <code style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748b' }}>{(req.id || '').slice(0, 10)}</code>
                                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 12 }}>{req.details?.tdrID || req.details?.TdrID || '—'}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <div style={{ width: 80, height: 5, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden' }}>
                                  <div style={{ width: `${(req.approvals / req.totalRequired) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#3b82f6,#60a5fa)' }} />
                                </div>
                                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>{req.approvals}/{req.totalRequired}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <span style={{ fontSize: 12, fontWeight: 700 }}>{userMap[req.requester] || req.requester?.slice(0, 8) + '...' }</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-secondary)' }}>
                                  <span>To:</span>
                                  <code style={{ background: '#f8fafc', padding: '1px 4px', borderRadius: 4, border: '1px solid #e2e8f0' }}>{(req.details?.toOwner || '').slice(0, 8)}...</code>
                                </div>
                              </div>
                            </td>
                            <td style={{ fontSize: 12, color: '#64748b' }}>{req.createdAt ? new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—'}</td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <button className="btn-ghost" title="Preview" style={{ padding: '5px 7px' }} onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/download-pdf?docID=${req.details?.docID}`, '_blank')}><Eye size={14} /></button>
                                <button className="btn-success" style={{ height: 30, padding: '0 10px', fontSize: 12 }} onClick={() => handleApprove(req.id)} disabled={acting === req.id}>{acting === req.id ? '...' : 'Approve'}</button>
                                <button className="btn-danger" style={{ height: 30, padding: '0 10px', fontSize: 12, background: 'transparent', border: '1px solid #fee2e2', color: '#ef4444' }} onClick={() => promptReject(req.id)} disabled={acting === req.id}>Reject</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </section>
          </div>
        ) : (
          // ── APPROVAL QUEUE TAB ──
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table">
              <thead>
                <tr>
                  <th>Request ID</th><th>Action Type</th><th>Status</th><th>Details</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allActions.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No actions pending your approval.</td></tr>
                ) : allActions.map(action => (
                  <tr key={action.id}>
                    <td><code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>{(action.id || '').slice(0, 12)}...</code></td>
                    <td><span style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: 'var(--navy-400)' }}>{ACTION_MAP[action.type] || action.type}</span></td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ width: 90, height: 5, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${(action.approvals / action.totalRequired) * 100}%`, height: '100%', background: 'var(--emerald)' }} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{action.approvals}/{action.totalRequired} Signatures</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>{userMap[action.requester] || action.requester?.slice(0, 12) + '...' || 'Unknown'}</div>
                      {action.type === 'ISSUE_TDR' && <div>Doc: {action.details.docID}<br />TDR: {action.details.tdrID}</div>}
                      {action.type === 'TRANSFER_TDR' && <div>From: {(userMap[action.details.fabricID] || action.details.fabricID?.slice(0,10)) + '...'}<br />To: {(action.details.newOwner || '').slice(0,10)}...</div>}
                      {action.type === 'ACCEPT_BID' && <div>TDR: {action.details.tdrID}<br />Price: ₹ {(action.details.price || 0).toLocaleString()}</div>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        {action.details.docID && (
                          <button className="btn-ghost" title="Preview" style={{ padding: '5px 7px' }} onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/download-pdf?docID=${action.details.docID}`, '_blank')}><Eye size={15} /></button>
                        )}
                        <button className="btn-success" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setModalText(''); setShowModal({ id: action.id, type: 'approve' }) }} disabled={acting === action.id}><CheckCircle size={12} /> Approve</button>
                        <button className="btn-danger" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setModalText(''); setShowModal({ id: action.id, type: 'reject' }) }} disabled={acting === action.id}><XCircle size={12} /> Reject</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                {showModal.type === 'approve' ? <CheckCircle color="var(--emerald)" /> : <XCircle color="#ef4444" />}
                {showModal.type === 'approve' ? 'Approve Action' : 'Reject Action'}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
                {showModal.type === 'approve' ? 'Optional: Provide a comment for this approval.' : 'Required: Provide a reason for this rejection.'}
              </p>
              <textarea
                className="tdr-input"
                style={{ width: '100%', minHeight: 100, marginBottom: 20, padding: 12 }}
                placeholder={showModal.type === 'approve' ? 'Comment (optional)...' : 'Reason (required)...'}
                value={modalText}
                onChange={e => setModalText(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button className="btn-ghost" onClick={() => setShowModal(null)}>Cancel</button>
                <button
                  className={showModal.type === 'approve' ? 'btn-success' : 'btn-danger'}
                  onClick={handleModalAction}
                  disabled={acting !== null || (showModal.type === 'reject' && !modalText.trim())}
                >
                  {acting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
