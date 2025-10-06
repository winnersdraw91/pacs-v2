import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/token', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  getCurrentUser: () => api.get('/auth/me'),
};

export const usersAPI = {
  list: (params?: any) => api.get('/users', { params }),
  create: (data: any) => api.post('/users', data),
  update: (id: number, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: number) => api.delete(`/users/${id}`),
};

export const centresAPI = {
  list: (params?: any) => api.get('/centres', { params }),
  get: (id: number) => api.get(`/centres/${id}`),
  create: (data: any) => api.post('/centres', data),
  update: (id: number, data: any) => api.patch(`/centres/${id}`, data),
};

export const studiesAPI = {
  list: (params?: any) => api.get('/studies', { params }),
  get: (id: number) => api.get(`/studies/${id}`),
  create: (data: any) => api.post('/studies', data),
  upload: (studyId: number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post(`/studies/${studyId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  assign: (studyId: number, radiologistId: number) =>
    api.post(`/studies/${studyId}/assign`, { radiologist_id: radiologistId }),
  updateStatus: (studyId: number, status: string) =>
    api.patch(`/studies/${studyId}/status`, { status }),
};

export const reportsAPI = {
  list: (params?: any) => api.get('/reports', { params }),
  get: (id: number) => api.get(`/reports/${id}`),
  create: (data: any) => api.post('/reports', data),
  update: (id: number, data: any) => api.patch(`/reports/${id}`, data),
  verify: (id: number) => api.post(`/reports/${id}/verify`),
};

export const billingAPI = {
  list: (params?: any) => api.get('/billing', { params }),
  get: (id: number) => api.get(`/billing/${id}`),
  create: (data: any) => api.post('/billing', data),
  listPricing: (params?: any) => api.get('/billing/pricing', { params }),
  createPricing: (data: any) => api.post('/billing/pricing', data),
  updatePricing: (id: number, data: any) => api.patch(`/billing/pricing/${id}`, data),
};

export const aiAPI = {
  processStudy: (studyId: number) => api.post(`/ai/process-study/${studyId}`),
  getReport: (studyId: number) => api.get(`/ai/report/${studyId}`),
};
