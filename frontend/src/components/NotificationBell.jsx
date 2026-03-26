import React, { useEffect, useState, useRef } from 'react';
import { notificationService } from '../services/notificationService';
import { FaBell } from 'react-icons/fa6';

export default function NotificationBell() {
    const [count, setCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const fetchCount = async () => {
        try { const c = await notificationService.getUnreadCount(); setCount(c || 0); } catch (e) { /* silent */ }
    };

    const toggleOpen = async () => {
        if (!open) {
            try { const data = await notificationService.getAll(); setNotifications(data || []); } catch (e) { console.error(e); }
        }
        setOpen(!open);
    };

    const markRead = async (id) => {
        try { await notificationService.markAsRead(id); setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); setCount(c => Math.max(0, c - 1)); } catch (e) { console.error(e); }
    };

    const markAllRead = async () => {
        try { await notificationService.markAllAsRead(); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); setCount(0); } catch (e) { console.error(e); }
    };

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            <button onClick={toggleOpen} style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative' }}>
                <FaBell size={16} />
                {count > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count > 9 ? '9+' : count}</span>}
            </button>
            {open && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', width: '320px', maxHeight: '400px', overflowY: 'auto', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 1000 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Notifications</span>
                        {count > 0 && <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: '0.75rem', cursor: 'pointer' }}>Mark all read</button>}
                    </div>
                    {notifications.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>No notifications</div>
                    ) : notifications.slice(0, 20).map(n => (
                        <div key={n.id} onClick={() => !n.isRead && markRead(n.id)} style={{ padding: '10px 16px', borderBottom: '1px solid #f8fafc', cursor: n.isRead ? 'default' : 'pointer', background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.04)' }}>
                            <div style={{ fontWeight: n.isRead ? 400 : 600, fontSize: '0.85rem', color: '#0f172a' }}>{n.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>{n.message}</div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>{new Date(n.createdAt).toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
