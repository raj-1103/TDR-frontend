'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getActivityLogs, getMutationGraph, ActivityLog } from '@/lib/api'
import { RefreshCw, ShieldCheck, Clock, Info, GitBranch, Search, Hash, User, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface MutationEdge {
  source: string
  target: string
  label: string
  action: string
  txID: string
  approvedBy?: string
  approverRole?: string
  approvedAt?: string
}

interface MutationNode {
  id: string
  label: string
  type: string
  role?: string
}

interface GraphData {
  docID: string
  chain: string
  nodes: MutationNode[]
  edges: MutationEdge[]
}

export default function AdminLogsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'activity' | 'mutation'>('activity')

  // Mutation graph state
  const [docIDInput, setDocIDInput] = useState('')
  const [graphLoading, setGraphLoading] = useState(false)
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [graphError, setGraphError] = useState('')

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

  const fetchGraph = async () => {
    if (!docIDInput.trim()) return
    setGraphLoading(true)
    setGraphError('')
    setGraph(null)
    try {
      const data = await getMutationGraph(docIDInput.trim())
      setGraph(data as any)
    } catch (e: any) {
      setGraphError(e.message || 'Document not found')
    } finally {
      setGraphLoading(false)
    }
  }

  const getNodeLabel = (nodes: MutationNode[], id: string) =>
    nodes.find(n => n.id === id)?.label || id

  const getActionColor = (action: string) => {
    if (action.includes('APPROVE')) return 'var(--emerald)'
    if (action.includes('REJECT')) return 'var(--red)'
    if (action.includes('CREATE') || action.includes('UPLOAD')) return 'var(--navy-400)'
    return 'var(--text-secondary)'
  }

  const getRoleBadgeColor = (role: string) => {
    const map: Record<string, string> = {
      JUNIOR: '#6366f1', ASSISTANT: '#8b5cf6',
      TDO: '#ec4899', CITY: '#f59e0b',
      COMMISSIONER: '#10b981', ADMIN: '#3b82f6',
      SUPERADMIN: '#ef4444',
    }
    return map[role] || '#6b7280'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <main>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Dashboard</Link>
              {' › '}
              <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Admin</Link>
              {' › Activity Logs'}
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>
              System Activity Logs
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              Audit trail of all administrative actions and TDR ownership history.
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

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)' }}>
          {[
            { key: 'activity', label: 'Activity Log', icon: <Info size={14} /> },
            { key: 'mutation', label: 'TDR Mutation Index', icon: <GitBranch size={14} /> },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 18px', border: 'none', cursor: 'pointer',
                background: 'transparent', fontSize: 13, fontWeight: 600,
                borderBottom: activeTab === tab.key ? '2px solid var(--navy-400)' : '2px solid transparent',
                color: activeTab === tab.key ? 'var(--navy-400)' : 'var(--text-secondary)',
                marginBottom: -1,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab 1: Activity Log ── */}
        {activeTab === 'activity' && (
          loading ? (
            <div style={{ color: 'var(--text-secondary)', fontSize: 14, padding: '40px 0', textAlign: 'center' }}>
              Fetching audit logs...
            </div>
          ) : (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table className="tdr-table" style={{ minWidth: 900 }}>
                <thead>
                  <tr>
                    <th>#</th>
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
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                        No activity logs found.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)', width: 40 }}>
                          {i + 1}
                        </td>
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
                              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                {log.actorId.slice(0, 12)}...
                              </div>
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
          )
        )}

        {/* ── Tab 2: TDR Mutation Index ── */}
        {activeTab === 'mutation' && (
          <div>
            {/* Search bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
              <input
                value={docIDInput}
                onChange={e => setDocIDInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchGraph()}
                placeholder="Enter Document ID (e.g. TDR-2026-XXXX)"
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 8,
                  border: '1px solid var(--border)',
                  background: '#fff', color: 'var(--navy-700)',
                  fontSize: 14, outline: 'none',
                }}
              />
              <button
                onClick={fetchGraph}
                disabled={graphLoading || !docIDInput.trim()}
                style={{
                  padding: '10px 20px', borderRadius: 8, border: 'none',
                  background: 'var(--navy-800)', color: '#fff',
                  fontSize: 14, cursor: graphLoading ? 'not-allowed' : 'pointer',
                  opacity: graphLoading ? 0.7 : 1,
                  display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
                }}
              >
                <Search size={15} />
                {graphLoading ? 'Loading...' : 'Fetch History'}
              </button>
            </div>

            {graphError && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                color: '#ef4444', borderRadius: 8, padding: '12px 16px',
                fontSize: 13, marginBottom: 20,
              }}>
                {graphError}
              </div>
            )}

            {graph && (
              <>
                {/* Chain summary */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(37,99,235,0.05)',
                  border: '1px solid rgba(37,99,235,0.15)',
                  borderRadius: 8, padding: '12px 18px', marginBottom: 24,
                }}>
                  <GitBranch size={15} color="#2563eb" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                    Ownership chain:
                  </span>
                  <span style={{ fontSize: 13, color: 'var(--navy-700)', fontFamily: 'var(--font-mono)' }}>
                    {graph.chain || 'No transfers yet'}
                  </span>
                </div>

                {/* Indexed table */}
                <div className="glass-card" style={{ overflowX: 'auto' }}>
                  <table className="tdr-table" style={{ minWidth: 900 }}>
                    <thead>
                      <tr>
                        <th style={{ width: 40 }}>#</th>
                        <th>Action</th>
                        <th>From Owner</th>
                        <th>To Owner</th>
                        <th>Approved By</th>
                        <th>Role</th>
                        <th>Approved At</th>
                        <th>Tx ID</th>
                        <th>Transfer Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {graph.edges.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                            No transfer history found for this document.
                          </td>
                        </tr>
                      ) : (
                        graph.edges.map((edge, i) => (
                          <tr key={i}>
                            {/* Index */}
                            <td style={{ fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center' }}>
                              {i + 1}
                            </td>

                            {/* Action */}
                            <td>
                              <span style={{
                                fontSize: 10, fontWeight: 700, padding: '3px 8px',
                                borderRadius: 4, background: '#f1f5f9',
                                color: getActionColor(edge.action),
                              }}>
                                {edge.action.replace(/_/g, ' ')}
                              </span>
                            </td>

                            {/* From owner */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <User size={12} color="var(--text-secondary)" />
                                <span style={{ fontSize: 13, fontWeight: 500 }}>
                                  {getNodeLabel(graph.nodes, edge.source)}
                                </span>
                              </div>
                            </td>

                            {/* To owner */}
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <ArrowRight size={12} color="var(--emerald)" />
                                <span style={{ fontSize: 13, fontWeight: 500 }}>
                                  {getNodeLabel(graph.nodes, edge.target)}
                                </span>
                              </div>
                            </td>

                            {/* Approved by */}
                            <td>
                              {edge.approvedBy ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <ShieldCheck size={12} color="#10b981" />
                                  <span style={{ fontSize: 13 }}>{edge.approvedBy}</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
                              )}
                            </td>

                            {/* Approver role badge */}
                            <td>
                              {edge.approverRole ? (
                                <span style={{
                                  fontSize: 10, fontWeight: 700, padding: '2px 8px',
                                  borderRadius: 20, color: '#fff',
                                  background: getRoleBadgeColor(edge.approverRole),
                                }}>
                                  {edge.approverRole}
                                </span>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
                              )}
                            </td>

                            {/* Approved at */}
                            <td style={{ whiteSpace: 'nowrap' }}>
                              {edge.approvedAt ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                                  <Clock size={11} />
                                  {new Date(edge.approvedAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </div>
                              ) : (
                                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>—</span>
                              )}
                            </td>

                            {/* Tx ID */}
                            <td>
                              <code style={{
                                fontSize: 10, fontFamily: 'var(--font-mono)',
                                color: 'var(--navy-400)',
                              }}>
                                {edge.txID ? edge.txID.slice(0, 16) + '...' : '—'}
                              </code>
                            </td>

                            {/* Transfer timestamp */}
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--text-secondary)' }}>
                                <Clock size={11} />
                                {edge.label}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Participants footer */}
                <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Participants:
                  </span>
                  {graph.nodes
                    .filter(n => n.type === 'owner')
                    .map((node, i) => (
                      <span key={i} style={{
                        fontSize: 12, padding: '3px 10px', borderRadius: 20,
                        background: '#f1f5f9', border: '1px solid var(--border)',
                        color: 'var(--navy-700)',
                        display: 'flex', alignItems: 'center', gap: 5,
                      }}>
                        <User size={11} /> {node.label}
                      </span>
                    ))}
                </div>
              </>
            )}

            {/* Empty state before search */}
            {!graph && !graphError && !graphLoading && (
              <div style={{
                textAlign: 'center', padding: '60px 24px',
                border: '1px dashed var(--border)', borderRadius: 12,
                color: 'var(--text-secondary)',
              }}>
                <GitBranch size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
                  Enter a Document ID to view its mutation history
                </div>
                <div style={{ fontSize: 13 }}>
                  Shows full ownership chain with approver names, roles, and timestamps
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}