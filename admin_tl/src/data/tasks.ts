export type TaskStatus =
  | "Not Started"
  | "In Progress"
  | "Waiting For Client"
  | "Review"
  | "Completed"
  | "Overdue"

export type TaskPriority = "Low" | "Medium" | "High" | "Critical"

export interface WorkLog {
  date: string
  employee: string
  note: string
  hours: string
}

export interface TimelineEvent {
  label: string
  date: string
  done: boolean
}

export interface Task {
  id: string
  name: string
  shortNote: string
  client: string
  employee: string | null
  priority: TaskPriority
  progress: number
  status: TaskStatus
  dueDate: string
  attachments: string[]
  timeline: TimelineEvent[]
  workLogs: WorkLog[]
  statusHistory: { status: TaskStatus; date: string }[]
}

export const tasks: Task[] = []

export function getTask(id: string) {
  return tasks.find((t) => t.id === id)
}
