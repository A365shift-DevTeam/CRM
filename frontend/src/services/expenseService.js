import { apiClient } from './apiClient';

export const expenseService = {
    getExpenses: async (page = 1, pageSize = 25) => {
        try {
            return await apiClient.get(`/expenses?page=${page}&pageSize=${pageSize}`);
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return { items: [], totalPages: 1 };
        }
    },

    createExpense: async (expenseData) => {
        return await apiClient.post('/expenses', expenseData);
    },

    updateExpense: async (id, updates) => {
        return await apiClient.put(`/expenses/${id}`, updates);
    },

    deleteExpense: async (id) => {
        await apiClient.delete(`/expenses/${id}`);
        return id;
    }
};
