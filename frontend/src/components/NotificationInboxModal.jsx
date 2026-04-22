import React, { useMemo, useState } from 'react';
import { X, Wallet, Rocket, Server, Mail, Clock, Bell } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { notificationService } from '../services/notificationService';
import './NotificationBell.css';

const mapAlertToPremium = (alert) => {
    const rawCat = String(alert.category || '').toLowerCase();
    const txt = `${alert.title || ''} ${alert.message || ''}`.toLowerCase();
    const severity = String(alert.severity || 'info').toLowerCase();

    let dept = 'General';
    let icon = <Bell size={24} color="#6B7280" strokeWidth={2} />;
    let accentColor = '#6B7280';
    let bgLight = '#F3F4F6';
    let scoreLabel = 'Info';
    let score = '100%';
    let scoreColor = '#6B7280';

    if (rawCat.includes('sale') || txt.includes('sale') || txt.includes('deal')) {
        dept = 'Sales';
        icon = <Rocket size={24} color="#10B981" strokeWidth={2} />;
        accentColor = '#10B981';
        bgLight = '#ECFDF5';
        scoreLabel = 'Deal Prob.';
        score = severity === 'critical' || severity === 'high' ? '95%' : '75%';
        scoreColor = '#10B981';
    } else if (rawCat.includes('finance') || txt.includes('payment') || txt.includes('invoice')) {
        dept = 'Finance';
        icon = <Wallet size={24} color="#F97316" strokeWidth={2} />;
        accentColor = '#F97316';
        bgLight = '#FFF7ED';
        scoreLabel = 'Risk Score';
        score = severity === 'critical' || severity === 'high' ? '80%' : '20%';
        scoreColor = '#F97316';
    } else if (rawCat.includes('task') || rawCat.includes('execution') || txt.includes('pipeline')) {
        dept = 'Ops';
        icon = <Server size={24} color="#3B82F6" strokeWidth={2} />;
        accentColor = '#3B82F6';
        bgLight = '#EFF6FF';
        scoreLabel = 'Health Score';
        score = severity === 'critical' || severity === 'high' ? '45%' : '98%';
        scoreColor = '#3B82F6';
    } else {
        dept = alert.category || 'General';
    }

    const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    return {
        id: alert.id || alert._id || Math.random().toString(),
        dept,
        title: alert.title || 'System Alert',
        message: alert.message || '',
        isRead: alert.isRead || false,
        score,
        scoreLabel,
        scoreColor,
        badges: severity !== 'info' ? [capitalize(severity), dept, 'Alert'] : [dept, 'Info'],
        accentColor,
        bgLight,
        icon,
        raw: alert,
    };
};

export default function NotificationInboxModal({ show, onHide, alerts = [] }) {
    const [filter, setFilter] = useState('All');
    const [readStates, setReadStates] = useState({});

    const premiumAlerts = useMemo(() => alerts.map(mapAlertToPremium), [alerts]);

    const markRead = (id) => {
        setReadStates(prev => ({ ...prev, [id]: true }));
        try { notificationService.markAsRead(id); } catch (e) { console.error('Failed to mark read', e); }
    };

    const filteredNotifications = premiumAlerts.filter(n => {
        if (filter === 'All') return true;
        if (filter === 'Finance') return n.dept === 'Finance';
        if (filter === 'Sales') return n.dept === 'Lead' || n.dept === 'Sales';
        if (filter === 'Legal') return n.dept === 'Legal' || n.dept === 'Ops';
        return true;
    }).map(n => ({ ...n, isRead: n.isRead || readStates[n.id] }));

    if (!show) return null;

    return (
        <div className="nim-overlay" onClick={onHide}>
            <div className="nim-panel" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="nim-header">
                    <div className="nim-header-left">
                        <h2 className="nim-title">Premium Notification Inbox</h2>
                        <p className="nim-subtitle">Manage and prioritize critical workspace updates.</p>
                    </div>

                    <div className="nim-header-center">
                        <span className="nim-filter-label">FILTER BY</span>
                        {['All', 'Finance', 'Legal', 'Sales'].map(f => (
                            <button
                                key={f}
                                className={`nim-filter-pill ${filter === f ? 'active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <button className="nim-close-btn" onClick={onHide} title="Close">
                        <X size={22} />
                    </button>
                </div>

                {/* List */}
                <div className="nim-list">
                    {filteredNotifications.length === 0 ? (
                        <div className="nim-empty">No notifications found for this filter.</div>
                    ) : (
                        filteredNotifications.map(n => (
                            <div key={n.id} className="nim-card">
                                <div className="nim-card-accent" style={{ backgroundColor: n.accentColor }} />

                                <div className="nim-card-icon" style={{ backgroundColor: n.bgLight }}>
                                    {n.icon}
                                    <span className="nim-card-dept" style={{ color: n.accentColor }}>{n.dept}</span>
                                </div>

                                <div className="nim-card-content">
                                    <div className="nim-card-title">
                                        {n.title}
                                        {!n.isRead && <span className="nim-unread-dot" />}
                                    </div>
                                    <div className="nim-card-desc">{n.message}</div>
                                    <div className="nim-card-badges">
                                        {n.badges.map(b => <span key={b} className="nim-badge">{b}</span>)}
                                    </div>
                                </div>

                                <div className="nim-card-score">
                                    <div className="nim-score-value" style={{ color: n.scoreColor }}>{n.score}</div>
                                    <div className="nim-score-label">{n.scoreLabel}</div>
                                </div>

                                <div className="nim-card-actions">
                                    <button className="nim-action-btn nim-whatsapp" title="WhatsApp"><FaWhatsapp size={18} /></button>
                                    <button className="nim-action-btn nim-mail" title="Email"><Mail size={18} /></button>
                                    <button className="nim-action-btn nim-snooze" title="Snooze" onClick={() => markRead(n.id)}><Clock size={18} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
