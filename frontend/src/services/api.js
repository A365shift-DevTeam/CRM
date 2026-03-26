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
    }
};
