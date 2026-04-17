import { apiClient } from './apiClient';

export const projectService = {
    getProjects: async (page = 1, pageSize = 25) => {
        return await apiClient.get(`/projects?page=${page}&pageSize=${pageSize}`);
    },
    getProjectById: async (id) => {
        return await apiClient.get(`/projects/${id}`);
    },
    createProject: async (data) => {
        return await apiClient.post('/projects', data);
    },
    updateProject: async (id, data) => {
        return await apiClient.put(`/projects/${id}`, data);
    },
    deleteProject: async (id) => {
        await apiClient.delete(`/projects/${id}`);
        return id;
    },
};
