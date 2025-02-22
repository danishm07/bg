import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const res = await axios.get('/check-auth', { withCredentials: true });
      setUser(res.data.user);
    } catch (error) {
      console.error('Auth check failed:', error.response?.data || error.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      const res = await axios.post('/login', { username, password }, { withCredentials: true });
      setUser(res.data.user);
      return { success: true, user: res.data.user };
    } catch (error) {
      console.error('Login failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await axios.post('/logout', {}, { withCredentials: true });
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error('Logout failed:', error.response?.data || error.message);
      return { success: false, error: error.response?.data?.message || 'Logout failed' };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuthStatus
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);