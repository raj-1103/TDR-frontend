'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { getNotifications } from '@/lib/api'
import { Bell, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  const load = useCallback(async () => {
    if (!user?.fabricID) return
    try {
      const res = await getNotifications(user.fabricID)
      const list = res.notifications || []
      setNotifications(list)
      setUnreadCount(list.filter((n: any) => !n.is_read).length)
    } catch (e) {
      console.error('Failed to load notifications', e)
    }
  }, [user])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [load])

  const getIcon = (type: string) => {
    switch (type) {
      case 'APPROVAL_REQUIRED': return <Clock size={14} color="#f59e0b" />
      case 'REQUEST_APPROVED': return <CheckCircle size={14} color="#10b981" />
      case 'REQUEST_REJECTED': return <AlertCircle size={14} color="#ef4444" />
      default: return <Info size={14} color="#3b82f6" />
    }
  }

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{ 
          background: 'rgba(255,255,255,0.05)', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: 10, 
          width: 42, 
          height: 42, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)',
          position: 'relative'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div style={{ 
            position: 'absolute', 
            top: -2, 
            right: -2, 
            background: '#ef4444', 
            color: 'white', 
            fontSize: 10, 
            fontWeight: 800, 
            width: 18, 
            height: 18, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px solid #11233d'
          }}>
            {unreadCount}
          </div>
        )}
      </button>

      {open && (
        <>
          <div 
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
          />
          <div style={{ 
            position: 'absolute', 
            right: 0, 
            top: '120%', 
            width: 320, 
            background: '#ffffff', 
            borderRadius: 12, 
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)', 
            border: '1px solid #e2e8f0',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Notifications</span>
              {unreadCount > 0 && <span style={{ fontSize: 11, color: '#64748b' }}>{unreadCount} new</span>}
            </div>
            
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                  No notifications yet.
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div key={i} style={{ 
                    padding: '14px 16px', 
                    borderBottom: '1px solid #f1f5f9', 
                    background: n.is_read ? 'transparent' : '#f8faff',
                    display: 'flex',
                    gap: 12,
                    transition: 'background 0.2s'
                  }}>
                    <div style={{ marginTop: 2 }}>{getIcon(n.type)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 2 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{n.message}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 6 }}>{n.created_at}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div style={{ padding: '12px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <Link 
                href="/dashboard" 
                onClick={() => setOpen(false)}
                style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', textDecoration: 'none' }}
              >
                View all activity
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
