import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, RefreshCw, Trash2, ChevronDown } from 'lucide-react';
import { auditService } from '../../services/auditService';
import './AuditPanel.css';

const ACTION_ICONS = {
  Created: <CheckCircle size={13} />,
  Updated: <RefreshCw size={13} />,
  Deleted: <Trash2 size={13} />,
};

function relativeTime(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function absoluteTime(dateStr) {
  return new Date(dateStr).toLocaleString();
}

// Fallback: format raw field name when description is absent (old rows)
function formatFieldName(name) {
  if (!name || name === '_record') return '';
  return name.replace(/([a-z])([A-Z])/g, '$1 $2')
             .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2');
}

function buildFallbackDescription(log) {
  if (log.fieldName === '_record') {
    return `${log.entityName} was ${log.action.toLowerCase()}`;
  }
  const label = formatFieldName(log.fieldName) || log.fieldName;
  if (log.oldValue && log.newValue) return `${label} was changed`;
  if (log.newValue) return `${label} was set`;
  if (log.oldValue) return `${label} was cleared`;
  return `${label} was updated`;
}

export default function AuditPanel({ entityName, entityId }) {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (p = 1) => {
    if (!entityId) return;
    setLoading(true);
    try {
      const result = await auditService.getAuditLogs(entityName, entityId, p);
      setLogs(prev => p === 1 ? result.items : [...prev, ...result.items]);
      setTotal(result.total);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [entityName, entityId]);

  useEffect(() => { load(1); }, [load]);

  if (!entityId) return <div className="audit-empty">Save the record first to see history.</div>;

  return (
    <div className="audit-panel">
      {loading && logs.length === 0 ? (
        <div className="audit-empty">Loading history…</div>
      ) : logs.length === 0 ? (
        <div className="audit-empty">No changes recorded yet.</div>
      ) : (
        <div className="audit-timeline">
          {logs.map(log => {
            const description = log.description || buildFallbackDescription(log);
            const isRecord = log.fieldName === '_record';

            return (
              <div key={log.id} className="audit-entry">
                <div className={`audit-icon-wrap ${log.action.toLowerCase()}`}>
                  {ACTION_ICONS[log.action] ?? <RefreshCw size={13} />}
                </div>
                <div className="audit-body">
                  <div className="audit-meta">
                    <span className={`audit-action-badge ${log.action.toLowerCase()}`}>{log.action}</span>
                    <span className="audit-by">by {log.changedByName}</span>
                  </div>

                  {/* Description — human-readable summary only, no raw values */}
                  <div className="audit-description">{description}</div>

                  <div className="audit-timestamp" title={absoluteTime(log.changedAt)}>
                    {relativeTime(log.changedAt)}
                  </div>
                </div>
              </div>
            );
          })}
          {logs.length < total && (
            <button className="audit-load-more" onClick={() => load(page + 1)} disabled={loading}>
              <ChevronDown size={13} style={{ marginRight: 4 }} />
              {loading ? 'Loading…' : `Load more (${total - logs.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
