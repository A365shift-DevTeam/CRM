import apiClient from './apiClient';

const base = '/tickets';

export const ticketService = {
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

  getStats: () =>
    apiClient.get(`${base}/stats`).then(r => r.data?.data),

  aiGenerate: (rawText) =>
    apiClient.post(`${base}/ai-generate`, { rawText }).then(r => r.data?.data),

  getComments: (ticketId) =>
    apiClient.get(`${base}/${ticketId}/comments`).then(r => r.data?.data ?? []),

  addComment: (ticketId, data) =>
    apiClient.post(`${base}/${ticketId}/comments`, data).then(r => r.data?.data),
};
