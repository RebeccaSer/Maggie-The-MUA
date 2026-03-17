import axios from 'axios';
import { authAPI as localAuthAPI } from './auth'; // Import with different name to avoid conflict

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localAuthAPI.logout();
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const servicesAPI = {
  getServices: () => api.get('/services'),
  getAddons: () => api.get('/services/addons'),
  getPackages: () => api.get('/services/packages'),
  createService: (data) => api.post('/admin/services', data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
};

export const appointmentsAPI = {
  getAppointments: () => api.get('/admin/appointments'),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  create: (data) => api.post('/appointments/book', data),
  reschedule: (id, data) => api.post(`/appointments/${id}/reschedule`, data),
  cancel: (id) => api.post(`/appointments/${id}/cancel`),
  updateStatus: (id, status) => api.put(`/admin/appointments/${id}`, { status }),
};

// Remove the duplicate authAPI export since it's already defined in auth.js
// Only export backend API calls for authentication
export const backendAuthAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const adminAPI = {
  getDashboardStats: () => api.get('/admin/dashboard'),
  getRevenueReports: (params) => api.get('/admin/reports/revenue', { params }),
  managePromotions: {
    get: () => api.get('/admin/promotions'),
    create: (data) => api.post('/admin/promotions', data),
    update: (id, data) => api.put(`/admin/promotions/${id}`, data),
    delete: (id) => api.delete(`/admin/promotions/${id}`),
  }
};

export default api;