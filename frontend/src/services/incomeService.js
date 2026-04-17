import { apiClient } from './apiClient';

export const incomeService = {
    getIncomes: async (page = 1, pageSize = 25) => {
        try {
            return await apiClient.get(`/incomes?page=${page}&pageSize=${pageSize}`);
        } catch (error) {
            console.error('Error fetching incomes:', error);
            return { items: [], totalPages: 1 };
        }
    },

    createIncome: async (incomeData) => {
        return await apiClient.post('/incomes', incomeData);
    },

    updateIncome: async (id, updates) => {
        return await apiClient.put(`/incomes/${id}`, updates);
    },

    deleteIncome: async (id) => {
        await apiClient.delete(`/incomes/${id}`);
        return id;
    }
};
