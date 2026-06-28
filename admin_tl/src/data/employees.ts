export type EmployeeStatus = "Active" | "Inactive"

export interface AttendanceRecord {
  date: string
  checkIn: string
  checkOut: string
  hours: string
  location: string
}

export interface Employee {
  id: string
  name: string
  avatar?: string
  mobile: string
  email: string
  designation: string
  team: string
  status: EmployeeStatus
  score: number
  rank: number
  tasksClosed: number
  joiningDate: string
  address: string
  incentiveEarned: number
  assignedTasks: number
  completedTasks: number
  pendingTasks: number
  attendance: AttendanceRecord[]
}

export const employees: Employee[] = []

export function getEmployee(id: string) {
  return employees.find((e) => e.id === id)
}
