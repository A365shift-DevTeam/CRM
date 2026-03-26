import React, { useEffect, useState, useMemo } from 'react';
import { activityLogService } from '../../services/activityLogService';
import { FaClockRotateLeft, FaMagnifyingGlass } from 'react-icons/fa6';

const actionColors = { Created: '#10b981', Updated: '#3b82f6', Deleted: '#ef4444' };

export default function ActivityLog() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        (async () => {
            try { const data = await activityLogService.getAll(); setLogs(data || []); } catch (e) { console.error(e); }
            setLoading(false);
        })();
    }, []);

    const filtered = useMemo(() => {
        let result = logs;
        if (filterType !== 'All') result = result.filter(l => l.entityType === filterType);
        if (searchQuery) result = result.filter(l => (l.details || '').toLowerCase().includes(searchQuery.toLowerCase()) || l.action.toLowerCase().includes(searchQuery.toLowerCase()));
        return result;
    }, [logs, filterType, searchQuery]);

    const entityTypes = ['All', 'Contact', 'Project', 'Task', 'Expense', 'Income', 'Timesheet', 'ProjectFinance'];

    return (
        <div style={{ padding: '20px' }}>
            <div className="d-flex align-items-center gap-2 mb-3">
                <FaClockRotateLeft size={20} style={{ color: '#3b82f6' }} />
                <h4 className="m-0 fw-bold" style={{ color: '#0f172a' }}>Activity Log</h4>
            </div>
            <div className="d-flex gap-2 mb-3 flex-wrap">
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <FaMagnifyingGlass style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input className="glass-input" placeholder="Search activity..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: '36px', width: '100%' }} />
                </div>
                <select className="glass-input" style={{ width: 'auto' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
                    {entityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>
            {loading ? <div className="text-center p-4"><div className="spinner-border text-primary" /></div> : (
                <div style={{ overflowX: 'auto' }}>
                    <table className="table" style={{ fontSize: '0.875rem' }}>
                        <thead><tr style={{ color: '#64748b', borderBottom: '2px solid #e2e8f0' }}>
                            <th>Time</th><th>Action</th><th>Entity</th><th>ID</th><th>Details</th>
                        </tr></thead>
                        <tbody>
                            {filtered.length === 0 ? <tr><td colSpan={5} className="text-center text-muted py-4">No activity logs found.</td></tr> :
                                filtered.map(log => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ whiteSpace: 'nowrap', color: '#64748b' }}>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td><span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, background: (actionColors[log.action] || '#94a3b8') + '18', color: actionColors[log.action] || '#94a3b8' }}>{log.action}</span></td>
                                        <td style={{ fontWeight: 500 }}>{log.entityType}</td>
                                        <td style={{ color: '#64748b' }}>#{log.entityId}</td>
                                        <td style={{ color: '#475569', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{log.details || '—'}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
