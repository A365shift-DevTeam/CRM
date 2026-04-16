import { apiClient } from './apiClient';

export const auditService = {
  getAuditLogs: (entityName, entityId, page = 1, pageSize = 50) =>
    apiClient.get(`/audit-logs?entityName=${encodeURIComponent(entityName)}&entityId=${entityId}&page=${page}&pageSize=${pageSize}`),
};
