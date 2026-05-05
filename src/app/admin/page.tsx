'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

import {
  getPendingActions,
  approveAction,
  rejectAction,
  listUsers,
} from '@/lib/api'
import { CheckCircle, XCircle, RefreshCw, ShieldCheck, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [transfers, setTransfers] = useState<any[]>([])
  const [issues, setIssues] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [userMap, setUserMap] = useState<Record<string, string>>({}) // fabricID → name

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    const authorityRoles = ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']
    if (!authorityRoles.includes(user.role)) { router.push('/dashboard'); return }
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
        const raw = actionsRes.value.actions || actionsRes.value.actions || []
        const all = raw.map((a: any) => ({
          id: a.actionId || a.ActionID || a.id || a.ID || '',
          type: a.actionType || a.ActionType || a.type || a.Type || '',
          requester: a.requestedBy || a.RequestedBy || a.requester || a.Requester || '',
          createdAt: a.requestedAt || a.RequestedAt || a.createdAt || a.CreatedAt || '',
          status: a.status || a.Status || '',
          details: a.payload || a.Payload || a.details || a.Details || {},
          approvals: a.approvals ?? 0,
          totalRequired: a.totalRequired ?? a.TotalRequired ?? 5,
        }))
        setIssues(all.filter((a: any) => a.type === 'ISSUE_TDR'))
        setTransfers(all.filter((a: any) => a.type === 'TRANSFER_TDR'))
        console.log(`[DEBUG] Loaded ${all.length} actions for role ${user?.role}`)
      } else {
        toast.error(actionsRes.reason?.message || 'Failed to load actions')
      }
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  const handleApproveIssue = async (requestID: string) => {
    setActing(requestID)
    try {
      await approveAction(user!.fabricID, requestID, 'Approved via Admin Panel')
      toast.success('TDR issue approved!')
      await load()
    } catch (e: any) { toast.error(e.message) }
    setActing(null)
  }

  const handleRejectIssue = async (requestID: string) => {
    const reason = window.prompt('Enter rejection reason:')
    if (reason === null) return
    setActing(requestID)
    try {
      await rejectAction(user!.fabricID, requestID, reason || 'Rejected by admin')
      toast.success('Request rejected.')
      await load()
    } catch (e: any) { toast.error(e.message) }
    setActing(null)
  }

  const handleApproveTransfer = async (requestID: string) => {
    setActing(requestID)
    try {
      await approveAction(user!.fabricID, requestID, 'Approved via Admin Panel')
      toast.success('Transfer approved!')
      await load()
    } catch (e: any) { toast.error(e.message) }
    setActing(null)
  }

  const handleRejectTransfer = async (requestID: string) => {
    const reason = window.prompt('Enter rejection reason:')
    if (reason === null) return
    setActing(requestID)
    try {
      await rejectAction(user!.fabricID, requestID, reason || 'Rejected by admin')
      toast.success('Transfer rejected.')
      await load()
    } catch (e: any) { toast.error(e.message) }
    setActing(null)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main>


        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link> › Admin Panel
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Admin Panel</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Review and resolve pending TDR issue and transfer requests.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--emerald)', fontWeight: 600 }}>
              <ShieldCheck size={14} /> {user?.role}
            </div>
            <button className="btn-ghost" onClick={load} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
            {user?.role === 'SUPERADMIN' && (
              <Link href="/admin/users" className="btn-primary" style={{ fontSize: 13, padding: '8px 16px' }}>
                Manage Users
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Pending Issue Requests', value: issues.length, color: '#f59e0b' },
            { label: 'Pending Transfer Requests', value: transfers.length, color: '#3b82f6' },
            { label: 'Total Pending', value: issues.length + transfers.length, color: '#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass-card" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
            Loading requests from blockchain…
          </div>
        ) : (
          <>
            {/* Issue Requests */}
            <section style={{ marginBottom: 36 }}>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} color="#f59e0b" />
                Pending TDR Issue Requests ({issues.length})
              </h2>

              {issues.length === 0 ? (
                <div className="glass-card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  ✅ No pending issue requests
                </div>
              ) : (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                  <table className="tdr-table" style={{ minWidth: 700 }}>
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Doc ID</th>
                        <th>TDR ID</th>
                        <th>Status (Signatures)</th>
                        <th>Requester</th>
                        <th>Area</th>
                        <th>Requested</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {issues.map(req => (
                        <tr key={req.id}>
                          <td>
                            <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>
                              {(req.id || '').slice(0, 12)}...
                            </code>
                          </td>
                          <td>
                            <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{req.details?.docID || req.details?.DocID}</code>
                          </td>
                          <td style={{ fontWeight: 500 }}>{req.details?.tdrID || req.details?.TdrID}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${(req.approvals / req.totalRequired) * 100}%`, height: '100%', background: 'var(--emerald)' }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>{req.approvals}/{req.totalRequired} Signatures</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
                            {userMap[req.requester] || (req.requester ? `${req.requester.slice(0, 12)}...` : 'Unknown')}
                          </td>
                          <td>{(req.details?.area || req.details?.Area || 0).toLocaleString()} sq m</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(req.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn-success"
                                onClick={() => handleApproveIssue(req.id)}
                                disabled={acting === req.id}
                              >
                                <CheckCircle size={12} />
                                {acting === req.id ? '…' : 'Approve'}
                              </button>
                              <button
                                className="btn-danger"
                                onClick={() => handleRejectIssue(req.id)}
                                disabled={acting === req.id}
                              >
                                <XCircle size={12} />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Transfer Requests */}
            <section>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} color="#3b82f6" />
                Pending Transfer Requests ({transfers.length})
              </h2>

              {transfers.length === 0 ? (
                <div className="glass-card" style={{ padding: '28px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  ✅ No pending transfer requests
                </div>
              ) : (
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                  <table className="tdr-table" style={{ minWidth: 700 }}>
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>TDR ID</th>
                        <th>Doc ID</th>
                        <th>Status (Progress)</th>
                        <th>Requester</th>
                        <th>To (New Owner)</th>
                        <th>Requested</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map(req => (
                        <tr key={req.id}>
                          <td>
                            <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>
                              {(req.id || '').slice(0, 12)}...
                            </code>
                          </td>
                          <td style={{ fontWeight: 500 }}>{req.details?.tdrID || req.details?.TdrID}</td>
                          <td>
                            <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{req.details?.docID || req.details?.DocID}</code>
                          </td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={{ width: 80, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ width: `${(req.approvals / req.totalRequired) * 100}%`, height: '100%', background: 'var(--emerald)' }} />
                              </div>
                              <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 600 }}>{req.approvals}/{req.totalRequired} Signatures</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy-700)' }}>
                            {userMap[req.requester] || (req.requester ? `${req.requester.slice(0, 12)}...` : 'Unknown')}
                          </td>
                          <td style={{ fontSize: 12 }}>{(req.details?.toOwner || req.details?.ToOwner || '').slice(0, 16)}...</td>
                          <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{new Date(req.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                className="btn-success"
                                onClick={() => handleApproveTransfer(req.id)}
                                disabled={acting === req.id}
                              >
                                <CheckCircle size={12} />
                                {acting === req.id ? '…' : 'Approve'}
                              </button>
                              <button
                                className="btn-danger"
                                onClick={() => handleRejectTransfer(req.id)}
                                disabled={acting === req.id}
                              >
                                <XCircle size={12} />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
