import api from './axiosInstance';

// Departments
export const getDepartments = () =>
  api.get('/admin/departments').then((r) => r.data);

export const createDepartment = (data) =>
  api.post('/admin/departments', data).then((r) => r.data);

export const updateDepartment = (id, data) =>
  api.patch(`/admin/departments/${id}`, data).then((r) => r.data);

export const deleteDepartment = (id) =>
  api.delete(`/admin/departments/${id}`).then((r) => r.data);

// Officers
export const getOfficers = (departmentId = null) => {
  // Prevent React Query context object from being passed as a valid ID
  if (typeof departmentId === 'object' && departmentId !== null) {
    departmentId = null;
  }
  const query = departmentId ? `?department_id=${departmentId}` : '';
  return api.get(`/admin/officers${query}`).then((r) => r.data);
};

export const createOfficer = (data) =>
  api.post('/admin/officers', data).then((r) => r.data);

export const updateOfficer = (id, data) =>
  api.patch(`/admin/officers/${id}`, data).then((r) => r.data);

export const deleteOfficer = (id) =>
  api.delete(`/admin/officers/${id}`).then((r) => r.data);

export const getOfficerAnalytics = (id) =>
  api.get(`/admin/officers/${id}/analytics`).then((r) => r.data);
