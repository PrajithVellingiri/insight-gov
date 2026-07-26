import api from './axiosInstance';

export const login = (credentials) =>
  api.post('/auth/login', credentials).then((r) => r.data);

export const register = (data) =>
  api.post('/auth/register', data).then((r) => r.data);

export const getProfile = () =>
  api.get('/auth/me').then((r) => r.data);
