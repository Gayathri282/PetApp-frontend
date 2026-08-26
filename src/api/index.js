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
export const updateProfile = (data) => api.put('/auth/me', data);

// ── Feed ──────────────────────────────────────────────
export const getFeed = (page = 1, limit = 10) =>
  api.get(`/api/products/feed?page=${page}&limit=${limit}`);

export const getLatestTimestamp = () =>
  api.get('/api/products/latest-ts');

export const trackInterest = (productId, action) =>
  api.post(`/api/products/${productId}/track`, { action });

// ── Products ──────────────────────────────────────────
export const getProduct = (id) => api.get(`/api/products/${id}`);
export const searchProducts = (q = '', tags = '') =>
  api.get(`/api/products/search?q=${encodeURIComponent(q)}&tags=${tags}`);

export const createProduct = (data) => api.post('/api/products', data);

export const updateProduct = (id, data) => api.put(`/api/products/${id}`, data);

export const deleteProduct = (id) => api.delete(`/api/products/${id}`);

// ── Likes ─────────────────────────────────────────────
export const toggleLike = (productId, reelIndex = 0) =>
  api.post(`/api/products/${productId}/reels/${reelIndex}/like`);

// ── Vendor ────────────────────────────────────────────
export const applyVendor = (data) => api.post('/api/vendor/apply', data);
export const getApplicationStatus = () => api.get('/api/vendor/application-status');
export const getVendorProducts = () => api.get('/api/vendor/products');
export const uploadSingleReel = (data) => api.post('/api/vendor/reel', data);

// ── Enquiries ─────────────────────────────────────────
export const submitEnquiry = (data) => api.post('/api/enquiries', data);

// ── Chat ──────────────────────────────────────────────
export const sendMessage = (data) => api.post('/api/chat', data);
export const getChatMessages = (otherUserId) => api.get(`/api/chat/messages/${otherUserId}`);
export const getConversations = () => api.get('/api/chat/conversations');
export const getAdminUser = () => api.get('/api/chat/admin-user');

// ── Notifications ─────────────────────────────────────
export const getNotifications = () => api.get('/api/notifications');
export const markNotificationsRead = () => api.put('/api/notifications/read');

// ── Admin ─────────────────────────────────────────────
export const getAdminStats = () => api.get('/api/admin/stats');
export const getApplications = (status = '') =>
  api.get(`/api/admin/applications${status ? `?status=${status}` : ''}`);
export const reviewApplication = (id, status) =>
  api.put(`/api/admin/applications/${id}`, { status });
export const getEnquiries = () => api.get('/api/admin/enquiries');
export const updateEnquiry = (id, status) =>
  api.put(`/api/admin/enquiries/${id}`, { status });
export const adminDeleteProduct = (id, reason = '') => api.delete(`/api/admin/products/${id}`, { data: { reason } });

export const getAllAdminProducts = (status = '', q = '') =>
  api.get(`/api/admin/products?status=${status}&q=${encodeURIComponent(q)}`);

export const adminGetReels = (status = '', q = '') =>
  api.get(`/api/admin/reels?status=${status}&q=${encodeURIComponent(q)}`);
export const adminReviewReel = (id, status, reason = '') =>
  api.put(`/api/admin/reels/${id}/status`, { status, reason });
export const adminDeleteReel = (id, reason = '') =>
  api.delete(`/api/admin/reels/${id}`, { data: { reason } });

export const deleteMyAccount = () => api.delete('/auth/me');

export const getPendingProducts = () => api.get('/api/admin/products/pending');
export const reviewProduct = (id, status, reason = '') => 
  api.put(`/api/admin/products/${id}/review`, { status, reason });
export const adminGetUsers = (status = '', q = '') =>
  api.get(`/api/admin/users?status=${status}&q=${encodeURIComponent(q)}`);
export const adminSuspendUser = (id, suspend = true, reason = '') =>
  api.put(`/api/admin/users/${id}/suspend`, { suspend, reason });
export const adminDeleteUser = (id, reason = '') => api.delete(`/api/admin/users/${id}`, { data: { reason } });

// ── Media / Cloudinary ────────────────────────────────
export const getCloudinarySignature = () => api.get('/api/media/cloudinary-signature');

export const uploadToCloudinary = async (file, onProgress) => {
  const { data } = await getCloudinarySignature();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('timestamp', data.timestamp);
  formData.append('signature', data.signature);
  formData.append('api_key', data.apiKey);
  formData.append('folder', data.folder);

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/${data.cloudName}/${file.type.startsWith('video/') ? 'video' : 'image'}/upload`,
    formData,
    {
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    }
  );

  return res.data.secure_url;
};

export default api;
