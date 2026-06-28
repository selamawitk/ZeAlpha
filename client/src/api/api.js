import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Unauthorized handling
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('authUser');

      window.location.href = '/auth';
    }

    // Preserve the original error so callers can read error.response?.data?.message
    const msg = error.response?.data?.message || 'An unexpected error occurred';
    error.message = msg;

    return Promise.reject(error);
  }
);

//
// AUTH
//

export const loginUser = async (email, password) => {
  const { data } = await api.post('/users/login', {
    email,
    password,
  });

  return data;
};

export const registerUser = async (
  firstName,
  lastName,
  email,
  password,
  role = 'couple'
) => {
  const { data } = await api.post('/users/register', {
    firstName,
    lastName,
    email,
    password,
    role,
  });

  return data;
};

export const forgotPassword = async (email) => {
  const { data } = await api.post('/users/forgot-password', {
    email,
  });

  return data;
};

export const resetPassword = async (token, password) => {
  const { data } = await api.post('/users/reset-password', {
    token,
    password,
  });

  return data;
};

//
// GIFTS & REGISTRY
//

export const updateGiftSettlement = async (
  giftId,
  deliveryOptions
) => {
  const { data } = await api.put(
    `/gifts/${giftId}/settlement`,
    { deliveryOptions }
  );

  return data;
};

//
// CONTRIBUTIONS
//

export const contributeToGift = async (
  giftId,
  amount,
  guestInfo
) => {
  const { data } = await api.post('/contributions', {
    giftId,
    amount,
    ...guestInfo,
  });

  return data;
};

export const fetchBlessings = async (weddingId) => {
  const { data } = await api.get(`/blessings/${weddingId}`);
  return data;
};

export const addBlessing = async (weddingId, message, guestName, isAnonymous) => {
  const { data } = await api.post('/blessings', { weddingId, message, guestName, isAnonymous });
  return data;
};

export const getContributions = async () => {
  const { data } = await api.get('/contributions');

  return data;
};

export const updateContributionStatus = async (
  contributionId,
  status
) => {
  const { data } = await api.put(
    `/contributions/${contributionId}`,
    { status }
  );

  return data;
};

export const fetchPendingContributions = async () => {
  const { data } = await api.get(
    '/contributions?status=pending'
  );

  return data;
};

//
// ORDERS
//

export const fetchOrders = async () => {
  const { data } = await api.get('/orders');

  return data;
};

//
// ANALYTICS & UTILS
//

export const fetchPayouts = async (weddingId) => {
  const { data } = await api.get(
    weddingId ? `/payouts/wedding/${weddingId}` : '/payouts'
  );

  return data;
};

export const fetchPlatformStats = async () => {
  const { data } = await api.get(
    '/analytics/public'
  );

  return data;
};

//
// IMAGE UPLOAD
//

export const uploadImage = async (file) => {
  const formData = new FormData();

  formData.append('image', file);

  const { data } = await api.post('/upload/image', formData, {
    timeout: 120000,
  });

  return data;
};

export default api;