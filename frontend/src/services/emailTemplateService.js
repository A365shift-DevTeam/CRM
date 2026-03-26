import { apiClient } from './apiClient';

export const emailTemplateService = {
    getAll: () => apiClient.get('/email-templates'),
    getById: (id) => apiClient.get(`/email-templates/${id}`),
    create: (data) => apiClient.post('/email-templates', data),
    update: (id, data) => apiClient.put(`/email-templates/${id}`, data),
    delete: (id) => apiClient.delete(`/email-templates/${id}`),
};
