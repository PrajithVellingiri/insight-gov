import api from './axiosInstance';

export const submitPetition = (data) =>
  api.post('/petitions', data).then((r) => r.data);

export const getPetitions = async (filters) => {
  const { data } = await api.get('/petitions', { params: filters });
  return data;
};

export const getMyPetitions = async (filters) => {
  const { data } = await api.get('/petitions/my', { params: filters });
  return data;
};

export const getPetitionById = (id) =>
  api.get(`/petitions/${id}`).then((r) => r.data);

export const updatePetition = (id, data) =>
  api.patch(`/petitions/${id}/status`, data).then((r) => r.data);

export const semanticSearch = (data) =>
  api.post('/ai/search', data).then((r) => r.data);
