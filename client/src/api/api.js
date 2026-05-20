import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authUser');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export const loginUser = async (email, password) => {
  const response = await api.post('/users/login', { email, password });
  return response.data;
};

export const registerUser = async (firstName, lastName, email, password, role = 'couple') => {
  const response = await api.post('/users/register', { firstName, lastName, email, password, role });
  return response.data;
};

export const contributeToGift = async (giftId, amount, guestInfo) => {
  const response = await api.post('/contributions', {
    giftId,
    amount,
    ...guestInfo
  });
  return response.data;
};

export const getContributions = async () => {
  const response = await api.get('/contributions');
  return response.data;
};

export const fetchGifts = async () => {
  const response = await api.get('/gifts');
  return response.data;
};

export const fetchPlatformStats = async () => {
  const response = await api.get('/analytics/public');
  return response.data;
};

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const updateGiftSettlement = async (giftId, deliveryOptions) => {
  const response = await api.put(`/gifts/${giftId}/settlement`, { deliveryOptions });
  return response.data;
};

export const updateContributionStatus = async (contributionId, status) => {
  const response = await api.put(`/contributions/${contributionId}`, { status });
  return response.data;
};

export const fetchPendingContributions = async () => {
  const response = await api.get('/contributions?status=pending');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await api.post('/users/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, password) => {
  const response = await api.post('/users/reset-password', { token, password });
  return response.data;
};

export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.put(`/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.put('/notifications/read-all');
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export default api;