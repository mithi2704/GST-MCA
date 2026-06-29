import { apiClient } from './apiClient';

export interface Incentive {
  id: number;
  employeeId: number;
  amount: number;
  month: string;
  createdAt: string;
  employee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
}

export interface FreezeStatus {
  id?: number;
  month: string;
  isFrozen: boolean;
}

export const incentiveService = {
  getIncentives: async (month?: string): Promise<{ incentives: Incentive[]; total: number }> => {
    const query = month ? `?month=${month}&limit=100` : '?limit=100';
    return apiClient.get(`/admin/incentives${query}`);
  },

  createIncentive: async (data: {
    employeeId: number;
    amount: number;
    month: string;
  }): Promise<Incentive> => {
    return apiClient.post('/admin/incentives', data);
  },

  getFreezeStatus: async (month: string): Promise<FreezeStatus> => {
    return apiClient.get(`/admin/incentives/freeze?month=${month}`);
  },

  setFreezeStatus: async (month: string, isFrozen: boolean): Promise<FreezeStatus> => {
    return apiClient.post('/admin/incentives/freeze', { month, isFrozen });
  },

  getTLIncentives: async (): Promise<any> => {
    return apiClient.get('/teamlead/incentives');
  },

  calculateTLIncentives: async (month: string): Promise<any> => {
    return apiClient.post('/teamlead/incentives/calculate', { month });
  }
};
