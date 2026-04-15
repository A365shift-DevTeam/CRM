import { apiClient } from './apiClient';

const base = '/invoices';

export const invoiceService = {
  getAll: () =>
    apiClient.get(base).then(r => r.data?.data ?? []),

  getById: (id) =>
    apiClient.get(`${base}/${id}`).then(r => r.data?.data),

  create: (data) =>
    apiClient.post(base, data).then(r => r.data?.data),

  updateStatus: (id, data) =>
    apiClient.put(`${base}/${id}`, data).then(r => r.data?.data),

  delete: (id) =>
    apiClient.delete(`${base}/${id}`).then(r => r.data),

  getByProject: (projectFinanceId) =>
    apiClient.get(`${base}/by-project/${projectFinanceId}`).then(r => r.data?.data ?? []),
};
