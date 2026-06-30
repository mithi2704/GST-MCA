import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { employeeService } from '@/services/employeeService'
import { toast } from '@/components/ui/Toast'
import Spinner from '@/components/ui/Spinner'

type FormValues = {
  name: string
  emailLocal: string
  phone: string
  employeeCode: string
  gender: string
  dob: string
  department: string
  designation: string
  reportingTL: string
  employmentType: string
  joiningDate: string
  status: string
  address: string
  city: string
  state: string
  pinCode: string
  profilePhoto?: { name: string; data: string }
  idProof?: { name: string; data: string }
  resume?: { name: string; data: string }
}

export default function EditEmployeePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const idProofInputRef = useRef<HTMLInputElement | null>(null)
  const resumeInputRef = useRef<HTMLInputElement | null>(null)

  const isLead = window.location.pathname.startsWith('/lead')

  const { register, handleSubmit, formState, setValue, watch, reset } = useForm<FormValues>({
    mode: 'onChange',
  })
  const { errors, isValid, isSubmitting } = formState

  useEffect(() => {
    if (!id) return
    employeeService.getEmployeeById(id)
      .then((data: any) => {
        setEmployee(data)
        const emailPrefix = (data.email || '').split('@')[0]
        
        reset({
          name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
          emailLocal: emailPrefix,
          phone: data.phone || '',
          employeeCode: data.employeeCode || `COS-EMP-${data.id}`,
          gender: data.gender || 'Male',
          dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '1995-01-01',
          department: data.department || 'Compliance',
          designation: data.designation || 'Associate',
          reportingTL: data.reportingTL || 'Vikram Malhotra',
          employmentType: data.employmentType || 'Full-time',
          joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString().split('T')[0] : '',
          status: data.status === 'ACTIVE' ? 'Active' : 'Inactive',
          address: data.address || 'Maker Chambers, Nariman Point',
          city: data.city || 'Mumbai',
          state: data.state || 'Maharashtra',
          pinCode: data.pinCode || '400021',
          profilePhoto: data.profilePhotoUrl ? { name: 'profile_photo', data: data.profilePhotoUrl } : undefined,
        })
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || 'Employee not found')
        setLoading(false)
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
    const res = await fetch(dataUrl)
    const blob = await res.blob()
    const file = new File([blob], 'file.png', { type: blob.type })
    
    const formData = new FormData()
    formData.append('file', file)
    
    const session = sessionStorage.getItem('teamlead_session')
    let token = ''
    if (session) {
      token = JSON.parse(session).token
    }
    
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
    const response = await fetch(`${API_BASE_URL}/upload?type=${type}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    })
    
    if (!response.ok) {
      throw new Error('Upload failed')
    }
    
    const body = await response.json()
    return body.data // { secure_url, public_id }
  }

  async function onSubmit(values: FormValues) {
    if (!employee) return
    try {
      toast({ type: 'info', message: 'Saving changes...' })
      
      let profilePhotoUrl = undefined
      let profilePhotoPublicId = undefined
      
      if (values.profilePhoto?.data && values.profilePhoto.data !== employee.profilePhotoUrl) {
        const upload = await uploadDataUrl(values.profilePhoto.data, 'employees/profile')
        profilePhotoUrl = upload.secure_url
        profilePhotoPublicId = upload.public_id
      }

      const [firstName, ...lastNameParts] = (values.name || '').split(' ')
      const lastName = lastNameParts.join(' ') || ' '

      await employeeService.updateEmployee(String(employee.id), {
        firstName,
        lastName,
        email: values.emailLocal ? `${values.emailLocal}@complianceos.com` : undefined,
        phone: values.phone,
        department: values.department,
        designation: values.designation,
        status: values.status === 'Active' ? 'ACTIVE' : 'INACTIVE',
        profilePhotoUrl,
        profilePhotoPublicId,
      } as any)

      toast({ type: 'success', message: 'Employee updated successfully' })
      try { window.dispatchEvent(new CustomEvent('employees:changed')) } catch {}
      navigate(isLead ? '/lead/employees' : '/employees')
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Update failed' })
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size={32} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader title="Error" />
          <div className="px-6 pb-6 text-rose-600 font-medium">{error}</div>
        </Card>
      </div>
    )
  }

  const watched = watch()

  return (
    <div className="max-w-full overflow-x-hidden px-3 md:px-4 lg:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold" style={{ lineHeight: 1 }}>Edit Employee Details</h1>
        <p className="text-sm text-ink-muted mt-1">Refine system access, department profiles, contact details and document copies.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-6">
            
            {/* Personal Information */}
            <Card>
              <CardHeader title="Personal Information" />
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Full Legal Name <span className="text-rose-600">*</span></label>
                    <input {...register('name', { required: 'Name is required' })} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                    {errors.name && <div className="text-rose-600 text-xs mt-1">{errors.name.message}</div>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Employee ID (read-only)</label>
                    <input {...register('employeeCode')} readOnly className="mt-1 h-10 w-full rounded-lg border border-line bg-surface-muted px-3 text-sm text-ink-muted cursor-not-allowed" />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Gender</label>
                    <select {...register('gender')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Date of Birth</label>
                    <input type="date" {...register('dob')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Phone Number <span className="text-rose-600">*</span></label>
                    <input
                      {...register('phone', {
                        required: 'Phone is required',
                        pattern: {
                          value: /^\d{10}$/,
                          message: 'Phone number must be exactly 10 digits',
                        },
                      })}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 10)
                        setValue('phone', val, { shouldValidate: true })
                      }}
                      className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink"
                      placeholder="e.g. 9876543210"
                    />
                    {errors.phone && <div className="text-rose-600 text-xs mt-1">{errors.phone.message}</div>}
                  </div>
                </div>
              </div>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader title="Professional Information" />
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Email prefix <span className="text-rose-600">*</span></label>
                    <div className="flex items-center gap-3">
                      <input
                        {...register('emailLocal', {
                          required: 'Email prefix is required',
                          pattern: {
                            value: /^[a-zA-Z0-9._-]+$/,
                            message: 'Invalid characters in email prefix',
                          },
                        })}
                        className="mt-1 h-10 flex-1 rounded-lg border border-line bg-surface px-3 text-sm text-ink min-w-0"
                        placeholder="e.g. john.doe"
                      />
                      <span className="text-sm text-ink-muted">@complianceos.com</span>
                    </div>
                    {errors.emailLocal && <div className="text-rose-600 text-xs mt-1">{errors.emailLocal.message}</div>}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Reporting Team Lead</label>
                    <select {...register('reportingTL')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                      <option>Vikram Malhotra</option>
                      <option>Priya Kulkarni</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Department</label>
                    <select {...register('department')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                      <option>Compliance</option>
                      <option>Operations</option>
                      <option>Analytics</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Designation</label>
                    <select {...register('designation')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                      <option>Associate</option>
                      <option>Reviewer</option>
                      <option>Partner</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Employment Type</label>
                    <select {...register('employmentType')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                      <option>Intern</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Joining Date</label>
                    <input type="date" {...register('joiningDate')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">Status</label>
                    <select {...register('status')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink">
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Address Details */}
            <Card>
              <CardHeader title="Address Details" />
              <div className="px-6 pb-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-ink-muted">Permanent Address</label>
                  <textarea {...register('address')} rows={3} className="mt-1 w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink" />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">City</label>
                    <input {...register('city')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">State</label>
                    <input {...register('state')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-muted">PIN Code</label>
                    <input {...register('pinCode')} className="mt-1 h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink" />
                  </div>
                </div>
              </div>
            </Card>

            {/* ID Proof & Resume Documents */}
            <Card>
              <CardHeader title="Compliance Documents" />
              <div className="px-6 pb-6 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="border border-dashed border-line p-4 rounded-lg flex flex-col items-center">
                    <span className="text-sm font-semibold">ID Proof (Aadhaar/PAN)</span>
                    <span className="text-xs text-ink-muted mt-1">{watched.idProof ? watched.idProof.name : 'No file uploaded'}</span>
                    <input ref={idProofInputRef} type="file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const d = await readFileAsDataUrl(f); setValue('idProof', { name: f.name, data: d || '' }) } }} style={{ display: 'none' }} />
                    <button type="button" onClick={() => idProofInputRef.current?.click()} className="mt-3 px-4 py-1.5 rounded bg-amber text-white text-xs font-bold" style={{ backgroundColor: 'var(--color-amber)' }}>Upload File</button>
                  </div>

                  <div className="border border-dashed border-line p-4 rounded-lg flex flex-col items-center">
                    <span className="text-sm font-semibold">Resume / CV</span>
                    <span className="text-xs text-ink-muted mt-1">{watched.resume ? watched.resume.name : 'No file uploaded'}</span>
                    <input ref={resumeInputRef} type="file" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const d = await readFileAsDataUrl(f); setValue('resume', { name: f.name, data: d || '' }) } }} style={{ display: 'none' }} />
                    <button type="button" onClick={() => resumeInputRef.current?.click()} className="mt-3 px-4 py-1.5 rounded bg-amber text-white text-xs font-bold" style={{ backgroundColor: 'var(--color-amber)' }}>Upload File</button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Headshot upload */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader title="Employee Photo" />
              <div className="px-6 pb-6 flex flex-col items-center">
                <div className="w-36 h-36 rounded-full bg-gray-100 flex items-center justify-center relative border border-line">
                  {watched.profilePhoto ? (
                    <img src={watched.profilePhoto.data} alt="avatar" className="w-36 h-36 rounded-full object-cover" />
                  ) : (
                    <div className="text-3xl font-semibold text-ink-muted">
                      {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-ink-muted text-center">Upload a high-resolution photo for internal directory and ID generation.</div>
                <input ref={photoInputRef} type="file" accept="image/*" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const d = await readFileAsDataUrl(f); setValue('profilePhoto', { name: f.name, data: d || '' }) } }} style={{ display: 'none' }} />
                <div className="mt-4 flex gap-2 w-full justify-center">
                  <button type="button" onClick={() => photoInputRef.current?.click()} className="px-3 py-1.5 rounded bg-amber text-white text-xs font-bold" style={{ backgroundColor: 'var(--color-amber)' }}>Upload</button>
                  {watched.profilePhoto && (
                    <button type="button" onClick={() => setValue('profilePhoto', undefined)} className="px-3 py-1.5 rounded border text-xs font-bold">Remove</button>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3 pb-12">
          <Button type="button" className="w-full sm:w-auto" variant="ghost" onClick={() => navigate(isLead ? '/lead/employees' : '/employees')}>Cancel</Button>
          <Button type="submit" className="w-full sm:w-auto" variant="primary" disabled={!isValid || isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </form>
    </div>
  )
}
