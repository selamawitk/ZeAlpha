import React, { createContext, useContext, useState, useLayoutEffect } from 'react';
import api, { loginUser, registerUser, forgotPassword, resetPassword } from '../api/api.js';

const AuthContext = createContext();

const normalizeRole = (email, backendRole) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (normalizedEmail === 'kim742355@gmail.com') return 'admin';
  if (normalizedEmail === 'selamawitkinetibeb@gmail.com') return 'couple';
  return backendRole || 'guest';
};

const buildSessionUser = (data) => ({
  ...data,
  role: normalizeRole(data.email, data.role),
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useLayoutEffect(() => {
    const storedUser = localStorage.getItem('user') || localStorage.getItem('authUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.email && parsed.role) {
          setUser(buildSessionUser(parsed));
        } else {
          // Invalid or missing role, clear storage
          localStorage.removeItem('user');
          localStorage.removeItem('authUser');
          localStorage.removeItem('token');
          window.location.href = '/auth';
          return;
        }
      } catch (e) {
        localStorage.removeItem('user');
        localStorage.removeItem('authUser');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    const sessionUser = buildSessionUser(data);
    // Clear stale storage before setting new
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  };

  const register = async (firstName, lastName, email, password, role = 'couple') => {
    const data = await registerUser(firstName, lastName, email, password, role);
    const sessionUser = buildSessionUser(data);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(sessionUser));
    localStorage.removeItem('authUser');
    setUser(sessionUser);
    return sessionUser;
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
    setUser(null);
    window.location.href = '/auth';
  };

  const logoutAndDelete = logout;

  const forgotPass = async (email) => {
    return await forgotPassword(email);
  };

  const resetPass = async (token, password) => {
    return await resetPassword(token, password);
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
    logoutAndDelete,
    forgotPass,
    resetPass,
    updateUser,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};