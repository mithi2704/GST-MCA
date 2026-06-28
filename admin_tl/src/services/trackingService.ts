import { apiClient } from './apiClient';
import type { TrackingRow, GeoRecord } from '@/data/tracking';

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

export const trackingService = {
  getTrackingRows: async (): Promise<TrackingRow[]> => {
    return apiClient.get(`${getPrefix()}/tracking`);
  },
  getGeoRecords: async (employeeId: string): Promise<GeoRecord[]> => {
    return apiClient.get(`${getPrefix()}/tracking/${employeeId}/geo`);
  }
};
