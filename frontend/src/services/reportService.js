import { apiClient } from './apiClient';

export const reportService = {
    getRevenue: (from, to) => apiClient.get(`/reports/revenue?from=${from}&to=${to}`),
    getExpensesByCategory: (from, to) => apiClient.get(`/reports/expenses-by-category?from=${from}&to=${to}`),
    getPipelineConversion: () => apiClient.get('/reports/pipeline-conversion'),
    getContactGrowth: (from, to) => apiClient.get(`/reports/contact-growth?from=${from}&to=${to}`),
};
