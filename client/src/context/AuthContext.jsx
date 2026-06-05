/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(sessionStorage.getItem('accessToken')));
  const [error, setError] = useState(null);

  // Try to restore session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      // Verify token is still valid via refresh
      api.post('/auth/refresh')
        .then(({ data }) => {
          setUser(data.user);
          sessionStorage.setItem('accessToken', data.accessToken);
        })
        .catch(() => {
          sessionStorage.removeItem('accessToken');
          setUser(null);
        })
        .finally(() => setLoading(false));
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      setUser(data.user);
      sessionStorage.setItem('accessToken', data.accessToken);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed';
      setError(message);
      throw new Error(message, { cause: err });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setUser(data.user);
      sessionStorage.setItem('accessToken', data.accessToken);
      return data;
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
      throw new Error(message, { cause: err });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      setUser(null);
      sessionStorage.removeItem('accessToken');
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, clearError, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
