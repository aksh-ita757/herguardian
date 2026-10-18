// ============================================
// HerGuardian v2 — API Services
// All backend calls centralised here
// ============================================
import axios from 'axios';
import { API_ORIGIN } from '../config';

const API = axios.create({ baseURL: `${API_ORIGIN}/api`, timeout: 90000 });

// Auto-inject JWT token on every request
API.interceptors.request.use(config => {
  const token = localStorage.getItem('herguardian_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token has expired or is invalid, clear it and send the user to sign in
// (otherwise every call silently fails with 401 until they clear browser storage).
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem('herguardian_token')) {
      localStorage.removeItem('herguardian_token');
      if (window.location.pathname !== '/auth') window.location.assign('/auth');
    }
    return Promise.reject(error);
  }
);

export const sosAPI = {
  send:       (data) => API.post('/sos/send', data),
  getHistory: ()     => API.get('/sos/history'),
};

export const healthAPI = {
  logPeriod:      (data) => API.post('/health/cycle', data),
  getCycleData:   ()     => API.get('/health/cycle'),
  logMood:        (data) => API.post('/health/mood', data),
  getMoodHistory: ()     => API.get('/health/mood'),
};

export const legalAPI = {
  getArticles:  (cat) => API.get('/legal', { params: { category: cat } }),
  getHelplines: ()    => API.get('/legal/helplines'),
};

export const forumAPI = {
  getPosts:   (params)    => API.get('/forum', { params }),
  createPost: (data)      => API.post('/forum', data),
  likePost:   (id)        => API.post(`/forum/${id}/like`),
  addReply:   (id, data)  => API.post(`/forum/${id}/reply`, data),
};

export const mapAPI = {
  getZones:   (lat, lng) => API.get('/map/zones', { params: { lat, lng } }),
  reportZone: (data)     => API.post('/map/report', data),
};

export const aiAPI = {
  chat:           (data) => API.post('/ai/chat', data),
  healthInsights: ()     => API.post('/ai/health-insights'),
};
