'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { adminRegister } from '@/lib/api'
import { ShieldCheck, Mail, Lock, User, Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'

export default function AdminRegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', name: '', password: '', confirmPassword: '', inviteCode: '' })
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      await adminRegister({
        email: form.email,
        name: form.name,
        password: form.password,
        inviteCode: form.inviteCode,
      })
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <CheckCircle size={32} color="var(--emerald)" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Admin Account Created</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
            Your admin account is pending SuperAdmin approval. You'll be notified by email once activated.
          </p>
          <Link href="/admin-login" style={{ textDecoration: 'none' }}>
            <button style={{ padding: '11px 24px', background: 'var(--navy-accent)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Go to Admin Login
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 30%, rgba(37,99,235,0.03) 0%, transparent 60%)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, background: 'var(--navy-accent)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 12px rgba(15,23,42,0.1)' }}>
            <ShieldCheck size={26} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>Admin Registration</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>Requires a valid invite code from SuperAdmin</p>
        </div>

        <div className="glass-card" style={{ padding: 32, borderColor: 'var(--border)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Officer Name', icon: User },
              { key: 'email', label: 'Official Email', type: 'email', placeholder: 'officer@smc.gov.in', icon: Mail },
            ].map(({ key, label, type, placeholder, icon: Icon }) => (
              <div key={key}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Icon size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type={type} className="tdr-input" style={{ paddingLeft: 34 }} placeholder={placeholder} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} required />
                </div>
              </div>
            ))}

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type={show ? 'text' : 'password'} className="tdr-input" style={{ paddingLeft: 34, paddingRight: 40 }} placeholder="Min 8 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type={show ? 'text' : 'password'} className="tdr-input" style={{ paddingLeft: 34 }} placeholder="Re-enter password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                Invite Code <span style={{ color: '#f59e0b' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input type="text" className="tdr-input" style={{ paddingLeft: 34, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em' }} placeholder="Provided by SuperAdmin" value={form.inviteCode} onChange={e => setForm({ ...form, inviteCode: e.target.value })} required />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Contact your SuperAdmin for an invite code.</div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#f87171' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              padding: '12px', borderRadius: 8, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: 'var(--navy-accent)', color: 'white',
              fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: loading ? 0.6 : 1, marginTop: 4,
            }}>
              {loading ? 'Registering on Fabric CA…' : <><ShieldCheck size={15} /> Register Admin Account</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
            Already registered? <Link href="/admin-login" style={{ color: 'var(--navy-400)', textDecoration: 'none', fontWeight: 600 }}>Sign in →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
