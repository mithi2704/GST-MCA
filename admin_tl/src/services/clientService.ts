import { apiClient } from './apiClient';
import type { Client } from '@/data/clients';

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

const mapClient = (cli: any): Client => {
  return {
    id: String(cli.id),
    company: cli.companyName,
    serviceType: 'GST + MCA',
    contactPerson: cli.contactPerson || '',
    contactMobile: cli.phone || '',
    contactEmail: cli.email || '',
    gstin: cli.gstNumber || '',
    pan: cli.panNumber || '',
    assignedTL: cli.assignedTL?.user?.employee ? `${cli.assignedTL.user.employee.firstName} ${cli.assignedTL.user.employee.lastName}` : 'Unassigned',
    assignedTLInitials: 'UA',
    status: cli.status === 'ACTIVE' ? 'Active' : 'On Hold',
    address: cli.address || '',
    employees: [],
    totalTasks: cli.tasks?.length || 0,
    completedTasks: cli.tasks?.filter((t: any) => t.status === 'COMPLETED').length || 0,
    pendingTasks: cli.tasks?.filter((t: any) => t.status === 'PENDING').length || 0,
    overdueTasks: cli.tasks?.filter((t: any) => t.status === 'OVERDUE').length || 0,
    documents: []
  };
};

export const clientService = {
  getClients: async (): Promise<Client[]> => {
    const raw = await apiClient.get(`${getPrefix()}/clients`);
    const list = Array.isArray(raw) ? raw : (raw as any)?.clients || [];
    return list.map(mapClient);
  },
  getClientById: async (id: string): Promise<Client> => {
    const raw = await apiClient.get(`${getPrefix()}/clients/${id}`);
    return mapClient(raw);
  },
  createClient: async (client: Omit<Client, 'id'>): Promise<Client> => {
    const payload = {
      companyName: client.company,
      contactPerson: client.contactPerson,
      email: client.contactEmail,
      phone: client.contactMobile,
      gstNumber: client.gstin,
      panNumber: client.pan,
      address: client.address
    };
    const raw = await apiClient.post(`${getPrefix()}/clients`, payload);
    return mapClient(raw);
  },
  updateClient: async (id: string, updates: Partial<Client>): Promise<Client> => {
    const payload: any = {};
    if (updates.company) payload.companyName = updates.company;
    if (updates.contactPerson) payload.contactPerson = updates.contactPerson;
    if (updates.contactEmail) payload.email = updates.contactEmail;
    if (updates.contactMobile) payload.phone = updates.contactMobile;
    if (updates.gstin) payload.gstNumber = updates.gstin;
    if (updates.pan) payload.panNumber = updates.pan;
    if (updates.address) payload.address = updates.address;

    const raw = await apiClient.put(`${getPrefix()}/clients/${id}`, payload);
    return mapClient(raw);
  },
  deleteClient: async (id: string): Promise<void> => {
    return apiClient.delete(`${getPrefix()}/clients/${id}`);
  }
};
