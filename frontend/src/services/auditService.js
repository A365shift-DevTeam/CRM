import { apiClient } from './apiClient';

export const auditService = {
  getAuditLogs: (entityName, entityId, page = 1, pageSize = 50) =>
    apiClient.get('/audit-logs', { params: { entityName, entityId, page, pageSize } })
      .then(r => r.data?.data ?? { items: [], total: 0 }),
};
