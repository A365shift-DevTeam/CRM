import { apiClient } from './apiClient';

export const companyService = {
    getCompanies: async (page = 1, pageSize = 25) => {
        return await apiClient.get(`/companies?page=${page}&pageSize=${pageSize}`);
    },
    createCompany: async (data) => {
        return await apiClient.post('/companies', data);
    },
    updateCompany: async (id, updates) => {
        return await apiClient.put(`/companies/${id}`, updates);
    },
    deleteCompany: async (id) => {
        await apiClient.delete(`/companies/${id}`);
        return id;
    },
};
