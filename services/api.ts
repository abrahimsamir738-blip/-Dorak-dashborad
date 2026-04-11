import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://paleturquoise-cassowary-158484.hostingersite.com/api/api';

const api: AxiosInstance = axios.create({
 baseURL: API_BASE_URL,
 headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
 },
});

// Request interceptor to add auth token
api.interceptors.request.use(
 (config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
   config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
 },
 (error) => {
  return Promise.reject(error);
 }
);

// Response interceptor for error handling
api.interceptors.response.use(
 (response) => response,
 (error: AxiosError) => {
  if (error.response?.status === 401) {
   // Unauthorized - clear token and redirect to login
   localStorage.removeItem('auth_token');
   localStorage.removeItem('doctor');
   window.location.href = '/login';
  }
  return Promise.reject(error);
 }
);

// Auth API
export const authAPI = {
 login: async (email: string, password: string) => {
  const response = await api.post('/login', { email, password });
  if (response.data.token) {
   localStorage.setItem('auth_token', response.data.token);
   localStorage.setItem('doctor', JSON.stringify(response.data.doctor));
  }
  return response.data;
 },
 register: async (name: string, email: string, password: string) => {
  try {
   const response = await api.post('register', {
    name,
    email,
    password,
    // role: 'doctor'
   });
   return response.data;
  } catch (error) {
   throw error;
  }
 },
 logout: async () => {
  await api.post('/logout');
  localStorage.removeItem('auth_token');
  localStorage.removeItem('doctor');
 },
 me: async () => {
  const response = await api.get('/me');
  return response.data;
 },
};

// Doctor API
export const doctorAPI = {
 getProfile: async () => {
  const response = await api.get('/doctor');
  return response.data;
 },
 updateProfile: async (data: any) => {
  const response = await api.put('/doctor', data);
  return response.data;
 },
};

// Clinic API
export const clinicAPI = {
 getAll: async () => {
  const response = await api.get('/clinics');
  return response.data;
 },
 create: async (data: any) => {
  const response = await api.post('/clinics', data);
  return response.data;
 },
 update: async (id: string | number, data: any) => {
  const response = await api.put(`/clinics/${id}`, data);
  return response.data;
 },
 delete: async (id: string | number) => {
  const response = await api.delete(`/clinics/${id}`);
  return response.data;
 },
};

// Order API
export const orderAPI = {
 getAll: async (clinicId?: string) => {
  const params = clinicId ? { clinicId } : {};
  const response = await api.get('/orders', { params });
  return response.data;
 },
 create: async (data: any) => {
  const response = await api.post('/orders', data);
  return response.data;
 },
 update: async (id: string | number, data: any) => {
  const response = await api.put(`/orders/${id}`, data);
  return response.data;
 },
 delete: async (id: string | number) => {
  const response = await api.delete(`/orders/${id}`);
  return response.data;
 },
};

// Schedule API
export const scheduleAPI = {
 getAll: async (clinicId?: string) => {
  const params = clinicId ? { clinicId } : {};
  const response = await api.get('/schedules', { params });
  return response.data;
 },
 create: async (data: any) => {
  const response = await api.post('/schedules', data);
  return response.data;
 },
 update: async (id: string | number, data: any) => {
  const response = await api.put(`/schedules/${id}`, data);
  return response.data;
 },
 delete: async (id: string | number) => {
  const response = await api.delete(`/schedules/${id}`);
  return response.data;
 },
};

export default api;
