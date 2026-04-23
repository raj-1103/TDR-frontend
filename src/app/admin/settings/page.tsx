'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { changePassword } from '@/lib/api'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react'

export default function AdminSettingsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [form, setForm] = useState({ current: '', newPass: '', confirm: '' })
  const [show, setShow] = useState({ current: false, new: false, confirm: false })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (form.newPass !== form.confirm) {
      setError('New passwords do not match')
      return
    }
    if (form.newPass.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (form.newPass === form.current) {
      setError('New password must be different from current password')
      return
    }

    setLoading(true)
    try {
      await changePassword(user!.fabricID, form.current, form.newPass)
      setSuccess(true)
      setForm({ current: '', newPass: '', confirm: '' })
    } catch (err: any) {
      setError(err.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  const strength = (p: string) => {
    if (!p) return null
    let score = 0
    if (p.length >= 8) score++
    if (p.length >= 12) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '20%' }
    if (score <= 2) return { label: 'Fair', color: '#f59e0b', width: '40%' }
    if (score <= 3) return { label: 'Good', color: '#60a5fa', width: '70%' }
    return { label: 'Strong', color: '#10b981', width: '100%' }
  }

  const passwordStrength = strength(form.newPass)

  const PasswordField = ({
    label, value, showKey, onChange
  }: {
    label: string
    value: string
    showKey: 'current' | 'new' | 'confirm'
    onChange: (v: string) => void
  }) => (
    <div>
      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <Lock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
        <input
          type={show[showKey] ? 'text' : 'password'}
          className="tdr-input"
          style={{ paddingLeft: 34, paddingRight: 40 }}
          value={value}
          onChange={e => onChange(e.target.value)}
          required
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={() => setShow(s => ({ ...s, [showKey]: !s[showKey] }))}
          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          {show[showKey] ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--navy-950)' }}>
      <Navbar />
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: '32px', minHeight: 'calc(100vh - 64px)' }}>
          <div style={{ maxWidth: 520 }}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                <Link href="/admin" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Admin</Link> › Settings
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, marginBottom: 4 }}>Settings</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage your admin account settings.</p>
            </div>

            {/* Account info card */}
            <div className="glass-card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{user?.name || 'Admin'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user?.email}</div>
                <div style={{ marginTop: 4 }}>
                  <span className={`badge ${user?.role === 'SUPERADMIN' ? 'badge-approved' : 'badge-pending'}`}>
                    <ShieldCheck size={10} /> {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="glass-card" style={{ padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Change Password</h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
                Update your admin portal password. Use a strong, unique password.
              </p>

              {/* First-time notice */}
              {form.current === '' && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fbbf24', marginBottom: 20 }}>
                  ⚠️ If you just received admin access, your temporary password is <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(245,158,11,0.15)', padding: '1px 5px', borderRadius: 3 }}>ChangeMe123!</code>
                </div>
              )}

              {success && (
                <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#34d399', marginBottom: 20 }}>
                  <CheckCircle size={16} />
                  <div>
                    <strong>Password changed successfully!</strong>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>Your new password is active immediately.</div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <PasswordField
                  label="Current Password"
                  value={form.current}
                  showKey="current"
                  onChange={v => setForm(f => ({ ...f, current: v }))}
                />

                <PasswordField
                  label="New Password"
                  value={form.newPass}
                  showKey="new"
                  onChange={v => setForm(f => ({ ...f, newPass: v }))}
                />

                {/* Strength meter */}
                {form.newPass && passwordStrength && (
                  <div style={{ marginTop: -10 }}>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: passwordStrength.width, background: passwordStrength.color, borderRadius: 2, transition: 'width 0.3s, background 0.3s' }} />
                    </div>
                    <div style={{ fontSize: 11, color: passwordStrength.color, marginTop: 4 }}>
                      {passwordStrength.label} password
                      {passwordStrength.label === 'Weak' && ' — add uppercase letters, numbers, and symbols'}
                    </div>
                  </div>
                )}

                <PasswordField
                  label="Confirm New Password"
                  value={form.confirm}
                  showKey="confirm"
                  onChange={v => setForm(f => ({ ...f, confirm: v }))}
                />

                {/* Match indicator */}
                {form.confirm && (
                  <div style={{ marginTop: -10, fontSize: 12, color: form.newPass === form.confirm ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: 5 }}>
                    {form.newPass === form.confirm
                      ? <><CheckCircle size={12} /> Passwords match</>
                      : <><AlertCircle size={12} /> Passwords do not match</>
                    }
                  </div>
                )}

                {error && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: '#f87171' }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || form.newPass !== form.confirm || !form.current || !form.newPass}
                  style={{
                    padding: '12px', borderRadius: 8, border: 'none', marginTop: 4,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', color: 'white',
                    fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    opacity: (loading || form.newPass !== form.confirm || !form.current || !form.newPass) ? 0.5 : 1,
                  }}
                >
                  {loading ? 'Updating…' : <><Lock size={15} /> Update Password</>}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}