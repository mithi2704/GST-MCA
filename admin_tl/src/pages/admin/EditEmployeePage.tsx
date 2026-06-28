import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { type Employee } from '@/data/employees'
import { employeeService } from '@/services/employeeService'
import { toast } from '@/components/ui/Toast'

type FormValues = Partial<Employee> & {
  officialEmailLocal?: string
  profilePassword?: string
  profilePhoto?: { name: string; data: string }
  kycUploads?: Record<string, { name: string; data: string }>
  manager?: string
}

export default function EditEmployeePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const kycInputRef = useRef<HTMLInputElement | null>(null)

  const { register, handleSubmit, formState, setValue, watch, reset } = useForm<FormValues>({ mode: 'onChange' })
  const { errors, isValid, isSubmitting, dirtyFields } = formState

  useEffect(() => {
    if (!id) return
    employeeService.getEmployeeById(id)
      .then((data: any) => {
        setEmployee(data)
        const defaults: FormValues = {
          name: `${data.firstName} ${data.lastName}`,
          id: data.id as any,
          officialEmailLocal: (data.email || '').split('@')[0],
          joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : '',
          profilePhoto: data.profilePhotoUrl ? { name: 'photo', data: data.profilePhotoUrl } : undefined,
        }
        reset(defaults)
      })
      .catch((err) => {
        setError(err.message || 'Employee not found')
      })
  }, [id, reset])

  function readFileAsDataUrl(file: File | null) {
    return new Promise<string | null>((res) => {
      if (!file) return res(null)
      const reader = new FileReader()
      reader.onload = () => res(String(reader.result))
      reader.onerror = () => res(null)
      reader.readAsDataURL(file)
    })
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

  async function onSubmit(values: FormValues) {
    if (!employee) return
    try {
      toast({ type: 'info', message: 'Updating employee...' })
      
      let profilePhotoUrl = undefined
      let profilePhotoPublicId = undefined
      
      if (values.profilePhoto?.data && values.profilePhoto.data !== employee.profilePhotoUrl) {
        toast({ type: 'info', message: 'Uploading profile photo...' })
        const upload = await uploadDataUrl(values.profilePhoto.data, 'employees/profile')
        profilePhotoUrl = upload.secure_url
        profilePhotoPublicId = upload.public_id
      }

      const [firstName, ...lastNameParts] = (values.name || '').split(' ')
      const lastName = lastNameParts.join(' ') || ' '

      await employeeService.updateEmployee(String(employee.id), {
        firstName,
        lastName,
        email: values.officialEmailLocal ? `${values.officialEmailLocal}@complianceos.com` : undefined,
        joiningDate: values.joiningDate,
        profilePhotoUrl,
        profilePhotoPublicId
      } as any)

      toast({ type: 'success', message: 'Employee updated successfully' })
      try { window.dispatchEvent(new CustomEvent('employees:changed')) } catch {}
      navigate('/employees')
    } catch (err: any) {
      setError(err?.message || String(err))
    }
  }

  async function generateAndCopyPassword() {
    const specials = ['@', '#', '$', '%', '&', '*', '!']
    const special = specials[Math.floor(Math.random() * specials.length)]
    const upper = String.fromCharCode(65 + Math.floor(Math.random() * 26))
    const num = Math.floor(100 + Math.random() * 900)
    const base = Math.random().toString(36).slice(2, 8).toUpperCase()
    const pwd = `${base}${special}${upper}${num}`
    setValue('profilePassword' as any, pwd, { shouldDirty: true })
    try { await navigator.clipboard.writeText(pwd); toast({ type: 'success', message: 'Password copied' }) } catch { toast({ type: 'success', message: 'Password generated' }) }
  }

  if (error) return (
    <div>
      <Card>
        <CardHeader title="Edit Employee" />
        <div className="px-4 pb-4">{error}</div>
      </Card>
    </div>
  )

  if (!employee) return <div />

  const watched = watch()

  return (
    <div className="max-w-full overflow-x-hidden px-3 md:px-4 lg:px-6">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-3xl font-extrabold break-words" style={{ lineHeight: 1 }}>Edit Employee</h1>
          <p className="text-sm text-ink-muted">Modify employee details. Required fields are validated before saving.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="md:col-span-1 lg:col-span-3 space-y-6">
            <Card>
              <CardHeader title="Personal Information" />
              <div className="px-4 pb-4 space-y-3">
                <label className="text-xs font-semibold text-ink-muted">Full Name <span className="text-rose-600">*</span></label>
                <input {...register('name', { required: 'Full name is required' })} className={`mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink ${dirtyFields.name ? 'ring-2 ring-amber-300' : ''}`} />
                {errors.name && <div className="text-rose-600 text-sm mt-1">{String(errors.name.message)}</div>}
              </div>
            </Card>

            <Card>
              <CardHeader title="Professional Details" />
              <div className="px-4 pb-4 space-y-3">
                <label className="text-xs font-semibold text-ink-muted">Date of Joining <span className="text-rose-600">*</span></label>
                <input type="date" {...register('joiningDate', { required: 'Joining date is required' })} className={`mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink ${dirtyFields.joiningDate ? 'ring-2 ring-amber-300' : ''}`} />
                {errors.joiningDate && <div className="text-rose-600 text-sm mt-1">{String(errors.joiningDate.message)}</div>}
              </div>
            </Card>

            <Card>
              <CardHeader title="System Access & Roles" />
              <div className="px-4 pb-4 space-y-3">
                <div className="text-sm text-ink-muted">Official Email & Password</div>
                <div className="mt-3">
                  <div className="flex items-center gap-3">
                    <input {...register('officialEmailLocal', { required: 'Official email local-part is required' })} className="h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink min-w-0" />
                    <div className="text-sm text-ink-muted">@complianceos.com</div>
                  </div>

                  <div className="mt-3 flex flex-col md:flex-row items-start md:items-center gap-3">
                    <div className="flex-1 min-w-0 h-10 flex items-center rounded-lg border border-line bg-surface px-3 text-sm text-ink overflow-hidden w-full">{(watched.profilePassword as string) || 'No password generated'}</div>
                    <Button className="h-10 w-full md:w-28" variant="outline" onClick={generateAndCopyPassword}>Generate</Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="KYC & Documents" />
              <div className="px-4 pb-4 space-y-3">
                {['Aadhaar/PAN Copy','Experience Letters','Educational Certificates'].map((label) => (
                  <div key={label} className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-md border-dashed border-2 border-line p-3">
                    <div className="flex items-start gap-3 w-full">
                      <div className="p-2 rounded bg-surface shrink-0">{label.charAt(0)}</div>
                      <div className="flex-1">
                        <div className="font-semibold">{label}</div>
                        <div className="text-sm text-ink-muted">{label === 'Aadhaar/PAN Copy' ? 'PDF, JPG (Max 5MB)' : label === 'Experience Letters' ? 'Combine into one PDF' : 'Highest qualification'}</div>
                        {watch('kycUploads') && (watch('kycUploads') as any)[label] && (
                          <div className="mt-2 text-sm"><span className="font-medium">{(watch('kycUploads') as any)[label].name}</span></div>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 md:mt-0 md:ml-3 w-full md:w-auto">
                      <button type="button" onClick={() => kycInputRef.current?.click()} className="w-full md:w-auto px-3 py-1 rounded bg-amber-500 text-white">Upload</button>
                    </div>
                  </div>
                ))}
                <input ref={kycInputRef} type="file" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const d = await readFileAsDataUrl(f); if (!d) return; const map = { ...(watch('kycUploads') || {}) }; map['file'] = { name: f.name, data: d }; setValue('kycUploads' as any, map, { shouldDirty: true }); }} style={{ display: 'none' }} />
              </div>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardHeader title="Employee Photo" />
              <div className="px-4 pb-4 flex flex-col items-center">
                <div className="w-36 h-36 rounded-full bg-gray-100 flex items-center justify-center relative">
                  {watch('profilePhoto') ? (
                    <img src={(watch('profilePhoto') as any).data} alt="avatar" className="w-36 h-36 rounded-full object-cover" />
                  ) : <div className="text-3xl font-semibold">{employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}</div>}
                </div>
                <div className="mt-3 text-sm text-ink-muted text-center">Upload a high-resolution headshot for the internal directory and ID generation.</div>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const d = await readFileAsDataUrl(f); if (!d) return; setValue('profilePhoto' as any, { name: f.name, data: d }, { shouldDirty: true }); }} style={{ display: 'none' }} />
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => photoInputRef.current?.click()} className="px-3 py-2 rounded bg-amber-500 text-white">Upload</button>
                  <button type="button" onClick={() => { setValue('profilePhoto' as any, undefined, { shouldDirty: true }) }} className="px-3 py-2 rounded border">Remove</button>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="Reporting" />
              <div className="px-4 pb-4 space-y-3">
                <label className="text-xs font-semibold text-ink-muted">Reports To (Manager)</label>
                <input {...register('manager')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
          <Button className="w-full sm:w-auto" variant="ghost" onClick={() => navigate('/employees')}>Cancel</Button>
          <Button className="w-full sm:w-auto" type="submit" variant="primary" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  )
}
