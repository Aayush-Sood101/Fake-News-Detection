import axios, { AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Create axios instance
export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookie-based auth
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Redirect to login on unauthorized
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: (data: { email: string; password: string; name: string; role: string }) =>
    api.post('/auth/signup', data),
    
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
    
  logout: () => api.post('/auth/logout'),
};

// Predict API
export const predictApi = {
  submit: (formData: FormData) =>
    api.post('/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
    
  get: (id: string) => api.get(`/predict/${id}`),
  
  submitFeedback: (id: string, feedback: 'correct' | 'incorrect') =>
    api.post(`/predict/${id}/feedback`, { feedback }),
};

// History API
export const historyApi = {
  list: (params?: { page?: number; limit?: number; label?: string }) =>
    api.get('/history', { params }),
    
  getStats: () => api.get('/history/stats'),
};

// Health API
export const healthApi = {
  check: () => api.get('/health'),
};
