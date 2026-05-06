'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getActivityLogs, ActivityLog } from '@/lib/api'
import { RefreshCw, List, ShieldCheck, User, Clock, Info } from 'lucide-react'
import { toast } from 'sonner'

export default function AdminLogsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    if (user.role !== 'SUPERADMIN') { router.push('/admin'); return }
    load()
  }, [user])

  const load = async () => {
    setLoading(true)
    try {
      const res = await getActivityLogs()
      setLogs(res.logs || [])
    } catch (e: any) {
      toast.error(e.message)
    }
    setLoading(false)
  }

  const getActionColor = (action: string) => {
    if (action.includes('APPROVE')) return 'var(--emerald)'
    if (action.includes('REJECT')) return 'var(--red)'
    if (action.includes('CREATE') || action.includes('UPLOAD')) return 'var(--navy-400)'
    return 'var(--text-secondary)'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link> › <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Admin</Link> › Activity Logs
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>System Activity Logs</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Audit trail of all administrative actions and system events.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--emerald)', fontWeight: 600 }}>
              <ShieldCheck size={14} /> SUPERADMIN ACCESS
            </div>
            <button className="btn-ghost" onClick={load} disabled={loading}>
              <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
            Fetching audit logs...
          </div>
        ) : (
          <div className="glass-card" style={{ overflowX: 'auto' }}>
            <table className="tdr-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Admin / Actor</th>
                  <th>Role</th>
                  <th>Action</th>
                  <th>Target ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                      No activity logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log, i) => (
                    <tr key={i}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 12, color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} opacity={0.6} />
                          {new Date(log.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--navy-400)' }}>
                            {log.actorName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{log.actorName}</div>
                            <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{log.actorId.slice(0, 12)}...</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#f1f5f9', color: 'var(--text-secondary)' }}>
                          {log.role}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 11, color: getActionColor(log.action) }}>
                          <Info size={12} />
                          {log.action}
                        </div>
                      </td>
                      <td>
                        <code style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--navy-400)' }}>
                          {log.targetId ? (log.targetId.length > 15 ? log.targetId.slice(0, 15) + '...' : log.targetId) : '-'}
                        </code>
                      </td>
                      <td style={{ fontSize: 12, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
