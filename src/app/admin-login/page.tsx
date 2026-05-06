'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { adminLogin } from '@/lib/api'
import { ShieldCheck, Mail, Lock, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react'
import { Card, CardBody } from '@/components/Card'

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
      const authorityRoles = ['ADMIN', 'SUPERADMIN', 'JUNIOR', 'ASSISTANT', 'TDO', 'CITY', 'COMMISSIONER']
      if (!authorityRoles.includes(user.role)) {
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
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Decorative background elements */}
      <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-5%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', borderRadius: '50%' }} />

      <div style={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 20px 40px -10px rgba(15,23,42,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <ShieldCheck size={36} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 8 }}>Secure Oversight</h1>
          <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>Surat Municipal Corporation · Admin Access</p>
        </div>

        <Card className="shadow-2xl shadow-slate-200/60 border-slate-200">
          <CardBody className="p-10">
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 16px', marginBottom: 32, fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
              <ShieldCheck size={16} className="text-blue-600" /> Authorized personnel only. All access is logged.
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Official Credentials</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="email" 
                    className="tdr-input" 
                    style={{ paddingLeft: 46, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 600 }} 
                    placeholder="admin@smc.gov.in" 
                    value={form.email} 
                    onChange={e => setForm({ ...form, email: e.target.value })} 
                    required 
                    autoFocus 
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>Security Key</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type={show ? 'text' : 'password'} 
                    className="tdr-input" 
                    style={{ paddingLeft: 46, paddingRight: 48, height: 52, borderRadius: 14, fontSize: 15, fontWeight: 600 }} 
                    placeholder="••••••••" 
                    value={form.password} 
                    onChange={e => setForm({ ...form, password: e.target.value })} 
                    required 
                  />
                  <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'white', border: '1px solid #e2e8f0', cursor: 'pointer', color: '#64748b', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {show ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', fontSize: 13, color: '#ef4444', fontWeight: 600 }}>
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                height: 56, borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: '#0f172a', color: 'white',
                fontSize: 16, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all 0.2s', boxShadow: '0 10px 20px -5px rgba(15,23,42,0.4)',
                opacity: loading ? 0.7 : 1,
              }} className="hover:scale-[1.02] active:scale-[0.98]">
                {loading ? (
                  <RefreshCw size={20} className="animate-spin opacity-50" />
                ) : (
                  <><ShieldCheck size={20} /> Access Admin Console</>
                )}
              </button>
            </form>
          </CardBody>
        </Card>

        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link href="/login" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 700, fontSize: 14 }} className="hover:text-blue-600 transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={14} className="opacity-50" /> Switch to Citizen Portal
          </Link>
        </div>
      </div>
    </div>
  )
}
