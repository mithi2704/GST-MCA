import { useState } from "react"
import { type Client } from "@/data/clients"
import { clientService } from "@/services/clientService"
import { toast } from "@/components/ui/Toast"
import { useNavigate } from "react-router-dom"
import { Building2, Check, ChevronRight, Info, ShieldCheck, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/Card"
import { cn } from "@/lib/utils"

const steps = ["Entity Info", "Tax & Compliance", "Team & Billing"]

const services = [
  { id: "gst", title: "GST Filing", desc: "Monthly GSTR-1, 3B, and 9C" },
  { id: "mca", title: "MCA Compliance", desc: "Annual Filings & Board Meetings" },
  { id: "audit", title: "Audit Services", desc: "Statutory & Internal Audits" },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="max-w-6xl mx-auto px-4">
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

  const inputCls =
  "h-10 w-full rounded-lg border border-line bg-surface px-4 text-sm text-ink placeholder:text-ink-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"

export function OnboardClientView({ basePath }: { basePath: string }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [selectedServices, setSelectedServices] = useState<string[]>(["gst"])
  const [company, setCompany] = useState("")
  const [contactPerson, setContactPerson] = useState("")
  const contactEmail = ""

  function toggleService(id: string) {
    setSelectedServices((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  async function doSave() {
    try {
      await clientService.createClient({
        company: company || `New Client ${Date.now()}`,
        contactPerson: contactPerson || 'Primary Contact',
        contactMobile: '',
        contactEmail: contactEmail || '',
        gstin: '',
        pan: '',
        address: '',
      } as any);
      toast({ type: 'success', message: 'Client onboarded successfully!' });
      navigate(basePath);
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Onboarding failed' });
    }
  }

  function goBack() {
    try {
      if (window.history.length > 1) {
        navigate(-1)
        return
      }
    } catch {}
    navigate(basePath)
  }

  return (
    <div>
      <nav className="mb-3 flex items-center gap-2 text-sm font-medium text-ink-muted">
        <button onClick={() => goBack()} className="hover:text-ink-soft">
          Clients
        </button>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-semibold text-gold-dark">Onboard New Client</span>
      </nav>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="font-extrabold tracking-tight text-ink" style={{ fontSize: 30, fontWeight: 800 }}>Onboard New Client</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Initialize compliance workflows and tax profiles for a new corporate entity.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate(basePath)} className="h-9 px-3 rounded-md text-sm">
            Cancel
          </Button>
          <Button variant="primary" onClick={() => navigate(basePath)} className="h-9 px-4 shadow-sm rounded-md text-sm">
            Save &amp; Add Client
          </Button>
        </div>
      </div>

      {/* Stepper */}
      <Card className="mb-6 rounded-lg shadow-sm">
        <div className="flex items-center px-4 py-3">
          {steps.map((label, i) => (
            <div key={label} className={cn("flex items-center", i < steps.length - 1 && "flex-1")}>
              <button
                onClick={() => setStep(i)}
                className="flex items-center gap-2"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sm font-semibold",
                    i < step
                      ? "bg-gold-dark text-white"
                      : i === step
                        ? "bg-gold-dark text-white"
                        : "border border-line bg-surface text-ink-muted",
                  )}
                >
                  {i < step ? <Check className="h-4 w-4" /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    i <= step ? "text-gold-dark" : "text-ink-muted",
                  )}
                >
                  {label}
                </span>
              </button>
              {i < steps.length - 1 && <div className="mx-3 h-px flex-1 bg-line" />}
            </div>
          ))}
        </div>
      </Card>

      {step === 0 && (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2 p-6 rounded-lg shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gold-dark" style={{ fontSize: 18 }}>
                <Building2 className="h-5 w-5" /> Company Information
              </h2>
              <div className="space-y-4">
                <Field label="Legal Company Name *">
                  <input value={company} onChange={(e) => setCompany(e.target.value)} className={inputCls} placeholder="e.g. Acme Technologies Private Limited" />
                </Field>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Entity Type">
                    <select className={inputCls}>
                      <option>Private Limited Company</option>
                      <option>Public Limited Company</option>
                      <option>LLP</option>
                      <option>Proprietorship</option>
                    </select>
                  </Field>
                  <Field label="Industry">
                    <select className={inputCls}>
                      <option>Information Technology</option>
                      <option>Manufacturing</option>
                      <option>Retail</option>
                      <option>Pharmaceuticals</option>
                    </select>
                  </Field>
                </div>
                <Field label="Registered Address">
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-line bg-surface p-3 text-sm text-ink placeholder:text-ink-muted focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/20"
                    placeholder="Flat/Plot No, Building Name, Street, Locality"
                  />
                </Field>
              </div>
            </Card>

            <Card className="p-6 rounded-lg shadow-sm">
              <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gold-dark">
                <ListChecks className="h-5 w-5" /> Service Scope
              </h2>
              <div className="space-y-3">
                {services.map((svc) => {
                  const checked = selectedServices.includes(svc.id)
                  return (
                    <button
                      key={svc.id}
                      onClick={() => toggleService(svc.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors",
                          checked ? "border-gold bg-amber-soft" : "border-line bg-surface hover:bg-surface-muted",
                        )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-5 w-5 items-center justify-center rounded border",
                          checked ? "border-gold-dark bg-gold-dark text-white" : "border-line bg-surface",
                        )}
                      >
                        {checked && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span>
                        <span className="block text-sm font-bold text-ink">{svc.title}</span>
                        <span className="block text-xs text-ink-muted">{svc.desc}</span>
                      </span>
                    </button>
                  )
                })}
              </div>


            </Card>
          </div>

          <Card className="mt-6 p-6 rounded-lg shadow-sm">
            <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-gold-dark">
              <ShieldCheck className="h-5 w-5" /> Compliance Identifiers
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="PAN Card">
                  <input className={inputCls} placeholder="ABCDE1234F" />
                </Field>
                <Field label="GSTIN Number">
                  <input className={inputCls} placeholder="27AAAAA0000A1Z5" />
                </Field>
                <Field label="TAN (TDS Account)">
                  <input className={inputCls} placeholder="MUMB00123C" />
                </Field>
              </div>
              <div className="ml-2 flex items-center">
                <Button variant="dark" className="h-11 w-36" style={{ height: 44, backgroundColor: '#111827', boxShadow: 'none' }}>
                  Verify
                </Button>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-6 mt-6">
            <Card className="lg:col-span-2 p-6 rounded-lg shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">Primary Contact Details</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full Name">
                    <input className={inputCls} placeholder="e.g. John Doe" />
                  </Field>
                  <Field label="Designation">
                    <input className={inputCls} placeholder="e.g. CFO / Director" />
                  </Field>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Email Address">
                    <input className={inputCls} placeholder="john.doe@company.com" />
                  </Field>
                  <Field label="Phone Number">
                    <input className={inputCls} placeholder="+91 98765 43210" />
                  </Field>
                </div>
              </div>
            </Card>

            <Card className="p-6 rounded-lg shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-ink">Billing Details</h2>
              <div className="space-y-3">
                <Field label="Filing Cycle">
                  <div className="flex items-center gap-2">
                    <button className="rounded-md border border-line px-3 py-1 text-sm bg-amber-tint">Monthly</button>
                    <button className="rounded-md border border-line px-3 py-1 text-sm">Quarterly</button>
                  </div>
                </Field>
                <Field label="Billing Contact (if different)">
                  <input className={inputCls} placeholder="accounts@company.com" />
                </Field>
              </div>
            </Card>
          </div>
        </>
      )}

      {step === 1 && (
        <Card className="p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gold-dark">
            <ShieldCheck className="h-5 w-5" /> Tax &amp; Compliance Setup
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="GST Registration Type">
              <select className={inputCls}>
                <option>Regular</option>
                <option>Composition</option>
                <option>SEZ Unit</option>
              </select>
            </Field>
            <Field label="Filing Frequency">
              <select className={inputCls}>
                <option>Monthly</option>
                <option>Quarterly</option>
              </select>
            </Field>
            <Field label="Financial Year Start">
              <input type="month" className={inputCls} defaultValue="2026-04" />
            </Field>
            <Field label="State Jurisdiction">
              <select className={inputCls}>
                <option>Maharashtra</option>
                <option>Karnataka</option>
                <option>Delhi</option>
              </select>
            </Field>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-gold-dark">
            <ListChecks className="h-5 w-5" /> Team &amp; Billing
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Assign Team Lead">
              <select className={inputCls} value={contactPerson} onChange={(e) => setContactPerson(e.target.value)}>
                <option value="">Select</option>
                <option value="Vikram Sharma">Vikram Sharma</option>
                <option value="Priyanka Lal">Priyanka Lal</option>
                <option value="Arjun Kapoor">Arjun Kapoor</option>
              </select>
            </Field>
            <Field label="Billing Cycle">
              <select className={inputCls}>
                <option>Monthly</option>
                <option>Quarterly</option>
                <option>Annual</option>
              </select>
            </Field>
            <Field label="Monthly Retainer (₹)">
              <input className={inputCls} placeholder="4500" />
            </Field>
            <Field label="Onboarding Date">
              <input type="date" className={inputCls} defaultValue="2026-06-13" />
            </Field>
          </div>
        </Card>
      )}

      <div className="mt-6 flex justify-between items-center">
        <div>
          <Button variant="outline" onClick={() => navigate(basePath)}>Discard Draft</Button>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
          {step < steps.length - 1 ? (
            <Button variant="primary" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>Continue</Button>
          ) : (
            <Button variant="primary" onClick={doSave}>Save &amp; Add Client</Button>
          )}
        </div>
      </div>

      
    </div>
  )
}
