'use client'
const notices = [
  '📋 New TDR Guidelines effective 01-Apr-2026 — Refer Circular No. SMC/TDR/2026/04',
  '🔧 System maintenance scheduled on 20-Apr-2026 from 11:00 PM to 2:00 AM IST',
  '📄 TDR transfer fee revised — please refer to the updated schedule',
  '✅ Blockchain network operational — 14 nodes active',
]

export default function NoticeTicker() {
  const repeated = [...notices, ...notices]
  return (
    <div style={{ background: '#ffffff', borderBottom: '1px solid var(--border)', padding: '8px 0', overflow: 'hidden' }}>
      <div className="flex items-center gap-4" style={{ overflow: 'hidden' }}>
        <div style={{ background: '#b45309', color: 'white', padding: '3px 12px', borderRadius: 4, fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 20 }}>
          NOTICE
        </div>
        <div className="ticker-wrap flex-1">
          <div className="ticker-content" style={{ display: 'flex', alignItems: 'center' }}>
            {repeated.map((n, i) => (
              <span key={i} style={{ fontSize: 13, color: 'var(--text-primary)', marginRight: 64, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
