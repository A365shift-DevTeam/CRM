import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function OrgSuspendedBanner() {
    const { currentUser, logout } = useAuth();

    if (currentUser?.orgStatus !== 'SUSPENDED') return null;

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div style={{
                background: '#fff', borderRadius: '16px', padding: '3rem 2.5rem',
                maxWidth: '480px', width: '100%', textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ color: '#dc2626', fontWeight: 800, marginBottom: '0.5rem' }}>
                    Organization Suspended
                </h2>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    Your organization has been suspended. Please contact support to restore access.
                </p>
                <button
                    onClick={logout}
                    style={{
                        background: '#4361EE', color: '#fff', border: 'none',
                        borderRadius: '8px', padding: '0.75rem 2rem',
                        fontWeight: 700, cursor: 'pointer'
                    }}
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
