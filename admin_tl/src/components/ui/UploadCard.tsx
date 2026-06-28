import React from 'react'
import { UploadCloud, Camera } from 'lucide-react'

export default function UploadCard({ label, file, onDrop, accept }: { label: string; file?: { name: string; data?: string } | null; onDrop: (f: File | null) => void; accept?: string }) {
  function handleFiles(files: FileList | null) {
    const f = files && files[0] ? files[0] : null
    onDrop(f)
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
      </div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer?.files) }}
        style={{
          marginTop: 8,
          padding: 20,
          borderRadius: 12,
          border: '2px dashed rgba(16,24,40,0.08)',
          background: 'white',
          minHeight: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {!file ? (
          <div style={{ textAlign: 'center', color: 'var(--color-ink-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(16,24,40,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UploadCloud style={{ width: 28, height: 28, color: 'rgba(16,24,40,0.5)' }} />
              </div>
            </div>
            <div style={{ marginTop: 10, fontSize: 14, fontWeight: 600 }}>Drag & drop or click to upload</div>
            <div style={{ fontSize: 12, marginTop: 6, color: 'var(--color-ink-muted)' }}>{accept || 'PDF, JPG, PNG (Max 5MB)'}</div>
            <div style={{ marginTop: 10 }}>
              <label style={{ cursor: 'pointer', color: 'var(--color-amber)', fontWeight: 700 }}>
                <input type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => handleFiles(e.target.files)} />
                Upload
              </label>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, height: 56, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {file.data ? <img src={file.data} alt={file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Camera />}
            </div>
            <div>
              <div style={{ fontWeight: 700 }}>{file.name}</div>
              <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>Uploaded</div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <button onClick={() => onDrop(null)} className="text-sm text-ink-muted">Remove</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
