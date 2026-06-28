import { apiClient } from './apiClient';
import type { AnalyticsRow } from '@/data/analytics';

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

export const analyticsService = {
  getAnalyticsRows: async (): Promise<AnalyticsRow[]> => {
    return apiClient.get(`${getPrefix()}/analytics`);
  },
  getDashboardStats: async () => {
    return apiClient.get(`${getPrefix()}/dashboard`);
  }
};
