import { apiClient } from './apiClient';

export const documentService = {
    getAll: () => apiClient.get('/documents'),
    getByEntity: (entityType, entityId) => apiClient.get(`/documents/${entityType}/${entityId}`),
    create: (data) => apiClient.post('/documents', data),
    delete: (id) => apiClient.delete(`/documents/${id}`),
};
