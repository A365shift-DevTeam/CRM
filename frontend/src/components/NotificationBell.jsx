import React, { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
import { FaBell } from 'react-icons/fa6';
import { Modal } from 'react-bootstrap';
import { Wallet, Rocket, Server } from 'lucide-react';
import './NotificationBell.css';

const mockPremiumNotifications = [
    {
        id: 'mock1',
        dept: 'Finance',
        title: 'Quarterly Revenue Audit Required',
        message: 'The Q3 revenue reports for Acme North America show a discrepancy of $12,400. Internal audit verification is required by EOD.',
        isRead: false,
        score: '88%',
        scoreLabel: 'Risk Score',
        scoreColor: '#4B5563',
        badges: ['Priority', 'Finance-Team', 'Pending'],
        accentColor: '#F97316',
        bgLight: '#FFF7ED',
        icon: <Wallet size={24} color="#F97316" strokeWidth={2} />
    },
    {
        id: 'mock2',
        dept: 'Lead',
        title: 'Enterprise Lead: Globex Corp',
        message: 'A new inbound request from Globex Corp (Fortune 500) just arrived. They are interested in a 250+ seat annual contract.',
        isRead: false,
        score: '94%',
        scoreLabel: 'Deal Probability',
        scoreColor: '#10B981',
        badges: ['Hot-Lead', 'Sales-Ops', 'Active'],
        accentColor: '#10B981',
        bgLight: '#ECFDF5',
        icon: <Rocket size={24} color="#10B981" strokeWidth={2} />
    },
    {
        id: 'mock3',
        dept: 'Ops',
        title: 'Data Pipeline Latency Warning',
        message: 'Infrastructure node region us-east-1 is reporting a 240ms increase in latency for the core notification delivery engine.',
        isRead: false,
        score: '62%',
        scoreLabel: 'Health Score',
        scoreColor: '#3B82F6',
        badges: ['Urgent', 'DevOps', 'Monitoring'],
        accentColor: '#3B82F6',
        bgLight: '#EFF6FF',
        icon: <Server size={24} color="#3B82F6" strokeWidth={2} />
    }
];

export default function NotificationBell() {
    const [count, setCount] = useState(0);
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState('All');
    
    // Using rich mock data to match the premium design perfectly.
    // In production, map standard notifications to this structure.
    const [notifications, setNotifications] = useState(mockPremiumNotifications);

    useEffect(() => {
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchCount = async () => {
        try { 
            const c = await notificationService.getUnreadCount(); 
            // Add our 3 mocks to count
            setCount((c || 0) + notifications.filter(n => !n.isRead).length); 
        } catch (e) { /* silent */ }
    };

    const toggleOpen = async () => {
        if (!open) {
            // Data loading can go here if integrating real backend
        }
        setOpen(!open);
    };

    const markRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setCount(c => Math.max(0, c - 1));
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'All') return true;
        if (filter === 'Finance') return n.dept === 'Finance';
        if (filter === 'Sales') return n.dept === 'Lead' || n.dept === 'Sales';
        if (filter === 'Legal') return n.dept === 'Legal' || n.dept === 'Ops'; // Map Ops to Legal for demo
        return true;
    });

    return (
        <div style={{ position: 'relative' }}>
            <button onClick={toggleOpen} style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '10px', padding: '8px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative' }}>
                <FaBell size={16} />
                {count > 0 && <span style={{ position: 'absolute', top: '-4px', right: '-4px', background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 700, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{count > 9 ? '9+' : count}</span>}
            </button>
            
            <Modal show={open} onHide={() => setOpen(false)} size="xl" centered dialogClassName="premium-notification-modal">
                <div className="premium-notification-header">
                    <div>
                        <h2 className="premium-notification-title">Premium Notification Inbox</h2>
                        <p className="premium-notification-subtitle mb-0">Manage and prioritize critical workspace updates.</p>
                    </div>
                    <div className="premium-filter-section">
                        <span className="premium-filter-label">FILTER BY</span>
                        {['All', 'Finance', 'Legal', 'Sales'].map(f => (
                            <button 
                                key={f} 
                                className={`premium-filter-pill ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="premium-notification-list">
                    {filteredNotifications.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No notifications found for this filter.</div>
                    ) : (
                        filteredNotifications.map(n => (
                            <div key={n.id} className="premium-notification-card">
                                <div className="premium-card-accent" style={{ backgroundColor: n.accentColor }}></div>
                                
                                <div className="premium-card-icon-container" style={{ backgroundColor: n.bgLight }}>
                                    {n.icon}
                                    <span className="premium-card-dept" style={{ color: n.accentColor }}>{n.dept}</span>
                                </div>

                                <div className="premium-card-content">
                                    <div className="premium-card-title">
                                        {n.title}
                                        {!n.isRead && <span className="premium-card-unread-dot"></span>}
                                    </div>
                                    <div className="premium-card-desc">{n.message}</div>
                                    <div className="premium-card-badges">
                                        {n.badges.map(b => (
                                            <span key={b} className="premium-badge">{b}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="premium-card-score-section">
                                    <div className="premium-card-score" style={{ color: n.scoreColor }}>{n.score}</div>
                                    <div className="premium-card-score-label">{n.scoreLabel}</div>
                                </div>

                                <div className="premium-card-actions">
                                    <button className="premium-action-btn btn-assign" onClick={() => markRead(n.id)}>Assign</button>
                                    <button className="premium-action-btn btn-snooze">Snooze</button>
                                    <button className="premium-action-btn btn-draft">Draft</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Modal>
        </div>
    );
}
