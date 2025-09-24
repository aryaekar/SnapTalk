import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Users API
export const usersAPI = {
  getProfile: (userId) => api.get(`/users/profile/${userId}`),
  updateProfile: (userData) => api.put('/users/profile', userData),
  uploadAvatar: (formData) => api.post('/users/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  searchUsers: (query, page = 1) => api.get(`/users/search?q=${query}&page=${page}`),
  getSuggestions: () => api.get('/users/suggestions'),
};

// Friends API
export const friendsAPI = {
  sendRequest: (userId) => api.post(`/friends/request/${userId}`),
  acceptRequest: (userId) => api.post(`/friends/accept/${userId}`),
  declineRequest: (userId) => api.post(`/friends/decline/${userId}`),
  removeFriend: (userId) => api.delete(`/friends/${userId}`),
  getFriends: () => api.get('/friends'),
  getRequests: () => api.get('/friends/requests'),
};

// Posts API
export const postsAPI = {
  createPost: (formData) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getFeed: (page = 1) => api.get(`/posts/feed?page=${page}`),
  getUserPosts: (userId, page = 1) => api.get(`/posts/user/${userId}?page=${page}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  commentPost: (postId, content) => api.post(`/posts/${postId}/comment`, { content }),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
};

// Messages API
export const messagesAPI = {
  sendMessage: (messageData) => api.post('/messages', messageData),
  getConversations: () => api.get('/messages/conversations'),
  getMessages: (userId, page = 1) => api.get(`/messages/${userId}?page=${page}`),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
  getUnreadCount: () => api.get('/messages/unread/count'),
};

export default api;
