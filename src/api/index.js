import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Interceptor to add token to headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Auth ──────────────────────────────────────────────
export const getMe = () => api.get('/auth/me');
export const logout = () => api.post('/auth/logout');
export const updateProfile = (formData) =>
  api.put('/auth/me', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ── Feed ──────────────────────────────────────────────
export const getFeed = (page = 1, limit = 10) =>
  api.get(`/api/products/feed?page=${page}&limit=${limit}`);

// ── Products ──────────────────────────────────────────
export const getProduct = (id) => api.get(`/api/products/${id}`);
export const searchProducts = (q = '', tags = '') =>
  api.get(`/api/products/search?q=${encodeURIComponent(q)}&tags=${tags}`);

export const createProduct = (formData) =>
  api.post('/api/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateProduct = (id, formData) =>
  api.put(`/api/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// ── Likes ─────────────────────────────────────────────
export const toggleLike = (productId, reelIndex = 0) =>
  api.post(`/api/products/${productId}/reels/${reelIndex}/like`);

// ── Vendor ────────────────────────────────────────────
export const applyVendor = (data) => api.post('/api/vendor/apply', data);
export const getApplicationStatus = () => api.get('/api/vendor/application-status');
export const getVendorProducts = () => api.get('/api/vendor/products');
export const uploadSingleReel = (formData) =>
  api.post('/api/vendor/reel', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

// ── Enquiries ─────────────────────────────────────────
export const submitEnquiry = (data) => api.post('/api/enquiries', data);

// ── Chat ──────────────────────────────────────────────
export const sendMessage = (data) => api.post('/api/chat', data);
export const getChatMessages = (otherUserId) => api.get(`/api/chat/messages/${otherUserId}`);
export const getConversations = () => api.get('/api/chat/conversations');
export const getAdminUser = () => api.get('/api/chat/admin-user');

// ── Admin ─────────────────────────────────────────────
export const getAdminStats = () => api.get('/api/admin/stats');
export const getApplications = (status = '') =>
  api.get(`/api/admin/applications${status ? `?status=${status}` : ''}`);
export const reviewApplication = (id, status) =>
  api.put(`/api/admin/applications/${id}`, { status });
export const getEnquiries = () => api.get('/api/admin/enquiries');
export const updateEnquiry = (id, status) =>
  api.put(`/api/admin/enquiries/${id}`, { status });
export const adminDeleteProduct = (id) => api.delete(`/api/admin/products/${id}`);

export default api;
