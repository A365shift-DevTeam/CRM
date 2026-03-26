import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { FaUserGroup, FaRobot } from 'react-icons/fa6';

export default function AIAgentsLayout() {
    const location = useLocation();

    const navItems = [
        { path: '/ai-agents/ai-followup', icon: <FaRobot size={18} className="me-2" />, label: 'AI Followup' },
        { path: '/ai-agents/vendor', icon: <FaUserGroup size={18} className="me-2" />, label: 'Vendor Settings' },
    ];

    return (
        <div className="d-flex flex-column h-100 w-100" style={{ background: 'transparent' }}>
            {/* Top Navigation Bar for AI Agents */}
            <nav style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                flexShrink: 0,
                zIndex: 100
            }}>
                {/* Header */}
                <div className="d-flex flex-column">
                    <h5 className="fw-bold mb-1" style={{ color: '#1e293b', fontSize: '1.1rem' }}>AI Agents</h5>
                    <p className="text-muted small mb-0" style={{ fontSize: '0.75rem' }}>Manage AI automation & settings</p>
                </div>

                {/* Navigation Items */}
                <div className="d-flex align-items-center gap-2" style={{ flex: 1 }}>
                    {navItems.map(item => {
                        const isActive = location.pathname.includes(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className="d-flex align-items-center gap-2 px-4 py-2 text-decoration-none"
                                style={{
                                    color: isActive ? '#3b82f6' : '#64748b',
                                    background: isActive ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                    border: isActive ? '1px solid rgba(59, 130, 246, 0.12)' : '1px solid transparent',
                                    borderRadius: '10px',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '0.9rem',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.04)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {React.cloneElement(item.icon, { size: 18 })}
                                </div>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>

            {/* Content Area */}
            <div className="flex-grow-1 overflow-auto position-relative" style={{ background: 'transparent' }}>
                <Outlet />
            </div>
        </div>
    );
}
