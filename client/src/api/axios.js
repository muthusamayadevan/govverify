import axios from 'axios';

const api = axios.create({
  // Replit: use a relative path so Vite's proxy forwards /api to the Express
  // server server-side (browser cannot reach localhost:3001 directly).
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
