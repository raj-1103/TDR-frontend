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
    <div style={{ background: '#1a2f4a', borderBottom: '1px solid var(--border)', padding: '7px 0', overflow: 'hidden' }}>
      <div className="flex items-center gap-4" style={{ overflow: 'hidden' }}>
        <div style={{ background: '#dc2626', color: 'white', padding: '2px 10px', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', whiteSpace: 'nowrap', flexShrink: 0, marginLeft: 16 }}>
          NOTICE
        </div>
        <div className="ticker-wrap flex-1">
          <div className="ticker-content">
            {repeated.map((n, i) => (
              <span key={i} style={{ fontSize: 12, color: '#cbd5e1', marginRight: 48 }}>{n}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
