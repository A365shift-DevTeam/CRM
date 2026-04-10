import { apiClient } from './apiClient';

export const leadService = {
    getLeads: async () => {
        return await apiClient.get('/leads');
    },
    createLead: async (data) => {
        return await apiClient.post('/leads', data);
    },
    updateLead: async (id, updates) => {
        return await apiClient.put(`/leads/${id}`, updates);
    },
    deleteLead: async (id) => {
        await apiClient.delete(`/leads/${id}`);
        return id;
    },
};
