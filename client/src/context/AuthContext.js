import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate session on load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('crm_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await auth.getMe();
        if (response.success) {
          setUser(response.data);
        } else {
          localStorage.removeItem('crm_token');
        }
      } catch (err) {
        console.error('Session initialization failed:', err.message);
        localStorage.removeItem('crm_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Admin login handler
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await auth.login({ email, password });
      if (response.success && response.data) {
        localStorage.setItem('crm_token', response.data.token);
        setUser({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        });
        return { success: true };
      } else {
        setError(response.message || 'Login failed');
        return { success: false, message: response.message || 'Login failed' };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Admin registration handler
  const register = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await auth.register({ name, email, password });
      if (response.success && response.data) {
        localStorage.setItem('crm_token', response.data.token);
        setUser({
          _id: response.data._id,
          name: response.data.name,
          email: response.data.email,
          role: response.data.role
        });
        return { success: true };
      } else {
        setError(response.message || 'Registration failed');
        return { success: false, message: response.message || 'Registration failed' };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Email might be already in use.';
      setError(errMsg);
      return { success: false, message: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Signout handler
  const logout = () => {
    localStorage.removeItem('crm_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
