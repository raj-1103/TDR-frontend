'use client'
import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { bulkUploadFiles } from '@/lib/api'
import { UploadCloud, CheckCircle, AlertCircle, FileText, X } from 'lucide-react'
import { toast } from 'sonner'

export default function BulkUploadPage() {
  const { user } = useAuth()
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<{ name: string; docID: string; txID: string; success: boolean; error?: string }[]>([])
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFiles = (newFiles: File[]) => {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg']
    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg']
    
    const validFiles = newFiles.filter(f => {
      const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase()
      return allowed.includes(f.type) || allowedExts.includes(ext)
    })

    if (validFiles.length !== newFiles.length) {
      toast.error('Some files were ignored. Only PDF, PNG, and JPG are accepted.')
    }

    setFiles(prev => [...prev, ...validFiles])
    setError('')
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    if (e.dataTransfer.files?.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files))
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!user || files.length === 0) return
    setLoading(true)
    setError('')
    setResults([])

    try {
      const res = await bulkUploadFiles(user.fabricID, files)

      // Map backend results to the same shape the UI already expects
      const currentResults = res.results.map(r => ({
        name:    r.fileName,
        docID:   r.docID   || '',
        txID:    res.txID,           // all files share the same single tx
        success: !r.error,
        error:   r.error,
      }))

      setResults(currentResults)
      setFiles([])

      if (res.succeeded === res.total) {
        toast.success(`Successfully uploaded ${res.succeeded} documents in 1 transaction!`)
      } else {
        toast.warning(`Uploaded ${res.succeeded}/${res.total} documents. Check details below.`)
      }
    } catch (err: any) {
      setError(err.message || 'Bulk upload failed')
      toast.error(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Bulk Upload Documents</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Upload multiple PNGs, JPGs, or PDFs at once. They will be hashed and stored on the blockchain.</p>
      </div>

      {results.length > 0 ? (
        <div className="glass-card animate-in" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 56, height: 56, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={28} color="#34d399" />
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Bulk Upload Complete</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              {results.filter(r => r.success).length} out of {results.length} files uploaded successfully.
            </p>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 24 }}>
            {results.map((r, i) => (
              <div key={i} style={{ 
                background: r.success ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', 
                border: `1px solid ${r.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, 
                borderRadius: 8, padding: '12px 16px', marginBottom: 10 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  {r.success ? <CheckCircle size={14} color="#34d399" /> : <AlertCircle size={14} color="#ef4444" />}
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy-700)' }}>{r.name}</span>
                </div>
                {r.success ? (
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginLeft: 22 }}>
                    Doc ID: <span style={{ color: 'var(--navy-400)' }}>{r.docID}</span> <br/>
                    Tx ID: <span style={{ color: 'var(--navy-400)' }}>{r.txID.slice(0, 32)}...</span>
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#ef4444', marginLeft: 22 }}>{r.error}</div>
                )}
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={() => setResults([])} style={{ justifyContent: 'center', width: '100%' }}>
            <UploadCloud size={15} /> Upload More Files
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
              border: `2px dashed ${drag ? 'rgba(37,99,235,0.6)' : files.length > 0 ? 'rgba(5,150,105,0.4)' : 'var(--border)'}`,
              borderRadius: 12,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: drag ? 'rgba(37,99,235,0.03)' : files.length > 0 ? 'rgba(5,150,105,0.02)' : 'transparent',
              transition: 'all 0.2s',
              marginBottom: 20,
            }}
          >
            <input 
              ref={fileRef} 
              type="file" 
              accept=".pdf,.png,.jpg,.jpeg" 
              multiple 
              style={{ display: 'none' }} 
              onChange={e => {
                if (e.target.files?.length) {
                  handleFiles(Array.from(e.target.files))
                }
              }} 
            />

            <UploadCloud size={36} color={files.length > 0 ? "#34d399" : "var(--text-secondary)"} style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>
              {files.length > 0 ? `Selected ${files.length} files. Click or drop to add more.` : 'Drop multiple files here, or click to browse'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>PDF, PNG, JPG accepted</div>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--navy-accent)', marginBottom: 8, textTransform: 'uppercase' }}>Selected Files ({files.length})</div>
              <div style={{ maxHeight: 200, overflowY: 'auto', background: '#f8fafc', borderRadius: 8, border: '1px solid var(--border)', padding: '8px' }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderBottom: i < files.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                      <FileText size={14} color="var(--text-secondary)" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: 'var(--navy-700)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{f.name}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{(f.size / 1024).toFixed(1)} KB</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(i) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', display: 'flex', padding: 4 }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)', borderRadius: 8, padding: '12px 16px', fontSize: 12, color: 'var(--navy-accent)', marginBottom: 20, lineHeight: 1.6 }}>
            📌 Your files will be uploaded in a single batch. The original files will be stored server-side and anchored to Hyperledger Fabric in one transaction.
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#f87171', marginBottom: 16 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          <button className="btn-primary" onClick={handleSubmit} disabled={files.length === 0 || loading} style={{ justifyContent: 'center', width: '100%', padding: '12px' }}>
            {loading ? `⏳ Uploading ${files.length} files…` : <><UploadCloud size={15} /> Upload {files.length} Documents</>}
          </button>
        </div>
      )}
    </div>
  )
}
