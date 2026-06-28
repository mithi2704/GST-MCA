export type ClientStatus = "Active" | "On Hold" | "Overdue"
export type ServiceType = "GST + MCA" | "Audit" | "MCA Only" | "GST"

export interface ClientDocument {
  name: string
  type: string
  version: string
  updated: string
  size: string
}

export interface Client {
  id: string
  company: string
  serviceType: ServiceType
  contactPerson: string
  contactMobile: string
  contactEmail: string
  gstin: string
  pan: string
  assignedTL: string
  assignedTLInitials: string
  status: ClientStatus
  address: string
  employees: string[]
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
  documents: ClientDocument[]
}

export const clients: Client[] = []

export const clientStats = {
  total: "0",
  complianceRate: "0%",
  pendingFilings: 0,
  auditPipeline: "₹ 0M",
}

export function getClient(id: string) {
  return clients.find((c) => c.id === id)
}
