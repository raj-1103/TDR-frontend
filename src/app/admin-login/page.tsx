'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { adminLogin } from '@/lib/api'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'

export default function AdminLoginPage() {
  const { setUser } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await adminLogin(form)
      if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('Access denied — admin credentials required')
      }
      setUser(user)
      router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Background gradient */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(124,58,237,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 60, height: 60, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 32px rgba(124,58,237,0.3)' }}>
            <ShieldCheck size={30} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Admin Portal</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>Surat Municipal Corporation — Restricted Access</p>
        </div>

        <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 12, padding: '10px 16px', marginBottom: 20, fontSize: 12, color: 'rgba(167,139,250,0.8)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={13} /> This portal is for authorised SMC administrators only.
        </div>

        <div className="glass-card" style={{ padding: 32, borderColor: 'rgba(124,58,237,0.2)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Admin Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="email" className="tdr-input" style={{ paddingLeft: 36 }} placeholder="admin@smc.gov.in" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type={show ? 'text' : 'password'} className="tdr-input" style={{ paddingLeft: 36, paddingRight: 40 }} placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#f87171' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '12px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white',
              fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.6 : 1, transition: 'all 0.2s',
            }}>
              {loading ? 'Authenticating…' : <><ShieldCheck size={15} /> Sign In to Admin Portal</>}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(148,163,184,0.4)', marginTop: 20 }}>
          <Link href="/login" style={{ color: 'rgba(148,163,184,0.5)', textDecoration: 'none' }}>← User Portal Login</Link>
        </p>
      </div>
    </div>
  )
}
