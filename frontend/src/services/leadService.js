import { apiClient } from './apiClient';

export const leadService = {
    getLeads: async (page = 1, pageSize = 25) => {
        return await apiClient.get(`/leads?page=${page}&pageSize=${pageSize}`);
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
