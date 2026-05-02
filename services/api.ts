import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
  // لو FormData، امسح الـ Content-Type عشان axios يحطه تلقائياً مع الـ boundary
  if (config.data instanceof FormData) {
   delete config.headers['Content-Type'];
  }
  return config;
 },
 (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
 (response) => response,
 (error: AxiosError) => {
  if (error.response?.status === 401) {
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
  const response = await api.post('/register', { name, email, password });
  return response.data;
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
// Doctor API
export const doctorAPI = {
 getProfile: async () => {
  const response = await api.get('/doctor');
  return response.data;
 },
 updateProfile: async (data: any) => {
  // لو FormData نبعت POST + _method=PUT زي الـ clinics
  if (data instanceof FormData) {
   data.append('_method', 'PUT');
   const response = await api.post('/doctor', data);
   return response.data;
  }
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
 // FormData versions للـ upload
 createFormData: async (formData: FormData) => {
  const response = await api.post('/clinics', formData);
  return response.data;
 },
 updateFormData: async (id: string | number, formData: FormData) => {
  // Laravel مش بيدعم PUT مع FormData — بنبعت POST + _method=PUT
  const response = await api.post(`/clinics/${id}`, formData);
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