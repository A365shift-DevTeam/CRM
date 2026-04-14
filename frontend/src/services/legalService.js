import apiClient from './apiClient';

const base = '/legal-agreements';

export const legalService = {
  getAll: () =>
    apiClient.get(base).then(r => r.data?.data ?? []),

  getById: (id) =>
    apiClient.get(`${base}/${id}`).then(r => r.data?.data),

  create: (data) =>
    apiClient.post(base, data).then(r => r.data?.data),

  update: (id, data) =>
    apiClient.put(`${base}/${id}`, data).then(r => r.data?.data),

  delete: (id) =>
    apiClient.delete(`${base}/${id}`).then(r => r.data),

  getExpiringSoon: () =>
    apiClient.get(`${base}/expiring-soon`).then(r => r.data?.data ?? []),
};
