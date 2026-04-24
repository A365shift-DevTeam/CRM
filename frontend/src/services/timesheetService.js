import { apiClient } from './apiClient';

export const timesheetService = {
    // ─── Entries ───────────────────────────────────────────────

    getEntries: async (page = 1, pageSize = 25, customer = null) => {
        const params = new URLSearchParams({ page, pageSize });
        if (customer) params.set('customer', customer);
        return await apiClient.get(`/timesheet/entries?${params.toString()}`);
    },

    createEntry: async (entryData) => {
        return await apiClient.post('/timesheet/entries', entryData);
    },

    updateEntry: async (id, updates) => {
        return await apiClient.put(`/timesheet/entries/${id}`, updates);
    },

    deleteEntry: async (id) => {
        await apiClient.delete(`/timesheet/entries/${id}`);
        return id;
    },

    // ─── Columns ───────────────────────────────────────────────

    getColumns: async () => {
        return await apiClient.get('/timesheet/columns');
    },

    addColumn: async (columnData) => {
        return await apiClient.post('/timesheet/columns', columnData);
    },

    updateColumn: async (columnId, updates) => {
        return await apiClient.put(`/timesheet/columns/${columnId}`, updates);
    },

    deleteColumn: async (columnId) => {
        await apiClient.delete(`/timesheet/columns/${columnId}`);
        return columnId;
    },

    reorderColumns: async (orderedColIds) => {
        return await apiClient.post('/timesheet/columns/reorder', { orderedColIds });
    }
};
