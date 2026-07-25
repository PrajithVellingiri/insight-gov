import api from './axiosInstance';

export const submitPetition = (data) =>
  api.post('/petitions', data).then((r) => r.data);

export const getPetitions = (params) =>
  api.get('/petitions', { params }).then((r) => r.data);

export const getPetitionById = (id) =>
  api.get(`/petitions/${id}`).then((r) => r.data);

export const updatePetition = (id, data) =>
  api.patch(`/petitions/${id}`, data).then((r) => r.data);

export const semanticSearch = (data) =>
  api.post('/ai/search', data).then((r) => r.data);
