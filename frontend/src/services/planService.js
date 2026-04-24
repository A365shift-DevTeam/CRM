import { apiClient } from './apiClient';

export const planService = {
    getUsage: () => apiClient.get('/plan/usage'),
    updateUserPlan: (userId, data) => apiClient.put(`/admin/users/${userId}/plan`, data),
};
