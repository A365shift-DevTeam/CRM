import { apiClient } from './apiClient';

export const organizationService = {
    create: async (data) => apiClient.post('/organizations', data),

    getMine: async () => apiClient.get('/organizations/mine'),

    join: async (slug) => apiClient.post('/organizations/join', { slug }),

    getSalesSettings: async (orgId) =>
        apiClient.get(`/organizations/${orgId}/sales-settings`),

    upsertSalesSettings: async (orgId, settings) =>
        apiClient.put(`/organizations/${orgId}/sales-settings`, settings),
};
