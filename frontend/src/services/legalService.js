import { apiClient } from './apiClient';

const base = '/legal-agreements';

// apiClient already unwraps json.data — no extra .then() needed
export const legalService = {
  getAll:          ()          => apiClient.get(base),
  getById:         (id)        => apiClient.get(`${base}/${id}`),
  create:          (data)      => apiClient.post(base, data),
  update:          (id, data)  => apiClient.put(`${base}/${id}`, data),
  delete:          (id)        => apiClient.delete(`${base}/${id}`),
  getExpiringSoon: ()          => apiClient.get(`${base}/expiring-soon`),
};
