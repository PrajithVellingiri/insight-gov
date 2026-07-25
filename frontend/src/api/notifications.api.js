import api from './axiosInstance';

export const getNotifications = () =>
  api.get('/notifications').then((r) => r.data);

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}`, { is_read: true }).then((r) => r.data);

export const markAllRead = () =>
  api.patch('/notifications/read-all').then((r) => r.data);
