import api from './axiosInstance';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const getImageUrl = (relativeUrl) => {
  if (!relativeUrl) return '';
  const token = localStorage.getItem('insightgov_token');
  
  // Both legacy paths ("uploads/petition_images/...") and new paths ("petition_images/...")
  // We want to extract petitionId and filename to call the authenticated endpoint:
  // /petitions/{petition_id}/images/{filename}
  const cleanUrl = relativeUrl.replace(/^uploads\//, '');
  const parts = cleanUrl.split('/');
  
  // parts should be: ['petition_images' or 'resolution_proofs', petitionId, filename]
  if (parts.length >= 3 && (parts[0] === 'petition_images' || parts[0] === 'resolution_proofs')) {
    const petitionId = parts[1];
    const filename = parts.slice(2).join('/');
    return `${API_BASE}/petitions/${petitionId}/images/${filename}?token=${token}`;
  }
  
  return `${API_BASE}${relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl}?token=${token}`;
};

export const getDepartments = async () => {
  const { data } = await api.get('/departments');
  return data;
};

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

export const withdrawPetition = (id, reason) =>
  api.patch(`/petitions/${id}/withdraw`, { reason }).then((r) => r.data);

export const uploadPetitionImages = (id, files, imageType = 'petition') => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('image_type', imageType);
  return api.post(`/petitions/${id}/images`, formData, {
  }).then((r) => r.data);
};

export const getActivePetitions = async () => {
  const { data } = await api.get('/petitions/active');
  return data;
};

export const getResolutionHistory = async (filters = {}) => {
  const { data } = await api.get('/petitions/resolution-history', { params: filters });
  return data;
};

export const semanticSearch = (data) =>
  api.post('/ai/search', data).then((r) => r.data);




