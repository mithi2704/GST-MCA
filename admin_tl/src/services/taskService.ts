import { apiClient } from './apiClient';
import type { Task } from '@/data/tasks';

const getPrefix = () => {
  const rawSession = sessionStorage.getItem('teamlead_session');
  if (rawSession) {
    try {
      const user = JSON.parse(rawSession);
      if (user.role === 'Super Admin') return '/admin';
      if (user.role === 'Team Lead') return '/teamlead';
    } catch {}
  }
  return '/admin';
};

const mapPriority = (p: string): any => {
  const map: Record<string, string> = {
    'LOW': 'Low',
    'MEDIUM': 'Medium',
    'HIGH': 'High',
    'URGENT': 'Critical'
  };
  return map[p] || 'Medium';
};

const mapStatus = (s: string): any => {
  const map: Record<string, string> = {
    'PENDING': 'Not Started',
    'IN_PROGRESS': 'In Progress',
    'COMPLETED': 'Completed',
    'OVERDUE': 'Overdue',
    'WAITING_FOR_CLIENT': 'Waiting For Client',
    'REVIEW': 'Review'
  };
  return map[s] || 'Not Started';
};

const mapTask = (task: any): Task => {
  const latestUpdate = task.workUpdates?.[0];
  const progress = latestUpdate?.progress ?? 0;
  const attachments = (latestUpdate?.attachments || []).map((a: any) => a.fileName);

  return {
    id: String(task.id),
    name: task.title,
    shortNote: task.description || '',
    client: task.client?.companyName || 'Unknown Client',
    employee: task.assignedEmployee ? `${task.assignedEmployee.firstName} ${task.assignedEmployee.lastName}` : null,
    employeeId: task.assignedEmployee ? String(task.assignedEmployee.id) : undefined,
    priority: mapPriority(task.priority),
    status: mapStatus(task.status),
    progress,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
    attachments,
    timeline: [],
    workLogs: [],
    statusHistory: []
  } as any;
};

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const raw = await apiClient.get(`${getPrefix()}/tasks`);
    const list = Array.isArray(raw) ? raw : (raw as any)?.tasks || [];
    return list.map(mapTask);
  },
  getTaskById: async (id: string): Promise<Task> => {
    const raw = await apiClient.get(`${getPrefix()}/tasks/${id}`);
    return mapTask(raw);
  },
  createTask: async (task: any): Promise<Task> => {
    const payload = {
      title: task.title || task.name,
      description: task.description || task.shortNote || '',
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate || new Date().toISOString(),
      clientId: task.clientId,
      assignedEmployeeId: task.assignedEmployeeId
    };
    const raw = await apiClient.post(`${getPrefix()}/tasks`, payload);
    return mapTask(raw);
  },
  updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
    const payload: any = {};
    const anyUpdates = updates as any;
    if (anyUpdates.name) payload.title = anyUpdates.name;
    if (anyUpdates.shortNote !== undefined) payload.description = anyUpdates.shortNote;
    if (anyUpdates.status) {
      const map: Record<string, string> = {
        'Not Started': 'PENDING',
        'In Progress': 'IN_PROGRESS',
        'Completed': 'COMPLETED',
        'Overdue': 'OVERDUE',
        'Waiting For Client': 'WAITING_FOR_CLIENT',
        'Review': 'REVIEW'
      };
      payload.status = map[anyUpdates.status];
    }
    if (anyUpdates.priority) {
      const map: Record<string, string> = {
        'Low': 'LOW',
        'Medium': 'MEDIUM',
        'High': 'HIGH',
        'Critical': 'URGENT'
      };
      payload.priority = map[anyUpdates.priority];
    }
    if (anyUpdates.dueDate) payload.dueDate = new Date(anyUpdates.dueDate).toISOString();
    if ('employeeId' in anyUpdates) {
      payload.assignedEmployeeId = anyUpdates.employeeId ? parseInt(anyUpdates.employeeId) : null;
    }

    const raw = await apiClient.put(`${getPrefix()}/tasks/${id}`, payload);
    return mapTask(raw);
  },
  deleteTask: async (id: string): Promise<void> => {
    return apiClient.delete(`${getPrefix()}/tasks/${id}`);
  },
  assignTask: async (taskId: string, employeeId: string | null): Promise<Task> => {
    const raw = await apiClient.post(`${getPrefix()}/tasks/${taskId}/assign`, { 
      employeeId: employeeId ? parseInt(employeeId) : null 
    });
    return mapTask(raw);
  }
};
