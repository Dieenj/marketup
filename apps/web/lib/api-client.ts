import axios from 'axios';

const baseURL = (() => {
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
  const fallback = 'http://localhost:3001/api';
  if (!envUrl) return fallback;
  return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
})();

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-storage') 
        ? JSON.parse(localStorage.getItem('auth-storage')!).state?.token 
        : null;
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers['Content-Type'];
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
