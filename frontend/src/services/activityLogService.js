import { apiClient } from './apiClient';

export const activityLogService = {
    getAll: () => apiClient.get('/activity-log'),
    getRecent: (count = 20) => apiClient.get(`/activity-log/recent?count=${count}`),
    getByEntity: (entityType, entityId) => apiClient.get(`/activity-log/entity/${entityType}/${entityId}`),
};
