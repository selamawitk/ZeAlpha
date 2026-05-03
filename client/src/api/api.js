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
      localStorage.removeItem('authUser');
      window.location.href = '/login';
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
  const response = await api.post('/payments/contribute', { 
    giftId, 
    amount, 
    ...guestInfo 
  });
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

export default api;