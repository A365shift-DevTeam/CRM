import { apiClient } from './apiClient';

export const projectFinanceService = {
    getAll: async () => {
        return await apiClient.get('/projectfinances');
    },

    getById: async (id) => {
        return await apiClient.get(`/projectfinances/${id}`);
    },

    create: async (data) => {
        return await apiClient.post('/projectfinances', data);
    },

    update: async (id, data) => {
        return await apiClient.put(`/projectfinances/${id}`, data);
    },

    delete: async (id) => {
        await apiClient.delete(`/projectfinances/${id}`);
        return id;
    }
};
