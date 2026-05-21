import axios from 'axios';

const API_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auto-inject JWT token into requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Leads CRUD & Direct actions endpoints
export const leads = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.country && filters.country !== 'all') params.append('country', filters.country);
    if (filters.course && filters.course !== 'all') params.append('course', filters.course);

    const response = await api.get(`/leads?${params.toString()}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/leads/${id}`);
    return response.data;
  },
  create: async (leadData) => {
    const response = await api.post('/leads', leadData);
    return response.data;
  },
  update: async (id, leadData) => {
    const response = await api.put(`/leads/${id}`, leadData);
    return response.data;
  },
  delete: async (id) => {
    const response = await api.delete(`/leads/${id}`);
    return response.data;
  },
  analyzeAI: async (id) => {
    const response = await api.post(`/leads/${id}/analyze`);
    return response.data;
  },
  sendWhatsApp: async (id, message) => {
    const response = await api.post(`/leads/${id}/whatsapp`, { message });
    return response.data;
  },
  importCSV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/leads/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  exportCSVUrl: () => {
    const token = localStorage.getItem('crm_token');
    return `${API_URL}/leads/export?token=${token}`; // Token can be passed in query or interceptor handled differently, but standard download links trigger direct GETs. We will download using fetch and object URLs for safety.
  },
  downloadCSV: async () => {
    const token = localStorage.getItem('crm_token');
    const response = await axios({
      url: `${API_URL}/leads/export`,
      method: 'GET',
      responseType: 'blob',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  }
};

// Analytics and logs statistics
export const stats = {
  getDashboard: async () => {
    const response = await api.get('/leads/stats/dashboard');
    return response.data;
  },
  getWhatsAppLogs: async () => {
    const response = await api.get('/leads/stats/whatsapp-logs');
    return response.data;
  }
};

// Cron jobs manual automation triggers
export const automation = {
  triggerFollowups: async () => {
    const response = await api.post('/leads/automation/trigger-followups');
    return response.data;
  },
  triggerDailyReport: async () => {
    const response = await api.post('/leads/automation/trigger-daily-report');
    return response.data;
  }
};

export { api };

