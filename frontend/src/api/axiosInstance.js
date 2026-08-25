import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 160000,
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('insightgov_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('insightgov_token');
      localStorage.removeItem('insightgov_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
