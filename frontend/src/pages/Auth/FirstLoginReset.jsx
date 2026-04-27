import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function FirstLoginReset() {
    const { resetFirstPassword, currentUser } = useAuth();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (password.length < 8) {
            setError('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            await resetFirstPassword(password);
            // Redirect based on role
            if (currentUser?.role === 'SUPER_ADMIN') {
                navigate('/super-admin', { replace: true });
            } else {
                navigate('/', { replace: true });
            }
        } catch (err) {
            setError(err?.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', alignItems: 'center',
            justifyContent: 'center', background: '#f8fafc'
        }}>
            <div style={{
                background: '#fff', borderRadius: '16px', padding: '2.5rem',
                width: '100%', maxWidth: '420px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
                    <h2 style={{ color: '#1e293b', fontWeight: 700, marginBottom: '0.25rem' }}>
                        Set Your Password
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Welcome! Please set a new password before continuing.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: '0.4rem', fontSize: '14px' }}>
                            New Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                            placeholder="At least 8 characters"
                            style={{
                                width: '100%', padding: '0.65rem 1rem',
                                border: '1.5px solid #e2e8f0', borderRadius: '8px',
                                fontSize: '15px', outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '1.25rem' }}>
                        <label style={{ display: 'block', color: '#374151', fontWeight: 600, marginBottom: '0.4rem', fontSize: '14px' }}>
                            Confirm Password
                        </label>
                        <input
                            type="password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            placeholder="Repeat password"
                            style={{
                                width: '100%', padding: '0.65rem 1rem',
                                border: '1.5px solid #e2e8f0', borderRadius: '8px',
                                fontSize: '15px', outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '8px', padding: '0.65rem 1rem',
                            color: '#dc2626', fontSize: '13px', marginBottom: '1rem'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '0.75rem',
                            background: loading ? '#94a3b8' : '#4361EE',
                            color: '#fff', border: 'none', borderRadius: '8px',
                            fontWeight: 700, fontSize: '15px', cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? 'Saving…' : 'Set Password & Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
}
