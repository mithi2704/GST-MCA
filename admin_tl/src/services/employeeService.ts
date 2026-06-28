import { apiClient } from './apiClient';
import type { Employee } from '@/data/employees';

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

const mapEmployee = (emp: any): Employee => {
  return {
    id: String(emp.id),
    name: `${emp.firstName} ${emp.lastName}`,
    avatar: emp.profilePhotoUrl || undefined,
    mobile: emp.phone || '',
    email: emp.email,
    designation: emp.designation || 'Associate',
    team: emp.department || 'Compliance',
    status: emp.status === 'ACTIVE' ? 'Active' : 'Inactive',
    score: emp.performanceScore || 85,
    rank: emp.rank || 1,
    tasksClosed: emp.tasksClosed || 0,
    joiningDate: emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : '',
    address: emp.address || '',
    assignedTasks: emp.assignedTasks || 0,
    completedTasks: emp.completedTasks || 0,
    pendingTasks: emp.pendingTasks || 0,
  } as any;
};

export const employeeService = {
  getEmployees: async (): Promise<Employee[]> => {
    const raw = await apiClient.get(`${getPrefix()}/employees`);
    const list = Array.isArray(raw) ? raw : (raw as any)?.employees || [];
    return list.map(mapEmployee);
  },
  getEmployeeById: async (id: string): Promise<Employee> => {
    const raw = await apiClient.get(`${getPrefix()}/employees/${id}`);
    return mapEmployee(raw);
  },
  createEmployee: async (employee: any): Promise<Employee> => {
    const [firstName, ...lastNameParts] = (employee.name || '').split(' ');
    const lastName = lastNameParts.join(' ') || ' ';
    const payload = {
      firstName: employee.firstName || firstName || 'Name',
      lastName: employee.lastName || lastName || ' ',
      email: employee.email,
      phone: employee.mobile || employee.phone || '',
      department: employee.team || employee.department || 'Compliance',
      designation: employee.designation || 'Associate',
      joiningDate: employee.joiningDate || new Date().toISOString().split('T')[0],
      password: employee.password || 'Password@123',
      role: employee.role || 'EMPLOYEE',
      profilePhotoUrl: employee.profilePhotoUrl,
      profilePhotoPublicId: employee.profilePhotoPublicId
    };
    const raw = await apiClient.post(`${getPrefix()}/employees`, payload);
    return mapEmployee(raw);
  },
  updateEmployee: async (id: string, updates: any): Promise<Employee> => {
    const payload: any = {};
    if (updates.firstName) payload.firstName = updates.firstName;
    if (updates.lastName) payload.lastName = updates.lastName;
    if (updates.phone) payload.phone = updates.phone;
    if (updates.mobile) payload.phone = updates.mobile;
    if (updates.department) payload.department = updates.department;
    if (updates.team) payload.department = updates.team;
    if (updates.designation) payload.designation = updates.designation;
    if (updates.status) payload.status = updates.status === 'Active' ? 'ACTIVE' : 'INACTIVE';
    if (updates.profilePhotoUrl) payload.profilePhotoUrl = updates.profilePhotoUrl;
    if (updates.profilePhotoPublicId) payload.profilePhotoPublicId = updates.profilePhotoPublicId;

    const raw = await apiClient.put(`${getPrefix()}/employees/${id}`, payload);
    return mapEmployee(raw);
  },
  deactivateEmployee: async (id: string): Promise<void> => {
    return apiClient.delete(`${getPrefix()}/employees/${id}`);
  }
};
