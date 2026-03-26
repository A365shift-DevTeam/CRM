import { apiClient } from './apiClient';

export const incomeService = {
    getIncomes: async () => {
        try {
            return await apiClient.get('/incomes');
        } catch (error) {
            console.error('Error fetching incomes:', error);
            return [];
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
