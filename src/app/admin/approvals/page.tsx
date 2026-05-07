'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getPendingActions, approveAction, rejectAction, listUsers, PendingAction } from '@/lib/api'
import { CheckCircle, XCircle, RefreshCw, ListChecks, MessageSquare, AlertCircle, Eye } from 'lucide-react'
import { toast } from 'sonner'

const ACTION_MAP: Record<string, string> = {
  ISSUE_TDR: 'TDR Issuance',
  TRANSFER_TDR: 'TDR Transfer',
  ACCEPT_BID: 'Bid Acceptance',
  PROMOTE_ADMIN: 'Admin Promotion',
}

export default function PendingApprovalsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [actions, setActions] = useState<PendingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [showModal, setShowModal] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null)
  const [modalText, setModalText] = useState('')
  const [userMap, setUserMap] = useState<Record<string, string>>({}) // fabricID → name

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
          ; (usersRes.value.users || []).forEach((u: any) => {
            if (u.fabricID) map[u.fabricID] = u.name || u.email || u.fabricID
          })
        setUserMap(map)
      }

      if (actionsRes.status === 'fulfilled') {
        const rawActions = actionsRes.value.actions || actionsRes.value.actions || []
        const normalized = rawActions.map((a: any) => ({
          id: a.actionId || a.ActionID || a.id || a.ID || '',
          type: a.actionType || a.ActionType || a.type || a.Type || '',
          requester: a.requestedBy || a.RequestedBy || a.requester || a.Requester || '',
          createdAt: a.requestedAt || a.RequestedAt || a.createdAt || a.CreatedAt || '',
          status: a.status || a.Status || '',
          details: a.payload || a.Payload || a.details || a.Details || {},
          approvals: a.approvals ?? 0,
          totalRequired: a.totalRequired ?? a.TotalRequired ?? 5,
        }))
        setActions(normalized)
        console.log(`[DEBUG] Loaded ${normalized.length} actions in Approval Queue`)
      } else {
        toast.error(actionsRes.reason?.message || 'Failed to load actions')
      }
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  const handleAction = async () => {
    if (!showModal) return
    const { id, type } = showModal
    setActing(id)
    try {
      if (type === 'approve') {
        await approveAction(user!.fabricID, id, modalText)
        toast.success('Action approved successfully')
      } else {
        await rejectAction(user!.fabricID, id, modalText)
        toast.success('Action rejected')
      }
      setShowModal(null)
      setModalText('')
      await load()
    } catch (e: any) {
      toast.error(e.message)
    }
    setActing(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link> › Pending Approvals
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Universal Approval Queue</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Multi-step approval system. Actions require 5 signatures to finalize.
            </p>
          </div>
          <button className="btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
            Fetching pending actions...
          </div>
        ) : (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Action Type</th>
                  <th>Requester</th>
                  <th>Status</th>
                  <th>Details</th>
                  <th>Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {actions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No actions pending your approval.
                    </td>
                  </tr>
                ) : (
                  actions.map(action => (
                    <tr key={action.id}>
                      <td>
                        <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>{(action.id || '').slice(0, 12)}...</code>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'rgba(59,130,246,0.1)',
                          color: 'var(--navy-400)'
                        }}>
                          {ACTION_MAP[action.type] || action.type}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 400 }}>
                        {userMap[action.requester] || (action.requester ? `${action.requester.slice(0, 12)}...` : 'Unknown')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ width: 100, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${(action.approvals / action.totalRequired) * 100}%`, height: '100%', background: 'var(--emerald)' }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{action.approvals}/{action.totalRequired} Signatures</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 12 }}>
                        {action.type === 'ISSUE_TDR' && (
                          <div style={{ opacity: 0.8 }}>
                            Doc: {action.details.docID}<br />
                            TDR: {action.details.tdrID}
                          </div>
                        )}
                        {action.type === 'TRANSFER_TDR' && (
                          <div style={{ opacity: 0.8 }}>
                            From: {(action.details.fabricID && userMap[action.details.fabricID]) || action.details.fabricID?.slice(0, 10)}...<br />
                            To: {(action.details.newOwner && userMap[action.details.newOwner]) || action.details.newOwner?.slice(0, 10)}...
                          </div>
                        )}
                        {action.type === 'ACCEPT_BID' && (
                          <div style={{ opacity: 0.8 }}>
                            TDR: {action.details.tdrID}<br />
                            Price: ₹ {(action.details.price || 0).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        {action.details.docID ? (
                          <button
                            className="btn-ghost"
                            title="Preview Document"
                            onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/download-pdf?docID=${action.details.docID}`, '_blank')}
                            style={{ padding: '6px', borderRadius: '6px', color: 'var(--navy-400)' }}
                          >
                            <Eye size={18} />
                          </button>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-success"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => { setModalText(''); setShowModal({ id: action.id, type: 'approve' }) }}
                            disabled={acting === action.id}
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '6px 12px', fontSize: 12 }}
                            onClick={() => { setModalText(''); setShowModal({ id: action.id, type: 'reject' }) }}
                            disabled={acting === action.id}
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)'
          }}>
            <div className="glass-card" style={{ width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                {showModal.type === 'approve' ? <CheckCircle color="var(--emerald)" /> : <XCircle color="var(--red)" />}
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
                  onClick={handleAction}
                  disabled={acting !== null || (showModal.type === 'reject' && !modalText.trim())}
                >
                  {acting ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
