import api from './axiosInstance';

export const getAnalytics = () =>
  api.get('/analytics').then((r) => r.data);
