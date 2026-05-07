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
import { CheckCircle, XCircle, RefreshCw, ShieldCheck, Eye, ArrowLeftRight, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody } from '@/components/Card'

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
        const raw = actionsRes.value.actions || []
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
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <main>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 20 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Link href="/dashboard" style={{ color: '#94a3b8', textDecoration: 'none' }} className="hover:text-blue-500">Dashboard</Link>
              <span className="mx-2 opacity-50">/</span>
              Governance Panel
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>Administrative Oversight</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500 }}>
              Review and authorize pending TDR lifecycle operations across the decentralized ledger.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, background: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 900, padding: '6px 12px', borderRadius: 20, border: '1px solid rgba(16,185,129,0.2)', textTransform: 'uppercase' }}>
              <ShieldCheck size={14} /> Authority: {user?.role}
            </div>
            <button className="btn-ghost" onClick={load} disabled={loading} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, height: 38, padding: '0 14px', fontSize: 13, fontWeight: 700 }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Synchronize
            </button>
            {user?.role === 'SUPERADMIN' && (
              <Link href="/admin/users" className="btn-primary" style={{ fontSize: 13, height: 38, padding: '0 16px', borderRadius: 12, fontWeight: 800, boxShadow: '0 4px 12px rgba(37,99,235,0.15)' }}>
                User Registry
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
          {[
            { label: 'Pending Issuance', value: issues.length, color: '#f59e0b', icon: <CheckCircle size={20} /> },
            { label: 'Pending Transfers', value: transfers.length, color: '#2563eb', icon: <ArrowLeftRight size={20} /> },
            { label: 'System Queue', value: issues.length + transfers.length, color: '#7c3aed', icon: <Clock size={20} /> },
          ].map(({ label, value, color, icon }) => (
            <Card key={label} hoverable className="border-slate-300">
              <CardBody className="p-6 flex items-center justify-between">
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#0f172a', lineHeight: 1 }}>{value}</div>
                </div>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${color}10`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {icon}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-secondary)', fontWeight: 600 }}>
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-blue-500 opacity-20" />
            Querying Blockchain Consensus...
          </div>
        ) : (
          <div className="space-y-12">
            {/* Issue Requests */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Asset Issuance Queue ({issues.length})
                </h2>
              </div>

              {issues.length === 0 ? (
                <Card className="p-16 text-center border-dashed border-2 border-slate-300 bg-slate-50/50">
                  <CheckCircle size={48} className="mx-auto mb-4 text-slate-300" />
                  <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>No pending issuance requests found in the ledger.</p>
                </Card>
              ) : (
                <Card className="border-slate-300 overflow-hidden shadow-xl shadow-slate-200/40">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tdr-table w-full">
                      <thead>
                        <tr>
                          <th>Authority Identifier</th>
                          <th>TDR Asset ID</th>
                          <th>Consensus Progress</th>
                          <th>Applicant</th>
                          <th>Asset Area</th>
                          <th>Timestamp</th>
                          <th>Verify</th>
                          <th style={{ textAlign: 'right' }}>Authorization</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issues.map(req => (
                          <tr key={req.id}>
                            <td>
                              <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#64748b', background: '#f8fafc', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                {(req.id || '').slice(0, 12)}
                              </code>
                            </td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{req.details?.tdrID || req.details?.TdrID}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ width: 100, height: 6, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                  <div style={{ width: `${(req.approvals / req.totalRequired) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', boxShadow: '0 0 10px rgba(16,185,129,0.3)' }} />
                                </div>
                                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>{req.approvals} / {req.totalRequired} Signatures</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-200">
                                  {(userMap[req.requester] || 'U').charAt(0)}
                                </div>
                                {userMap[req.requester] || (req.requester ? `${req.requester.slice(0, 8)}...` : 'Unknown')}
                              </div>
                            </td>
                            <td style={{ fontWeight: 600 }}>{(req.details?.area || req.details?.Area || 0).toLocaleString()} <span className="text-[10px] text-slate-400 font-bold uppercase ml-0.5">m²</span></td>
                            <td style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                              <button 
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors border-none bg-transparent cursor-pointer"
                                onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/download-pdf?docID=${req.details?.docID || req.details?.DocID}`, '_blank')}
                                title="Verify Document PDF"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                  className="btn-success"
                                  style={{ height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}
                                  onClick={() => handleApproveIssue(req.id)}
                                  disabled={acting === req.id}
                                >
                                  {acting === req.id ? 'Wait...' : 'Approve'}
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, background: 'transparent', border: '1px solid #fee2e2', color: '#ef4444' }}
                                  onClick={() => handleRejectIssue(req.id)}
                                  disabled={acting === req.id}
                                >
                                  Reject
                                </button>
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

            {/* Transfer Requests */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 style={{ fontSize: 14, fontWeight: 900, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Ownership Transfer Queue ({transfers.length})
                </h2>
              </div>

              {transfers.length === 0 ? (
                <Card className="p-16 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
                  <ArrowLeftRight size={48} className="mx-auto mb-4 text-slate-300" />
                  <p style={{ color: '#64748b', fontSize: 14, fontWeight: 600 }}>No pending transfer requests in the authorization pool.</p>
                </Card>
              ) : (
                <Card className="border-slate-200 overflow-hidden shadow-xl shadow-slate-200/40">
                  <div style={{ overflowX: 'auto' }}>
                    <table className="tdr-table w-full">
                      <thead>
                          <tr>
                            <th>Authority Identifier</th>
                            <th>TDR Asset ID</th>
                            <th>Consensus Progress</th>
                            <th>Current Owner</th>
                            <th>Recipient</th>
                            <th>Timestamp</th>
                            <th>Verify</th>
                            <th style={{ textAlign: 'right' }}>Authorization</th>
                          </tr>
                      </thead>
                      <tbody>
                        {transfers.map(req => (
                          <tr key={req.id}>
                            <td>
                              <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#64748b', background: '#f8fafc', padding: '4px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                                {(req.id || '').slice(0, 12)}
                              </code>
                            </td>
                            <td style={{ fontWeight: 800, color: '#0f172a' }}>{req.details?.tdrID || req.details?.TdrID}</td>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <div style={{ width: 100, height: 6, background: '#f1f5f9', borderRadius: 10, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                  <div style={{ width: `${(req.approvals / req.totalRequired) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #60a5fa)', boxShadow: '0 0 10px rgba(59,130,246,0.3)' }} />
                                </div>
                                <span style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>{req.approvals} / {req.totalRequired} Signatures</span>
                              </div>
                            </td>
                            <td style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
                              {userMap[req.requester] || (req.requester ? `${req.requester.slice(0, 8)}...` : 'Unknown')}
                            </td>
                            <td style={{ fontSize: 12, fontWeight: 600, color: '#64748b' }}>
                              <code className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{(req.details?.toOwner || req.details?.ToOwner || '').slice(0, 10)}...</code>
                            </td>
                            <td style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                            <td>
                              <button 
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-blue-600 transition-colors border-none bg-transparent cursor-pointer"
                                onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/download-pdf?docID=${req.details?.docID || req.details?.DocID}`, '_blank')}
                                title="Verify Document PDF"
                              >
                                <Eye size={18} />
                              </button>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button
                                  className="btn-success"
                                  style={{ height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 800 }}
                                  onClick={() => handleApproveTransfer(req.id)}
                                  disabled={acting === req.id}
                                >
                                  {acting === req.id ? 'Wait...' : 'Approve'}
                                </button>
                                <button
                                  className="btn-danger"
                                  style={{ height: 34, padding: '0 12px', borderRadius: 8, fontSize: 12, fontWeight: 800, background: 'transparent', border: '1px solid #fee2e2', color: '#ef4444' }}
                                  onClick={() => handleRejectTransfer(req.id)}
                                  disabled={acting === req.id}
                                >
                                  Reject
                                </button>
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
        )}
      </main>
    </div>
  )
}
