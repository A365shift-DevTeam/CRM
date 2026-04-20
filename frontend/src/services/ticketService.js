import { apiClient } from './apiClient';

const base = '/tickets';

export const ticketService = {
  getAll: () =>
    apiClient.get(base).then(r => r?.items ?? []),

  getById: (id) =>
    apiClient.get(`${base}/${id}`),

  create: (data) =>
    apiClient.post(base, data),

  update: (id, data) =>
    apiClient.put(`${base}/${id}`, data),

  delete: (id) =>
    apiClient.delete(`${base}/${id}`),

  getStats: () =>
    apiClient.get(`${base}/stats`),

  aiGenerate: (rawText) =>
    apiClient.post(`${base}/ai-generate`, { rawText }),

  getComments: (ticketId) =>
    apiClient.get(`${base}/${ticketId}/comments`).then(r => r ?? []),

  addComment: (ticketId, data) =>
    apiClient.post(`${base}/${ticketId}/comments`, data),
};
