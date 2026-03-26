import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const [sent, setSent] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            setError('');
            setLoading(true);
            const result = await apiClient.post('/auth/forgot-password', { email });
            setToken(result);
            setSent(true);
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    }

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            <div className="p-5 text-center" style={{ maxWidth: '420px', width: '100%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                <h2 className="mb-4" style={{ color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.3px' }}>Reset Password<span style={{ color: 'var(--accent-primary)' }}>.</span></h2>
                {error && <div className="alert alert-danger">{error}</div>}
                {sent ? (
                    <div>
                        <div className="alert alert-success">Password reset token generated. Use this token to reset your password.</div>
                        <div className="mb-3 p-2" style={{ background: '#f1f5f9', borderRadius: '8px', wordBreak: 'break-all', fontSize: '0.8rem' }}>{token}</div>
                        <Link to={`/reset-password?token=${encodeURIComponent(token)}`} className="btn-neon w-100 d-block text-decoration-none mb-2">Reset Password Now</Link>
                        <Link to="/login" className="text-muted">Back to Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>Enter your email to receive a password reset token.</p>
                        <div className="mb-3">
                            <input type="email" className="glass-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <button disabled={loading} type="submit" className="btn-neon w-100 mb-3">{loading ? 'Sending...' : 'Send Reset Token'}</button>
                        <Link to="/login" className="text-muted">Back to Login</Link>
                    </form>
                )}
            </div>
        </div>
    );
}
