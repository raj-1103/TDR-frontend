'use client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import NoticeTicker from '@/components/NoticeTicker'
import { Shield, Database, ArrowLeftRight, CheckCircle, FileSearch, Zap, Globe, Lock } from 'lucide-react'

export default function Home() {
  return (
    <div className="mesh-bg" style={{ minHeight: '100vh' }}>
      <Navbar />
      <NoticeTicker />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 py-3" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
        🏠 <Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 6px' }}>›</span>
        <span style={{ color: 'var(--text-primary)' }}>Dashboard</span>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="glass-card" style={{ padding: '48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, overflow: 'hidden', position: 'relative' }}>
          {/* BG decoration */}
          <div style={{ position: 'absolute', right: 0, top: 0, width: 400, height: '100%', background: 'radial-gradient(ellipse at 80% 50%, rgba(30,58,95,0.6) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ maxWidth: 560, position: 'relative', zIndex: 1 }}>
            <div className="badge badge-live" style={{ marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, background: '#34d399', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              LIVE · 14 blockchain nodes · All systems operational
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 700, lineHeight: 1.15, marginBottom: 16 }}>
              Transparent &amp; Immutable<br />
              <span className="gradient-text">TDR Record Keeping</span>
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 28, maxWidth: 480 }}>
              The SMC e-TDR platform leverages Distributed Ledger Technology to ensure complete transparency in the issuance, tracking, and transfer of Transferable Development Rights.
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link href="/dashboard" className="btn-primary" style={{ fontSize: 14, padding: '11px 22px' }}>
                Explore Services →
              </Link>
              <Link href="/verify" className="btn-ghost" style={{ fontSize: 14, padding: '11px 22px' }}>
                <Globe size={16} /> View Public Ledger
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 180, height: 180, background: 'rgba(15,31,53,0.8)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ width: 140, height: 140, background: 'rgba(30,58,95,0.6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.2)' }}>
                <Database size={56} color="#3b82f6" />
              </div>
              {/* Orbiting dot */}
              <div style={{ position: 'absolute', top: -4, right: -4, width: 36, height: 36, background: 'linear-gradient(135deg,#10b981,#059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={16} color="white" />
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '6px 14px', fontSize: 12, color: '#34d399', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, background: '#34d399', borderRadius: '50%' }} /> Blockchain Synced
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 pb-8">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { icon: Database, label: 'Total TDRs Issued', value: '—', color: '#3b82f6' },
            { icon: Shield, label: 'Verified Documents', value: '—', color: '#10b981' },
            { icon: ArrowLeftRight, label: 'Transfers Processed', value: '—', color: '#f59e0b' },
            { icon: CheckCircle, label: 'Pending Approvals', value: '—', color: '#a78bfa' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card animate-in" style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 40, height: 40, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={18} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: color, marginTop: 4 }}>↑ Live data</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Portal Services</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {[
            { href: '/register', icon: Shield, title: 'Register Identity', desc: 'Create your blockchain identity on Hyperledger Fabric with Fabric CA enrollment.', color: '#3b82f6' },
            { href: '/dashboard/upload', icon: Database, title: 'Upload TDR Document', desc: 'Upload and hash your TDR document. Immutably recorded on chain.', color: '#10b981' },
            { href: '/dashboard/issue', icon: CheckCircle, title: 'Request TDR Issuance', desc: 'Submit a request to issue TDR for your surrendered land.', color: '#f59e0b' },
            { href: '/dashboard/transfer', icon: ArrowLeftRight, title: 'Transfer TDR', desc: 'Initiate a transfer of TDR rights to another registered party.', color: '#a78bfa' },
            { href: '/verify', icon: FileSearch, title: 'Verify Document', desc: 'Verify authenticity of any TDR document using its hash.', color: '#06b6d4' },
            { href: '/admin', icon: Lock, title: 'Admin Approvals', desc: 'Admins can approve or reject pending TDR issue and transfer requests.', color: '#f43f5e' },
          ].map(({ href, icon: Icon, title, desc, color }) => (
            <Link key={href} href={href} style={{ textDecoration: 'none' }}>
              <div className="glass-card animate-in" style={{ padding: '24px', height: '100%', transition: 'border-color 0.2s, transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}40`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
              >
                <div style={{ width: 44, height: 44, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={20} color={color} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
                <div style={{ marginTop: 14, fontSize: 12, color, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Get started →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
