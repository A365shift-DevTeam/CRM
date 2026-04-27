import { apiClient } from './apiClient';

// Org admin endpoints (within user's own org)
export const organizationService = {
    getProfile: () => apiClient.get('/org/profile'),

    getSalesSettings: () => apiClient.get('/org/sales-settings'),
    upsertSalesSettings: (settings) => apiClient.put('/org/sales-settings', settings),

    getUsers: () => apiClient.get('/org/users'),
    createUser: (data) => apiClient.post('/org/users', data),
    updateUser: (userId, data) => apiClient.patch(`/org/users/${userId}`, data),
    deactivateUser: (userId) => apiClient.delete(`/org/users/${userId}`),

    getRolePermissions: (role) => apiClient.get(`/org/role-permissions/${role}`),
    setRolePermissions: (role, permissionCodes) =>
        apiClient.put(`/org/role-permissions/${role}`, { permissionCodes }),
};

// Super admin endpoints (platform-level)
export const superAdminService = {
    getOrganizations: () => apiClient.get('/super-admin/organizations'),
    createOrganization: (data) => apiClient.post('/super-admin/organizations', data),
    updateOrgStatus: (orgId, status) =>
        apiClient.patch(`/super-admin/organizations/${orgId}/status`, { status }),

    getOrgUsers: (orgId) => apiClient.get(`/super-admin/organizations/${orgId}/users`),
    createOrgAdmin: (orgId, data) =>
        apiClient.post(`/super-admin/organizations/${orgId}/users`, data),
    removeUser: (orgId, userId) =>
        apiClient.delete(`/super-admin/organizations/${orgId}/users/${userId}`),
};
