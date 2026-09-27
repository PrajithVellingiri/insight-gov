import api from './axiosInstance';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export const getImageUrl = (relativeUrl) => {
  if (!relativeUrl) return '';
  if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
    return relativeUrl;
  }
  const token = localStorage.getItem('insightgov_token');
  const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
  
  // Clean leading uploads/ or slashes
  const cleanUrl = relativeUrl.replace(/^uploads\//, '').replace(/^\/+/, '');
  const parts = cleanUrl.split('/');
  
  // Format 1: New standard: <petition_id>/petition/<unique_uuid>.<ext> or <petition_id>/resolution/...
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (parts.length >= 2 && uuidRegex.test(parts[0])) {
    const petitionId = parts[0];
    const filename = parts.slice(1).join('/');
    return `${API_BASE}/petitions/${petitionId}/images/${filename}${tokenParam}`;
  }

  // Format 2: Legacy format: petition_images/<petition_id>/<unique_uuid>.<ext>
  if (parts.length >= 3 && (parts[0] === 'petition_images' || parts[0] === 'resolution_proofs')) {
    const petitionId = parts[1];
    const filename = parts.slice(2).join('/');
    return `${API_BASE}/petitions/${petitionId}/images/${filename}${tokenParam}`;
  }
  
  return `${API_BASE}/${cleanUrl}${tokenParam}`;
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




