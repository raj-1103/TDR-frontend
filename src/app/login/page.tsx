'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { sendOTP, verifyOTP } from '@/lib/api'
import { Shield, Mail, AlertCircle, ArrowRight, RefreshCw, Lock } from 'lucide-react'

export default function LoginPage() {
  const { setUser } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await sendOTP(email)
      setStep('otp')
      setCountdown(60)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
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
    // Auto-submit when all 6 digits entered
    if (val && idx === 5 && next.every(d => d !== '')) {
      handleVerifyOTP(next.join(''))
    }
  }

  const handleOTPKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const next = pasted.split('')
      setOtp(next)
      handleVerifyOTP(pasted)
    }
  }

  const handleVerifyOTP = async (code?: string) => {
    const finalOTP = code || otp.join('')
    if (finalOTP.length !== 6) return
    setError('')
    setLoading(true)
    try {
      const res = await verifyOTP(email, finalOTP)
      setUser({
        fabricID: res.fabricID,
        email,
        name: res.name || email.split('@')[0],
        role: (res.role as any) || 'USER',
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
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
      await sendOTP(email)
      setCountdown(60)
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      setError(err.message)
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
            {step === 'email' ? 'Sign in with your email' : 'Enter the OTP sent to your email'}
          </p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#f87171' }}>
                  <AlertCircle size={14} /> {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', padding: '12px' }}>
                {loading ? 'Sending OTP…' : <><ArrowRight size={15} /> Send OTP</>}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Email shown */}
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={13} />
                OTP sent to <strong>{email}</strong>
                <button onClick={() => { setStep('email'); setError('') }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 12 }}>
                  Change
                </button>
              </div>

              {/* OTP boxes */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
                  6-Digit OTP
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
                        transition: 'all 0.15s',
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

              <button
                className="btn-primary"
                onClick={() => handleVerifyOTP()}
                disabled={loading || otp.some(d => !d)}
                style={{ justifyContent: 'center', padding: '12px' }}
              >
                {loading ? 'Verifying…' : <><Lock size={15} /> Verify & Sign In</>}
              </button>

              {/* Resend */}
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                {countdown > 0 ? (
                  <span>Resend OTP in <strong style={{ color: 'var(--text-primary)' }}>{countdown}s</strong></span>
                ) : (
                  <button onClick={handleResend} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', fontSize: 13 }}>
                    <RefreshCw size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Resend OTP
                  </button>
                )}
              </div>
            </div>
          )}

          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', marginTop: 20 }}>
            No account? <Link href="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 500 }}>Register here</Link>
          </p>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(148,163,184,0.5)', marginTop: 8 }}>
            Admin? <Link href="/admin-login" style={{ color: 'rgba(148,163,184,0.6)', textDecoration: 'none' }}>Admin Portal →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
