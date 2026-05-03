import React, { createContext, useContext, useState, useLayoutEffect } from 'react';
import api, { loginUser, registerUser } from '../api/api.js';

const AuthContext = createContext();

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
    const storedUser = localStorage.getItem('authUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('authUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('authUser', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (firstName, lastName, email, password, role = 'couple') => {
    const data = await registerUser(firstName, lastName, email, password, role);
    localStorage.setItem('token', data.token);
    localStorage.setItem('authUser', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = async () => {
    try {
      await api.delete('/users/me');
    } catch (err) {
      console.error('Logout delete failed:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('authUser');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const logoutAndDelete = logout;

  const value = {
    user,
    login,
    register,
    logout,
    logoutAndDelete,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};