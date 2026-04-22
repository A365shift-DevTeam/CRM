import React, { useEffect, useState, useMemo } from 'react';
import { Modal } from 'react-bootstrap';
import { Wallet, Rocket, Server, Mail, Clock, Bell } from 'lucide-react';
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
        dept: dept,
        title: alert.title || 'System Alert',
        message: alert.message || '',
        isRead: alert.isRead || false,
        score: score,
        scoreLabel: scoreLabel,
        scoreColor: scoreColor,
        badges: severity !== 'info' ? [capitalize(severity), dept, 'Alert'] : [dept, 'Info'],
        accentColor: accentColor,
        bgLight: bgLight,
        icon: icon,
        raw: alert
    };
};

export default function NotificationInboxModal({ show, onHide, alerts = [] }) {
    const [filter, setFilter] = useState('All');
    
    // Convert incoming alerts to premium format
    const premiumAlerts = useMemo(() => {
        return alerts.map(mapAlertToPremium);
    }, [alerts]);

    const [readStates, setReadStates] = useState({});

    const markRead = (id) => {
        setReadStates(prev => ({ ...prev, [id]: true }));
        try {
            notificationService.markAsRead(id);
        } catch (e) {
            console.error('Failed to mark read', e);
        }
    };

    const filteredNotifications = premiumAlerts.filter(n => {
        // If it was marked read locally, skip it or format it differently (for now we keep it but it will be read)
        if (filter === 'All') return true;
        if (filter === 'Finance') return n.dept === 'Finance';
        if (filter === 'Sales') return n.dept === 'Lead' || n.dept === 'Sales';
        if (filter === 'Legal') return n.dept === 'Legal' || n.dept === 'Ops'; 
        return true;
    }).map(n => ({
        ...n,
        isRead: n.isRead || readStates[n.id]
    }));

    return (
        <Modal show={show} onHide={onHide} size="xl" centered dialogClassName="premium-notification-modal">
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

                            <div className="premium-card-actions" style={{ flexDirection: 'row', gap: '12px' }}>
                                <button className="premium-action-icon-btn btn-whatsapp" title="WhatsApp"><FaWhatsapp size={18} /></button>
                                <button className="premium-action-icon-btn btn-mail" title="Email"><Mail size={18} /></button>
                                <button className="premium-action-icon-btn btn-snooze-icon" title="Snooze" onClick={() => markRead(n.id)}><Clock size={18} /></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
}
