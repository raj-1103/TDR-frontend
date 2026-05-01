'use client'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import NoticeTicker from '@/components/NoticeTicker'
import { 
  Shield, 
  Database, 
  ArrowLeftRight, 
  CheckCircle, 
  FileSearch, 
  Zap, 
  Globe, 
  Lock, 
  Clock 
} from 'lucide-react'

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', background: '#ffffff' }}>
      <Navbar />
      <NoticeTicker />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-4" style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/" style={{ color: 'var(--navy-400)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>🏠 Home</Link>
        <span style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>›</span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Dashboard</span>
      </div>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-4">
        <div className="hero-card" style={{ padding: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40 }}>
          {/* Subtle patterns */}
          <div style={{ position: 'absolute', right: '10%', top: '20%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)', borderRadius: '50%' }} />
          
          <div style={{ maxWidth: 620, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(52,211,153,0.15)', padding: '6px 14px', borderRadius: 20, marginBottom: 24, fontSize: 12, fontWeight: 700, color: '#34d399', border: '1px solid rgba(52,211,153,0.3)' }}>
              <span style={{ width: 8, height: 8, background: '#34d399', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 10px #34d399' }} />
              LIVE · 14 blockchain nodes · All systems operational
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-0.02em' }}>
              Transparent & Immutable<br />
              <span style={{ color: '#60a5fa' }}>TDR Record Keeping</span>
            </h1>

            <p style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)', marginBottom: 36, maxWidth: 520 }}>
              The SMC e-TDR platform leverages Distributed Ledger Technology to ensure complete transparency in the issuance, tracking, and transfer of Transferable Development Rights.
            </p>

            <div style={{ display: 'flex', gap: 16 }}>
              <Link href="/dashboard" className="btn-primary" style={{ background: 'white', color: 'var(--navy-dark)', padding: '14px 28px', fontSize: 15 }}>
                Explore Services →
              </Link>
              <Link href="/verify" className="btn-hero-ghost" style={{ padding: '14px 28px', fontSize: 15 }}>
                <Globe size={18} /> View Public Ledger
              </Link>
            </div>
          </div>

          {/* Visual Side */}
          <div style={{ position: 'relative', flexShrink: 0, padding: 40 }}>
            {/* Concentric rings from image */}
            <div style={{ width: 260, height: 260, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <div style={{ width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 140, height: 140, background: 'rgba(255,255,255,0.03)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.15)', boxShadow: 'inset 0 0 40px rgba(255,255,255,0.05)' }}>
                  <Database size={64} color="white" style={{ opacity: 0.9 }} />
                </div>
              </div>

              {/* Green check icon from image */}
              <div style={{ position: 'absolute', top: '15%', right: '5%', width: 36, height: 36, background: '#10b981', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 15px rgba(16,185,129,0.4)' }}>
                <CheckCircle size={20} color="white" />
              </div>

              {/* Blue Blockchain Synced badge from image */}
              <div style={{ position: 'absolute', bottom: '10%', right: '-10%', background: '#3b82f6', color: 'white', padding: '10px 18px', borderRadius: 10, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 12px 24px rgba(59,130,246,0.4)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Zap size={16} fill="white" />
                BLOCKCHAIN SYNCED
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-6 pb-8">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {[
            { icon: Database, label: 'Total TDRs Issued', value: '1,284', color: 'var(--navy-400)', trend: 'up' },
            { icon: Shield, label: 'Verified Documents', value: '45,021', color: 'var(--emerald)', trend: 'up' },
            { icon: ArrowLeftRight, label: 'Transfers Processed', value: '892', color: '#f59e0b', trend: 'down' },
            { icon: CheckCircle, label: 'Pending Approvals', value: '14', color: '#7c3aed', trend: 'neutral' },
          ].map(({ icon: Icon, label, value, color, trend }) => (
            <div key={label} className="glass-card animate-in" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 48, height: 48, background: `${color}10`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={24} color={color} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>{value}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</div>
                </div>
              </div>
              <div style={{ opacity: 0.3 }}>
                <Clock size={20} />
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
            { href: '/register', icon: Shield, title: 'Register Identity', desc: 'Create your blockchain identity on Hyperledger Fabric with Fabric CA enrollment.', color: 'var(--navy-400)' },
            { href: '/dashboard/upload', icon: Database, title: 'Upload TDR Document', desc: 'Upload and hash your TDR document. Immutably recorded on chain.', color: 'var(--emerald)' },
            { href: '/dashboard/issue', icon: CheckCircle, title: 'Request TDR Issuance', desc: 'Submit a request to issue TDR for your surrendered land.', color: '#f59e0b' },
            { href: '/dashboard/transfer', icon: ArrowLeftRight, title: 'Transfer TDR', desc: 'Initiate a transfer of TDR rights to another registered party.', color: '#7c3aed' },
            { href: '/verify', icon: FileSearch, title: 'Verify Document', desc: 'Verify authenticity of any TDR document using its hash.', color: '#06b6d4' },
            { href: '/admin', icon: Lock, title: 'Admin Approvals', desc: 'Admins can approve or reject pending TDR issue and transfer requests.', color: 'var(--red)' },
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
