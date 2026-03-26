import { apiClient } from './apiClient';

export const notificationService = {
    getAll: () => apiClient.get('/notifications'),
    getUnreadCount: () => apiClient.get('/notifications/unread-count'),
    markAsRead: (id) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/notifications/read-all'),
    delete: (id) => apiClient.delete(`/notifications/${id}`),
};
