import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState(searchParams.get('token') || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return; }
        try {
            setError('');
            setLoading(true);
            await apiClient.post('/auth/reset-password', { token, newPassword });
            alert('Password reset successful! Please login with your new password.');
            navigate('/login');
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            <div className="p-5 text-center" style={{ maxWidth: '420px', width: '100%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                <h2 className="mb-4" style={{ color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.3px' }}>New Password<span style={{ color: 'var(--accent-primary)' }}>.</span></h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input type="text" className="glass-input" placeholder="Reset Token" value={token} onChange={(e) => setToken(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <input type="password" className="glass-input" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <input type="password" className="glass-input" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>
                    <button disabled={loading} type="submit" className="btn-neon w-100 mb-3">{loading ? 'Resetting...' : 'Reset Password'}</button>
                    <Link to="/login" className="text-muted">Back to Login</Link>
                </form>
            </div>
        </div>
    );
}
