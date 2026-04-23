'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { register, sendOTP, verifyOTP } from '@/lib/api'
import { Shield, Mail, User, AlertCircle, ArrowRight, Lock, RefreshCw, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const { setUser } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<'details' | 'otp'>('details')
  const [form, setForm] = useState({ email: '', name: '', org: 'org1' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register({ email: form.email, name: form.name, org: form.org })
      setStep('otp')
      setCountdown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[idx] = val.slice(-1)
    setOtp(next)
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus()
    if (val && idx === 5 && next.every(d => d !== '')) handleVerify(next.join(''))
  }

  const handleOTPKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(''))
      handleVerify(pasted)
    }
  }

  const handleVerify = async (code?: string) => {
    const finalOTP = code || otp.join('')
    if (finalOTP.length !== 6) return
    setError('')
    setLoading(true)
    try {
      const res = await verifyOTP(form.email, finalOTP)
      setUser({
        fabricID: res.fabricID,
        email: form.email,
        name: form.name || form.email.split('@')[0],
        role: (res.role as any) || 'USER',
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'OTP verification failed')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setOtp(['', '', '', '', '', ''])
    try {
      await sendOTP(form.email)
      setCountdown(60)
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <div className="mesh-bg" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, background: 'linear-gradient(135deg,#1d4ed8,#0891b2)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700 }}>Create Account</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6 }}>
            {step === 'details' ? 'Register your identity on the Fabric blockchain' : `Verify your email — OTP sent to ${form.email}`}
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {['Details', 'Verify Email'].map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: i === 0 && step === 'details' ? '#1d4ed8' : i === 0 ? '#10b981' : step === 'otp' ? '#1d4ed8' : 'rgba(255,255,255,0.1)',
                  border: '2px solid',
                  borderColor: i === 0 ? (step === 'otp' ? '#10b981' : '#1d4ed8') : step === 'otp' ? '#1d4ed8' : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: 'white',
                }}>
                  {i === 0 && step === 'otp' ? <CheckCircle size={12} /> : i + 1}
                </div>
                <span style={{ fontSize: 12, color: (i === 0 && step === 'details') || (i === 1 && step === 'otp') ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                  {label}
                </span>
              </div>
              {i < 1 && <div style={{ width: 32, height: 1, background: step === 'otp' ? '#10b981' : 'var(--border)' }} />}
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          {step === 'details' ? (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="text" className="tdr-input" style={{ paddingLeft: 36 }} placeholder="Rajesh Patel" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required autoFocus />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                  <input type="email" className="tdr-input" style={{ paddingLeft: 36 }} placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Organisation</label>
                <select className="tdr-input" value={form.org} onChange={e => setForm({ ...form, org: e.target.value })}>
                  <option value="org1">Org1</option>
                  <option value="org2">Org2</option>
                </select>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#f87171' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              {loading && (
                <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#93c5fd' }}>
                  ⏳ Registering on Hyperledger Fabric CA — this may take 30–60 seconds…
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
                {loading ? 'Registering on Blockchain…' : <><ArrowRight size={15} /> Register & Send OTP</>}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#34d399' }}>
                ✅ Account created! Check your email for the 6-digit OTP.
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                  Enter OTP
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }} onPaste={handlePaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOTPChange(i, e.target.value)}
                      onKeyDown={e => handleOTPKeyDown(i, e)}
                      style={{
                        width: 48, height: 56,
                        textAlign: 'center',
                        fontSize: 22, fontWeight: 700,
                        background: digit ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${digit ? 'rgba(59,130,246,0.5)' : 'var(--border)'}`,
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        outline: 'none',
                        fontFamily: 'var(--font-mono)',
                      }}
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#f87171' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button className="btn-primary" onClick={() => handleVerify()} disabled={loading || otp.some(d => !d)} style={{ justifyContent: 'center', padding: '12px' }}>
                {loading ? 'Verifying…' : <><Lock size={15} /> Verify & Enter Portal</>}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                {countdown > 0 ? (
                  <span>Resend in <strong style={{ color: 'var(--text-primary)' }}>{countdown}s</strong></span>
                ) : (
                  <button onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 13 }}>
                    <RefreshCw size={12} style={{ display: 'inline', marginRight: 4 }} />Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
            Already registered? <Link href="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
