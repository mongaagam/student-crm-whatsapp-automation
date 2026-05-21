import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// =========================================================================
// API Instance (shared)
// =========================================================================
const API = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://student-crm-whatsapp-automation.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token into every request automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// =========================================================================
// Auth Context
// =========================================================================
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, try to restore session from localStorage
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('crm_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await API.get('/auth/me');
        if (response.data?.success) {
          setUser(response.data.data);
        } else {
          localStorage.removeItem('crm_token');
        }
      } catch (err) {
        console.warn('Session restore failed:', err.message);
        localStorage.removeItem('crm_token');
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  const login = async (email, password) => {
    const response = await API.post('/auth/login', { email, password });
    if (response.data?.success) {
      const { token, data } = response.data;
      localStorage.setItem('crm_token', token);
      setUser(data);
      return { success: true };
    }
    return { success: false, message: response.data?.message || 'Login failed' };
  };

  const register = async (name, email, password) => {
    const response = await API.post('/auth/register', { name, email, password });
    if (response.data?.success) {
      const { token, data } = response.data;
      localStorage.setItem('crm_token', token);
      setUser(data);
      return { success: true };
    }
    return { success: false, message: response.data?.message || 'Registration failed' };
  };

  const logout = () => {
    localStorage.removeItem('crm_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

export default API;