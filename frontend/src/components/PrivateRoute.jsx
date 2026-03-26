import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PrivateRoute({ children, permission }) {
    const { currentUser, hasPermission } = useAuth();

    if (!currentUser) return <Navigate to="/login" />;

    // If a permission is required, check it
    if (permission && !hasPermission(permission)) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
                <div style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '16px',
                    padding: '2rem 3rem',
                    textAlign: 'center',
                    maxWidth: '420px'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>&#128274;</div>
                    <h4 style={{ color: '#dc2626', fontWeight: 700, marginBottom: '0.5rem' }}>Access Denied</h4>
                    <p style={{ color: '#64748b', margin: 0 }}>
                        You don't have permission to access this page. Contact your administrator.
                    </p>
                </div>
            </div>
        );
    }

    return children;
}
