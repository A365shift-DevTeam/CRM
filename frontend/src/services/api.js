import { apiClient } from './apiClient';

export const projectService = {
    getAll: async () => {
        return await apiClient.get('/projects');
    },

    create: async (projectData) => {
        return await apiClient.post('/projects', projectData);
    },

    update: async (id, updates) => {
        return await apiClient.put(`/projects/${id}`, updates);
    },

    delete: async (id) => {
        await apiClient.delete(`/projects/${id}`);
        return id;
    },

    getById: async (id) => {
        return await apiClient.get(`/projects/${id}`);
    }
};

export const taskService = {
    getAll: async () => {
        return await apiClient.get('/tasks');
    },

    create: async (taskData) => {
        return await apiClient.post('/tasks', taskData);
    },

    update: async (id, updates) => {
        return await apiClient.put(`/tasks/${id}`, updates);
    },

    delete: async (id) => {
        await apiClient.delete(`/tasks/${id}`);
        return id;
    },

    // Column Management
    getColumns: async () => {
        return await apiClient.get('/tasks/columns');
    },
    addColumn: async (columnData) => {
        return await apiClient.post('/tasks/columns/add', columnData);
    },
    updateColumn: async (colId, updates) => {
        return await apiClient.put(`/tasks/columns/${colId}`, updates);
    },
    deleteColumn: async (colId) => {
        await apiClient.delete(`/tasks/columns/${colId}`);
        return colId;
    },
    reorderColumns: async (orderedColIds) => {
        return await apiClient.post('/tasks/columns/reorder', { orderedColIds });
    },
};

export const documentService = {
    getAll: async () => {
        return await apiClient.get('/documents');
    },
    getById: async (id) => {
        return await apiClient.get(`/documents/${id}`);
    },
    create: async (docData) => {
        return await apiClient.post('/documents', docData);
    },
    delete: async (id) => {
        await apiClient.delete(`/documents/${id}`);
        return id;
    }
};
