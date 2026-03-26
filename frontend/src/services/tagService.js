import { apiClient } from './apiClient';

export const tagService = {
    getAll: () => apiClient.get('/tags'),
    create: (data) => apiClient.post('/tags', data),
    update: (id, data) => apiClient.put(`/tags/${id}`, data),
    delete: (id) => apiClient.delete(`/tags/${id}`),
    getEntityTags: (entityType, entityId) => apiClient.get(`/tags/entity/${entityType}/${entityId}`),
    attach: (data) => apiClient.post('/tags/attach', data),
    detach: (tagId, entityType, entityId) => apiClient.delete(`/tags/detach/${tagId}/${entityType}/${entityId}`),
};
