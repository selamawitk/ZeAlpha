import React, { createContext, useContext, useState } from 'react';
import { loginUser, registerUser, forgotPassword, resetPassword } from '../api/api.js';

const normalizeRole = (_email, backendRole) => backendRole || 'guest';

// Ensure managedWedding and other critical fields are explicitly included
const buildSessionUser = (data) => ({
  ...data,
  role: normalizeRole(data.email, data.role),
  managedWedding: data.managedWedding || null, 
});

const getInitialUser = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;
  try {
    const parsed = JSON.parse(storedUser);
    return (parsed && parsed.email) ? buildSessionUser(parsed) : null;
  } catch {
    localStorage.clear();
    return null;
  }
};

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(getInitialUser);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUser(email, password);
      const sessionUser = buildSessionUser(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return sessionUser;
    } finally {
      setLoading(false);
    }
  };

  const register = async (firstName, lastName, email, password, role = 'couple') => {
    setLoading(true);
    try {
      const data = await registerUser(firstName, lastName, email, password, role);
      const sessionUser = buildSessionUser(data);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      return sessionUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    window.location.href = '/auth';
  };

  const updateUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const value = {
    user,
    login,
    register,
    logout,
    logoutAndDelete: logout,
    forgotPass: forgotPassword,
    resetPass: resetPassword,
    updateUser,
    loading,
    isLoading: loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};