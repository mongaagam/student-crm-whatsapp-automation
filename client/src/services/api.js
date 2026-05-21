import axios from 'axios';

// =========================================================================
// Axios API Instance — points to backend
// =========================================================================
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =========================================================================
// Auth API helpers
// =========================================================================
export const auth = {
  login: async (data) => {
    const response = await API.post('/auth/login', data);
    return response.data;
  },
  register: async (data) => {
    const response = await API.post('/auth/register', data);
    return response.data;
  },
  getMe: async () => {
    const response = await API.get('/auth/me');
    return response.data;
  },
};

// =========================================================================
// Leads API helpers
// =========================================================================
export const leads = {
  getAll: async (params = {}) => {
    const response = await API.get('/leads', { params });
    return response.data;
  },
  create: async (data) => {
    const response = await API.post('/leads', data);
    return response.data;
  },
  update: async (id, data) => {
    const response = await API.put(`/leads/${id}`, data);
    return response.data;
  },
  delete: async (id) => {
    const response = await API.delete(`/leads/${id}`);
    return response.data;
  },
  analyzeAI: async (id) => {
    const response = await API.post(`/leads/${id}/analyze`);
    return response.data;
  },
  sendWhatsApp: async (id, message) => {
    const response = await API.post(`/leads/${id}/whatsapp`, { message });
    return response.data;
  },
  importCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await API.post('/leads/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  downloadCSV: async () => {
    const response = await API.get('/leads/export', { responseType: 'blob' });
    return response.data;
  },
};

// =========================================================================
// Stats / Dashboard API helpers
// =========================================================================
export const stats = {
  getDashboard: async () => {
    const response = await API.get('/leads/stats/dashboard');
    return response.data;
  },
  getWhatsAppLogs: async () => {
    const response = await API.get('/leads/stats/whatsapp-logs');
    return response.data;
  },
};

// =========================================================================
// Automation / Cron API helpers
// =========================================================================
export const automation = {
  triggerFollowups: async () => {
    const response = await API.post('/leads/automation/trigger-followups');
    return response.data;
  },
  triggerReport: async () => {
    const response = await API.post('/leads/automation/trigger-daily-report');
    return response.data;
  },
  triggerDailyReport: async () => {
    const response = await API.post('/leads/automation/trigger-daily-report');
    return response.data;
  },
};

export default API;