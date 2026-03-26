import { apiClient } from './apiClient';

export const noteService = {
    getByEntity: (entityType, entityId) => apiClient.get(`/notes/${entityType}/${entityId}`),
    create: (data) => apiClient.post('/notes', data),
    update: (id, data) => apiClient.put(`/notes/${id}`, data),
    delete: (id) => apiClient.delete(`/notes/${id}`),
};
