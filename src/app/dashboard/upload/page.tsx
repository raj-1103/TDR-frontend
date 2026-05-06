'use client'
import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { uploadDocument } from '@/lib/api'
import { Upload, FileText, CheckCircle, Copy, AlertCircle, X, RefreshCw, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardBody } from '@/components/Card'

export default function UploadPage() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ docID: string; txID: string } | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const [copiedId, setCopiedId] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg']
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg']
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
    if (!allowed.includes(f.type) && !allowedExts.includes(ext)) {
      setError('Only PDF, PNG, and JPG files are accepted.')
      return
    }
    setFile(f)
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const handleSubmit = async () => {
    if (!file || !user) return
    setLoading(true); setError('')
    try {
      const res = await uploadDocument(user.fabricID, file)
      setResult(res)
      setFile(null)
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast.success(`${id} copied to clipboard`)
    setTimeout(() => setCopiedId(''), 2000)
  }

  return (
    <div style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>Upload TDR Asset</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 500, lineHeight: 1.6 }}>
          Submit your TDR certificate for digital verification. Your document is hashed using <span className="font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-xs font-bold uppercase">Keccak-256</span> and recorded immutably on the ledger.
        </p>
      </div>

      {result ? (
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-2xl shadow-slate-200/50">
          <CardBody className="p-10 text-center">
            <div style={{ width: 64, height: 64, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 16px -4px rgba(16,185,129,0.2)' }}>
              <CheckCircle size={32} color="#10b981" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.01em' }}>Submission Successful!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 32, fontWeight: 500 }}>Your digital TDR asset has been anchored to the blockchain ledger.</p>

            <div className="space-y-3 mb-8">
              {[
                { label: 'Asset Identifier', value: result.docID },
                { label: 'Blockchain TXID', value: result.txID },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', textAlign: 'left' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#0f172a', wordBreak: 'break-all', fontWeight: 600 }}>{value}</code>
                    <button onClick={() => copy(value, label)} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: copiedId === label ? '#10b981' : '#64748b', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, padding: '6px 10px', transition: 'all 0.2s' }} className="hover:border-blue-500/30">
                      {copiedId === label ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)', borderRadius: 12, padding: '14px 18px', fontSize: 13, color: '#d97706', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12, fontWeight: 600 }}>
              <AlertCircle size={18} className="flex-shrink-0" />
              <div className="text-left">Save your Asset ID — it is required for all future transfers and issuance requests.</div>
            </div>

            <button className="btn-primary" onClick={() => setResult(null)} style={{ justifyContent: 'center', height: 52, borderRadius: 14, width: '100%', fontSize: 15, fontWeight: 900, boxShadow: '0 8px 16px -4px rgba(37,99,235,0.2)' }}>
              <Upload size={18} className="mr-2" /> Upload New Certificate
            </button>
          </CardBody>
        </Card>
      ) : (
        <Card className="border-slate-200">
          <CardBody className="p-8">
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDrag(true) }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${drag ? '#2563eb' : file ? '#10b981' : '#e2e8f0'}`,
                borderRadius: 20,
                padding: '56px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                background: drag ? 'rgba(37,99,235,0.02)' : file ? 'rgba(16,185,129,0.02)' : '#fbfcfd',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                marginBottom: 24,
                boxShadow: drag ? '0 0 0 4px rgba(37,99,235,0.05)' : 'none'
              }}
              className="group"
            >
              <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

              {file ? (
                <div className="animate-in zoom-in-95 duration-200">
                  <div style={{ width: 64, height: 64, background: '#ecfdf5', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #d1fae5' }}>
                    <FileText size={32} color="#10b981" />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{file.name}</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{(file.size / 1024).toFixed(1)} KB</div>
                  <button
                    onClick={e => { e.stopPropagation(); setFile(null) }}
                    style={{ marginTop: 16, background: 'white', border: '1px solid #fee2e2', cursor: 'pointer', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 10 }}
                    className="hover:bg-red-50 hover:border-red-200 transition-colors"
                  >
                    <X size={14} /> Remove File
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1px solid #e2e8f0' }} className="group-hover:scale-110 transition-transform group-hover:bg-blue-50 group-hover:border-blue-200 group-hover:text-blue-600">
                    <Upload size={32} className="text-slate-400 group-hover:text-blue-500" />
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>Drag and drop certificate</div>
                  <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>PDF, PNG, JPG accepted · Max 10MB</div>
                </div>
              )}
            </div>

            {/* Info */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '16px 20px', fontSize: 13, color: '#475569', marginBottom: 28, lineHeight: 1.6 }}>
              <div className="flex gap-3">
                <Shield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <p>
                  Security Protocol: Your file will be hashed locally and submitted to the blockchain network. 
                  The original file is stored for OCR validation. Scanned certificates are fully supported.
                </p>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#ef4444', marginBottom: 20, fontWeight: 600 }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}

            <button className="btn-primary" onClick={handleSubmit} disabled={!file || loading} style={{ justifyContent: 'center', width: '100%', height: 56, borderRadius: 16, fontSize: 16, fontWeight: 900, boxShadow: '0 10px 20px -5px rgba(37,99,235,0.3)' }}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <RefreshCw size={20} className="animate-spin opacity-50" />
                  Anchoring to Blockchain...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload size={20} /> Securely Upload Document
                </span>
              )}
            </button>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
