import { apiClient } from './apiClient';

export const adminService = {
    // Users — now served from OrgController
    getUsers: () => apiClient.get('/org/users'),

    // 2FA management — still on AdminController
    setUserTwoFactor: (userId, required, method) => apiClient.post(`/admin/users/${userId}/2fa`, { required, method }),
    removeUserTwoFactor: (userId) => apiClient.delete(`/admin/users/${userId}/2fa`),
    resetUserTotp: (userId) => apiClient.delete(`/admin/users/${userId}/totp`),
    requireUserTotp: (userId) => apiClient.post(`/admin/users/${userId}/require-totp`, {}),

    // Permissions (read-only list)
    getPermissions: () => apiClient.get('/admin/permissions'),

    // Support Tickets
    getTickets: (page = 1, pageSize = 25) =>
        apiClient.get(`/admin/tickets?page=${page}&pageSize=${pageSize}`),
    getTicket: (id) =>
        apiClient.get(`/admin/tickets/${id}`),
    replyToTicket: (id, comment, isInternal, authorName) =>
        apiClient.post(`/admin/tickets/${id}/reply`, { comment, isInternal, authorName }),
    setTicketStatus: (id, status) =>
        apiClient.patch(`/admin/tickets/${id}/status`, { status }),
};
