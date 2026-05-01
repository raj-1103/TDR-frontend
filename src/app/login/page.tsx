'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { userLogin } from '@/lib/api'
import { Shield, Mail, AlertCircle, ArrowRight, RefreshCw, Lock, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const { user, setUser, initializing } = useAuth()
  const router = useRouter()
  
  useEffect(() => {
    if (!initializing && user) {
      router.push('/dashboard')
    }
  }, [user, initializing, router])

  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await userLogin(form)
      setUser(user)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#1d4ed8,#0891b2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>SMC e-TDR Portal</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            Sign in to your secure blockchain account
          </p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="email"
                  className="tdr-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="tdr-input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#f87171' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
              {loading ? 'Signing in…' : <><ArrowRight size={15} /> Sign In</>}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 24 }}>
            No account? <Link href="/register" style={{ color: 'var(--navy-400)', textDecoration: 'none', fontWeight: 700 }}>Register here</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 12 }}>
            Admin? <Link href="/admin-login" style={{ color: 'var(--text-secondary)', textDecoration: 'underline' }}>Admin Portal →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
