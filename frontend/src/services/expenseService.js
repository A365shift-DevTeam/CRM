import { apiClient } from './apiClient';

export const expenseService = {
    getExpenses: async () => {
        try {
            return await apiClient.get('/expenses');
        } catch (error) {
            console.error('Error fetching expenses:', error);
            return [];
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
