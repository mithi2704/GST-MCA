import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader } from "@/components/ui/Card"
import { type Employee } from "@/data/employees"
import { employeeService } from "@/services/employeeService"
import { Camera, Plus, User } from 'lucide-react'
import { toast } from '@/components/ui/Toast'

const DRAFT_KEY = 'onboard_employee_draft_v1'

export function OnboardEmployeeView() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<any>({})
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const kycInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingKycLabel, setPendingKycLabel] = useState<string | null>(null)

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (raw) {
      try {
        setDraft(JSON.parse(raw))
      } catch {}
    }
  }, [])

  function update<K extends string>(k: K, v: any) {
    setDraft((d: any) => {
      const next = { ...d, [k]: v }
      try { localStorage.setItem(DRAFT_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
      toast({ type: 'success', message: 'Draft saved' })
    } catch {
      toast({ type: 'error', message: 'Save failed' })
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
    setDraft({})
    toast({ type: 'success', message: 'Draft deleted' })
  }

  function readFileAsDataUrl(file: File | null) {
    return new Promise<string | null>((res) => {
      if (!file) return res(null)
      const reader = new FileReader()
      reader.onload = () => res(String(reader.result))
      reader.onerror = () => res(null)
      reader.readAsDataURL(file)
    })
  }

  function validateAll() {
    const missing: string[] = []
    if (!draft.name) missing.push('Full Name')
    const officialEmail = draft.officialEmailLocal ? `${draft.officialEmailLocal}@complianceos.com` : draft.email
    if (!officialEmail) missing.push('Email')
    if (!draft.id) missing.push('Employee ID')
    if (!draft.department) missing.push('Department')
    if (!draft.designation) missing.push('Designation')
    if (!draft.joiningDate) missing.push('Joining Date')
    if (!draft.phone) missing.push('Phone')
    if (missing.length) { alert('Please provide: ' + missing.join(', ')); return false }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (officialEmail && !emailRegex.test(officialEmail)) {
      alert('Please enter a valid official email address')
      return false
    }
    if (draft.personalEmail && !emailRegex.test(draft.personalEmail)) {
      alert('Please enter a valid personal email address')
      return false
    }
    if (!/^\d{10}$/.test(draft.phone)) {
      alert('Phone number must be exactly 10 digits')
      return false
    }
    return true
  }

  async function uploadDataUrl(dataUrl: string, type: string) {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], "profile.png", { type: blob.type });
    
    const formData = new FormData();
    formData.append('file', file);
    
    const session = sessionStorage.getItem('teamlead_session');
    let token = '';
    if (session) {
      token = JSON.parse(session).token;
    }
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    const response = await fetch(`${API_BASE_URL}/upload?type=${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Upload failed');
    }
    
    const body = await response.json();
    return body.data; // { secure_url, public_id }
  }

  async function submit() {
    const officialEmail = draft.officialEmailLocal ? `${draft.officialEmailLocal}@complianceos.com` : draft.email
    if (!draft.name || !officialEmail) { alert('Name and Email required'); return }
    
    const [firstName, ...lastNameParts] = draft.name.split(' ');
    const lastName = lastNameParts.join(' ') || ' ';
    
    try {
      toast({ type: 'info', message: 'Creating employee profile...' });
      
      let profilePhotoUrl = undefined;
      let profilePhotoPublicId = undefined;
      
      if (draft.profilePhoto?.data) {
        toast({ type: 'info', message: 'Uploading profile photo...' });
        const upload = await uploadDataUrl(draft.profilePhoto.data, 'employees/profile');
        profilePhotoUrl = upload.secure_url;
        profilePhotoPublicId = upload.public_id;
      }
      
      await employeeService.createEmployee({
        firstName,
        lastName,
        email: String(officialEmail),
        phone: String(draft.phone || ''),
        department: String(draft.department || 'Compliance'),
        designation: String(draft.designation || 'Associate'),
        joiningDate: String(draft.joiningDate || new Date().toISOString().split('T')[0]),
        password: String(draft.permanentPassword || 'Password@123'),
        role: String(draft.role || 'EMPLOYEE'),
        profilePhotoUrl,
        profilePhotoPublicId
      } as any);
      
      toast({ type: 'success', message: 'Employee onboarding successful!' });
      clearDraft();
      try { window.dispatchEvent(new CustomEvent('employees:changed')) } catch {}
      navigate('/employees');
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Onboarding failed' });
    }
  }

  return (
    <div className="pb-24">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold" style={{ lineHeight: 1 }}>Employee Onboarding</h1>
          <p className="text-sm text-ink-muted">Register new compliance specialists and set up their operational access.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={saveDraft}>Save as Draft</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader title="Personal Information" />
            <div className="px-4 pb-4 space-y-3">
              <label className="text-xs font-semibold text-ink-muted">Full Name</label>
              <input value={draft.name || ''} onChange={(e) => update('name', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Employee ID (optional)</label>
                  <input value={draft.id || ''} onChange={(e) => update('id', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Email</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={draft.email || ''} onChange={(e) => update('email', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Phone</label>
                  <input
                    value={draft.phone || ''}
                    onChange={(e) => update('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                    placeholder="e.g. 9876543210"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Date of Birth</label>
                  <input type="date" value={draft.dob || ''} onChange={(e) => update('dob', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Gender</label>
                  <select value={draft.gender || ''} onChange={(e) => update('gender', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                    <option value="">Select Gender</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Personal Email</label>
                  <input value={draft.personalEmail || ''} onChange={(e) => update('personalEmail', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted">Permanent Address</label>
                <textarea value={draft.address || ''} onChange={(e) => update('address', e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Professional Details" />
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Employee ID</label>
                  <input value={draft.generatedId || draft.id || 'COS-2024-0012'} onChange={(e) => update('id', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Date of Joining</label>
                  <input type="date" value={draft.joiningDate || ''} onChange={(e) => update('joiningDate', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Department</label>
                  <select value={draft.department || ''} onChange={(e) => update('department', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                    <option value="">Select Department</option>
                    <option>Compliance</option>
                    <option>Operations</option>
                    <option>Analytics</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Designation / Role</label>
                  <select value={draft.designation || ''} onChange={(e) => update('designation', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                    <option value="">Select Designation</option>
                    <option>Associate</option>
                    <option>Reviewer</option>
                    <option>Partner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-ink-muted">Work Location</label>
                <div className="mt-2 flex items-center gap-4">
                  <label className="inline-flex items-center gap-2"><input type="radio" name="workLocation" checked={draft.workLocation==='Headquarters (Delhi)'} onChange={()=>update('workLocation','Headquarters (Delhi)')} /> Headquarters (Delhi)</label>
                  <label className="inline-flex items-center gap-2"><input type="radio" name="workLocation" checked={draft.workLocation==='Mumbai Hub'} onChange={()=>update('workLocation','Mumbai Hub')} /> Mumbai Hub</label>
                  <label className="inline-flex items-center gap-2"><input type="radio" name="workLocation" checked={draft.workLocation==='Remote'} onChange={()=>update('workLocation','Remote')} /> Remote</label>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="Statutory & Banking" />
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">PAN Number</label>
                  <input value={draft.pan || ''} onChange={(e) => update('pan', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Aadhaar Number</label>
                  <input value={draft.aadhaar || ''} onChange={(e) => update('aadhaar', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                </div>
              </div>

              <div className="border rounded-md p-4 bg-surface">
                <div className="text-xs font-semibold text-ink-muted">Bank Account Details</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input value={draft.bankAccount || ''} onChange={(e)=>update('bankAccount', e.target.value)} placeholder="Account No." className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" />
                  <input value={draft.ifsc || ''} onChange={(e)=>update('ifsc', e.target.value)} placeholder="IFSC Code" className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" />
                  <input value={draft.bankName || ''} onChange={(e)=>update('bankName', e.target.value)} placeholder="Bank Name" className="h-10 rounded-lg border border-line bg-white px-3 text-sm text-ink" />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader title="System Access & Roles" />
            <div className="px-4 pb-4 space-y-3">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-3">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">System Role</label>
                  <select value={draft.role || 'EMPLOYEE'} onChange={(e) => update('role', e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink font-medium">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="TEAM_LEAD">Team Leader</option>
                  </select>
                </div>
              </div>
              <div className="text-sm text-ink-muted">Official Email & Password</div>
              <div className="mt-3">
                <div className="mb-2">
                  <div className="flex items-center gap-6">
                    <input value={draft.officialEmailLocal || ''} onChange={(e)=>update('officialEmailLocal', e.target.value)} className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink min-w-0" placeholder="john.doe" />
                    <div className="text-sm text-ink-muted">@complianceos.com</div>
                  </div>
                </div>

                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <label className="text-xs font-semibold text-ink-muted">Generated Password (Permanent)</label>
                    <div className="mt-1 w-full flex items-center">
                      <div className="flex-1 min-w-0 h-10 flex items-center rounded-lg border border-line bg-surface px-3 text-sm text-ink overflow-hidden">{draft.permanentPassword || 'No password generated'}</div>
                      <div className="ml-3 flex-shrink-0">
                        <Button className="h-10 w-28" variant="outline" onClick={async ()=>{
                      const specials = ['@','#','$','%','&','*','!']
                      const special = specials[Math.floor(Math.random()*specials.length)]
                      const upper = String.fromCharCode(65 + Math.floor(Math.random()*26))
                      const num = Math.floor(100 + Math.random()*900)
                      const base = Math.random().toString(36).slice(2,8).toUpperCase()
                      const pwd = `${base}${special}${upper}${num}`
                      update('permanentPassword', pwd)
                      try { await navigator.clipboard.writeText(pwd); toast({ type: 'success', message: 'Password generated and copied' }) } catch { toast({ type: 'success', message: 'Password generated' }) }
                        }}>Generate</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader title="Employee Photo" />
            <div className="px-4 pb-4 flex flex-col items-center">
              <div className="w-36 h-36 rounded-full bg-gray-100 flex items-center justify-center relative">
                {draft.profilePhoto?.data ? (
                  <>
                    <img src={draft.profilePhoto.data} alt="avatar" className="w-36 h-36 rounded-full object-cover" />
                    <button onClick={()=>update('profilePhoto', undefined)} className="absolute -bottom-2 -left-2 bg-rose-600 p-1 rounded-full text-white">✕</button>
                  </>
                ) : <User size={48} />}
                <button onClick={()=>photoInputRef.current?.click()} className="absolute -bottom-2 -right-2 bg-amber-500 p-2 rounded-full text-white"><Camera size={16} /></button>
              </div>
              <div className="mt-3 text-sm text-ink-muted text-center">Upload a high-resolution headshot for the internal directory and ID generation.</div>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={async (e)=>{ const f = e.target.files?.[0]; if (!f) return; const d = await readFileAsDataUrl(f); update('profilePhoto',{ name: f.name, data: d }) }} style={{ display:'none' }} />
            </div>
          </Card>

            <Card>
              <CardHeader title="KYC & Documents" />
              <div className="px-4 pb-4 space-y-3">
                {['Aadhaar/PAN Copy','Experience Letters','Educational Certificates'].map((label)=> (
                  <div key={label} className="flex items-center justify-between rounded-md border-dashed border-2 border-line p-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-surface"><Plus size={18} /></div>
                      <div>
                        <div className="font-semibold">{label}</div>
                        <div className="text-sm text-ink-muted">{label==='Aadhaar/PAN Copy' ? 'PDF, JPG (Max 5MB)' : label==='Experience Letters' ? 'Combine all into one PDF' : 'Highest qualification'}</div>
                        {draft.kycUploads && draft.kycUploads[label] && (
                          <div className="mt-2 text-sm">
                            <span className="font-medium">{draft.kycUploads[label].name}</span>
                            <button onClick={()=>{ const map = { ...(draft.kycUploads||{}) }; delete map[label]; update('kycUploads', map) }} className="ml-3 text-sm text-rose-600">Remove</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <button onClick={()=>{ setPendingKycLabel(label); kycInputRef.current?.click() }} className="px-3 py-1 rounded bg-amber-500 text-white">Upload</button>
                    </div>
                  </div>
                ))}
                <input ref={kycInputRef} type="file" onChange={async (e)=>{ const f = e.target.files?.[0]; if (!f || !pendingKycLabel) return; const d = await readFileAsDataUrl(f); const map = { ...(draft.kycUploads||{}) }; map[pendingKycLabel] = { name: f.name, data: d }; update('kycUploads', map); setPendingKycLabel(null) }} style={{ display:'none' }} />
              </div>
            </Card>

          <Card>
            <CardHeader title="CURRENT TEAM STRENGTH" />
            <div className="px-4 pb-4">
              <div className="text-3xl font-bold">128</div>
              <div className="text-sm text-ink-muted">Active Professionals</div>
              <div className="mt-3 h-3 rounded bg-gray-200 overflow-hidden"><div style={{ width: '72%', height: '100%', background: '#f59e0b' }} /></div>
              <div className="text-sm text-ink-muted mt-2">Utilization Rate: 84.5% (High Capacity)</div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-6 mb-12 flex items-center gap-3">
        <Button variant="ghost" onClick={clearDraft}>Delete Draft</Button>
      </div>

      <div className="fixed bottom-0 left-0 md:left-[var(--sidebar-width)] right-0 z-30 bg-canvas border-t border-line px-6 py-4 flex justify-end gap-3">
        <Button variant="ghost" onClick={() => navigate('/employees')}>Cancel Onboarding</Button>
        <Button variant="primary" onClick={async ()=>{ if (!validateAll()) return; await submit() }}>Save & Add Employee</Button>
      </div>
    </div>
  )
}

export default OnboardEmployeeView
