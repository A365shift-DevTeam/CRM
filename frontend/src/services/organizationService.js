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

    getRoles: () => apiClient.get('/org/roles'),
    createRole: (name, permissionCodes) => apiClient.post('/org/roles', { name, permissionCodes }),
    deleteRole: (roleName) => apiClient.delete(`/org/roles/${encodeURIComponent(roleName)}`),
};

// Super admin endpoints (platform-level)
export const superAdminService = {
    getOrganizations: () => apiClient.get('/super-admin/organizations'),
    createOrganization: (data) => apiClient.post('/super-admin/organizations', data),
    updateOrgStatus: (orgId, status) =>
        apiClient.patch(`/super-admin/organizations/${orgId}/status`, { status }),

    setUserLimit: (orgId, userLimit) =>
        apiClient.patch(`/super-admin/organizations/${orgId}/user-limit`, { userLimit }),

    getOrgUsers: (orgId) => apiClient.get(`/super-admin/organizations/${orgId}/users`),
    createOrgAdmin: (orgId, data) =>
        apiClient.post(`/super-admin/organizations/${orgId}/users`, data),
    updateOrgUser: (orgId, userId, data) =>
        apiClient.patch(`/super-admin/organizations/${orgId}/users/${userId}`, data),
    toggleUserActive: (orgId, userId, isActive) =>
        apiClient.patch(`/super-admin/organizations/${orgId}/users/${userId}/status`, { isActive }),
    deleteOrgUser: (orgId, userId) =>
        apiClient.delete(`/super-admin/organizations/${orgId}/users/${userId}`),

    getAuditLogs: (params) => {
        const q = new URLSearchParams();
        if (params.orgId)      q.set('orgId', params.orgId);
        if (params.userId)     q.set('userId', params.userId);
        if (params.entityName) q.set('entityName', params.entityName);
        if (params.startDate)  q.set('startDate', params.startDate);
        if (params.endDate)    q.set('endDate', params.endDate);
        q.set('page', params.page || 1);
        q.set('pageSize', params.pageSize || 50);
        return apiClient.get(`/super-admin/audit-logs?${q.toString()}`);
    },

    getSupportTickets: (page = 1, pageSize = 50) =>
        apiClient.get(`/super-admin/support-tickets?page=${page}&pageSize=${pageSize}`),
    updateSupportTicket: (ticketId, status) =>
        apiClient.patch(`/super-admin/support-tickets/${ticketId}`, { status }),
    replySupportTicket: (ticketId, message, authorName) =>
        apiClient.post(`/super-admin/support-tickets/${ticketId}/reply`, { comment: message, authorName, isInternal: false }),
};
