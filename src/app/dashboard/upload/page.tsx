'use client'
import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { uploadDocument } from '@/lib/api'
import { Upload, FileText, CheckCircle, Copy, AlertCircle, X } from 'lucide-react'

export default function UploadPage() {
  const { user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ docID: string; txID: string } | null>(null)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
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

  const copy = (text: string) => navigator.clipboard.writeText(text)

  return (
    <div style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Upload TDR Document</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Upload your TDR PDF. It will be hashed using Keccak-256 and stored immutably on Hyperledger Fabric.</p>
      </div>

      {result ? (
        <div className="glass-card animate-in" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle size={28} color="#34d399" />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Document Uploaded!</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Your document is now recorded on the blockchain.</p>

          {[
            { label: 'Document ID', value: result.docID },
            { label: 'Transaction ID', value: result.txID },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 10, textAlign: 'left' }}>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: '#60a5fa', wordBreak: 'break-all' }}>{value}</code>
                <button onClick={() => copy(value)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', flexShrink: 0 }}><Copy size={13} /></button>
              </div>
            </div>
          ))}

          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#fbbf24', marginTop: 8, marginBottom: 20 }}>
            ⚠️ Save your Document ID — you'll need it to request TDR issuance.
          </div>

          <button className="btn-primary" onClick={() => setResult(null)} style={{ justifyContent: 'center' }}>
            <Upload size={15} /> Upload Another
          </button>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: 32 }}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true) }}
            onDragLeave={() => setDrag(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${drag ? 'rgba(59,130,246,0.6)' : file ? 'rgba(16,185,129,0.4)' : 'var(--border)'}`,
              borderRadius: 12,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: drag ? 'rgba(59,130,246,0.05)' : file ? 'rgba(16,185,129,0.04)' : 'transparent',
              transition: 'all 0.2s',
              marginBottom: 20,
            }}
          >
            <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

            {file ? (
              <div>
                <FileText size={36} color="#34d399" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#34d399', marginBottom: 4 }}>{file.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{(file.size / 1024).toFixed(1)} KB</div>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null) }}
                  style={{ marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                >
                  <X size={13} /> Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload size={36} color="var(--text-secondary)" style={{ margin: '0 auto 12px' }} />
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Drop your file here, or click to browse</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>PDF, PNG, JPG accepted · Max 10MB</div>
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: '#93c5fd', marginBottom: 20, lineHeight: 1.6 }}>
            📌 Your file will be hashed (Keccak-256) and submitted to Hyperledger Fabric via the <code>UploadDocument</code> chaincode function. The original file is stored server-side for OCR during transfers. PNG/JPG scans of TDR certificates are fully supported.
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171', marginBottom: 16 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={!file || loading} style={{ justifyContent: 'center', width: '100%', padding: '12px' }}>
            {loading ? '⏳ Uploading to Blockchain…' : <><Upload size={15} /> Upload Document</>}
          </button>
        </div>
      )}
    </div>
  )
}
