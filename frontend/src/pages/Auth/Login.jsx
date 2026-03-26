import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();

        try {
            setError('');
            setLoading(true);
            await login(email, password);
            navigate('/');
        } catch (error) {
            console.error("Login Error:", error);
            setError(`Failed to log in: ${error.message}`);
        }

        setLoading(false);
    }

    return (
        <div className="container d-flex justify-content-center align-items-center vh-100" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)' }}>
            <div className="p-5 text-center" style={{ maxWidth: '420px', width: '100%', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
                <h2 className="mb-4" style={{ color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.3px' }}>Sign In<span style={{ color: 'var(--accent-primary)' }}>.</span></h2>
                {error && <div className="alert alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            type="email"
                            className="glass-input"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <input
                            type="password"
                            className="glass-input"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button disabled={loading} type="submit" className="btn-neon w-100 mb-3">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: '#3b82f6', textDecoration: 'none' }}>Forgot Password?</Link>
            </div>
        </div>

    );
}
