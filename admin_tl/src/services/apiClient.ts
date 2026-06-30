  /// <reference types="vite/client" />
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://team-management-intern-s-pzly.vercel.app/api';
//const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const STORAGE_KEY = 'teamlead_session';

interface RequestOptions extends RequestInit {
  body?: any;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from storage
  let token: string | null = null;
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      token = parsed.token || null;
    }
  } catch (_) {}

  const isFormData = options.body instanceof FormData;

  const headers = new Headers({
    'Accept': 'application/json',
  });

  if (!isFormData) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...Object.fromEntries(headers.entries()),
      ...(options.headers || {}),
    },
  };

  if (options.body) {
    config.body = isFormData ? options.body : JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);
    
    if (response.status === 401 && !endpoint.includes('/auth/login')) {
      sessionStorage.removeItem(STORAGE_KEY);
      // Trigger a redirect to login if we have a window session
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new ApiError('Session expired. Please log in again.', 401);
    }

    if (!response.ok) {
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const body = await response.json();
        if (body) {
          if (body.message) {
            errorMessage = body.message;
          } else if (body.error && body.error.message) {
            errorMessage = body.error.message;
          }
        }
      } catch (_) {}
      throw new ApiError(errorMessage, response.status);
    }

    // 204 No Content
    if (response.status === 204) {
      return null;
    }

    const body = await response.json();
    if (body && typeof body === 'object' && body.success === true && 'data' in body) {
      return body.data;
    }
    return body;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error('Network error. Please check your connection.');
  }
}

export const apiClient = {
  get: (endpoint: string, options?: RequestOptions) => 
    request(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint: string, body?: any, options?: RequestOptions) => 
    request(endpoint, { ...options, method: 'POST', body }),
  
  put: (endpoint: string, body?: any, options?: RequestOptions) => 
    request(endpoint, { ...options, method: 'PUT', body }),
  
  delete: (endpoint: string, options?: RequestOptions) => 
    request(endpoint, { ...options, method: 'DELETE' }),
};
