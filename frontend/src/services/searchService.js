import { apiClient } from './apiClient';

export const searchService = {
    search: (query, modules) => {
        const params = new URLSearchParams({ q: query });
        if (modules) params.append('modules', modules);
        return apiClient.get(`/search?${params.toString()}`);
    },
    getFilters: (module) => apiClient.get(`/search/filters${module ? `?module=${module}` : ''}`),
    saveFilter: (data) => apiClient.post('/search/filters', data),
    deleteFilter: (id) => apiClient.delete(`/search/filters/${id}`),
};
