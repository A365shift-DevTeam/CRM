import { apiClient } from './apiClient';

export const adminService = {
    // Users
    getUsers: () => apiClient.get('/admin/users'),
    createUser: (data) => apiClient.post('/admin/users', data),
    updateUser: (userId, data) => apiClient.put(`/admin/users/${userId}`, data),
    updateUserRoles: (userId, roleIds) => apiClient.put(`/admin/users/${userId}/roles`, { roleIds }),
    updateUserStatus: (userId, isActive) => apiClient.put(`/admin/users/${userId}/status`, { isActive }),
    deleteUser: (userId) => apiClient.delete(`/admin/users/${userId}`),
    resetUserPassword: (userId, newPassword) => apiClient.put(`/admin/users/${userId}/reset-password`, { newPassword }),

    // Roles
    getRoles: () => apiClient.get('/admin/roles'),
    createRole: (data) => apiClient.post('/admin/roles', data),
    updateRole: (roleId, data) => apiClient.put(`/admin/roles/${roleId}`, data),
    deleteRole: (roleId) => apiClient.delete(`/admin/roles/${roleId}`),

    // Permissions
    getPermissions: () => apiClient.get('/admin/permissions'),
};
