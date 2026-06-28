import type { TaskStatus } from "./tasks"

export interface AnalyticsRow {
  client: string
  taskName: string
  shortNote: string
  employee: string
  progress: number
  status: TaskStatus
}

export const analyticsRows: AnalyticsRow[] = []
