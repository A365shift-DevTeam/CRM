import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { apiClient } from '../../services/apiClient';
import { useAuth } from '../../context/AuthContext';
import { FaPalette, FaCheck, FaEnvelope, FaMobileScreen, FaTriangleExclamation } from 'react-icons/fa6';

const TABS = [
  { id: 'appearance', label: 'Appearance' },
  { id: 'security',   label: 'Security' },
];

export default function Settings() {
    const { themeColor, setThemeColor } = useTheme();
    const [inputColor, setInputColor] = useState(themeColor);
    const location = useLocation();
    const [activeTab, setActiveTab] = useState(location.state?.totpSetupRequired ? 'security' : 'appearance');

    const { currentUser, updateCurrentUser } = useAuth();
    const totpSetupRequired = location.state?.totpSetupRequired && !currentUser?.isTotpEnabled;

    // TOTP state
    const [totpSetup, setTotpSetup]     = useState(null);
    const [qrDataUrl, setQrDataUrl]     = useState('');
    const [totpCode, setTotpCode]       = useState('');
    const [totpStatus, setTotpStatus]   = useState('');
    const [totpEnabled, setTotpEnabled] = useState(currentUser?.isTotpEnabled || false);

    // Email OTP state
    const [emailOtpStep, setEmailOtpStep]     = useState('idle'); // 'idle' | 'pending' | 'verifying'
    const [emailOtpCode, setEmailOtpCode]     = useState('');
    const [emailOtpStatus, setEmailOtpStatus] = useState('');
    const [emailOtpEnabled, setEmailOtpEnabled] = useState(
        (currentUser?.twoFactorRequired && currentUser?.twoFactorMethod === 'email' && !currentUser?.isTotpEnabled) || false
    );

    const handleSave = () => {
        if (/^#[0-9A-F]{6}$/i.test(inputColor) || /^#[0-9A-F]{3}$/i.test(inputColor)) {
            setThemeColor(inputColor);
        } else {
            alert('Please enter a valid hex color code (e.g., #3b82f6)');
        }
    };

    const handlePresetChange = (color) => {
        setInputColor(color);
        setThemeColor(color);
    };

    // ── TOTP ─────────────────────────────────────────────────

    async function handleTotpSetup() {
        try {
            const data = await apiClient.get('/auth/totp/setup');
            setTotpSetup(data);
            const QRCode = (await import('qrcode')).default;
            const url = await QRCode.toDataURL(data.qrCodeUri, { width: 200, margin: 1 });
            setQrDataUrl(url);
            setTotpStatus('');
        } catch (err) {
            setTotpStatus(err.message || 'Failed to start TOTP setup.');
        }
    }

    async function handleTotpVerifySetup(e) {
        e.preventDefault();
        try {
            await apiClient.post('/auth/totp/verify-setup', { code: totpCode });
            setTotpEnabled(true);
            setTotpSetup(null);
            setQrDataUrl('');
            setTotpCode('');
            setTotpStatus('Authenticator app enabled successfully.');
            updateCurrentUser({ isTotpEnabled: true, twoFactorRequired: true, twoFactorMethod: 'totp' });
        } catch (err) {
            setTotpStatus(err.message || 'Invalid code. Please try again.');
        }
    }

    async function handleTotpDisable() {
        try {
            await apiClient.post('/auth/totp/disable', {});
            setTotpEnabled(false);
            setTotpStatus('Authenticator app disabled.');
            updateCurrentUser({ isTotpEnabled: false, twoFactorRequired: false, twoFactorMethod: 'email' });
        } catch (err) {
            setTotpStatus(err.message || 'Failed to disable TOTP.');
        }
    }

    // ── Email OTP ─────────────────────────────────────────────

    async function handleEmailOtpSendCode() {
        setEmailOtpStatus('');
        try {
            await apiClient.post('/auth/email-otp/send-enable', {});
            setEmailOtpStep('pending');
            setEmailOtpStatus('A 6-digit verification code has been sent to your email.');
        } catch (err) {
            setEmailOtpStatus(err.message || 'Failed to send verification code.');
        }
    }

    async function handleEmailOtpVerify(e) {
        e.preventDefault();
        setEmailOtpStatus('');
        try {
            await apiClient.post('/auth/email-otp/verify-enable', { code: emailOtpCode });
            setEmailOtpEnabled(true);
            setEmailOtpStep('idle');
            setEmailOtpCode('');
            setEmailOtpStatus('Email OTP enabled successfully.');
            updateCurrentUser({ twoFactorRequired: true, twoFactorMethod: 'email' });
        } catch (err) {
            setEmailOtpStatus(err.message || 'Invalid code. Please try again.');
        }
    }

    async function handleEmailOtpDisable() {
        setEmailOtpStatus('');
        try {
            await apiClient.post('/auth/email-otp/disable', {});
            setEmailOtpEnabled(false);
            setEmailOtpStatus('Email OTP disabled.');
            updateCurrentUser({ twoFactorRequired: false });
        } catch (err) {
            setEmailOtpStatus(err.message || 'Failed to disable Email OTP.');
        }
    }

    const isEmailOtpStatusGood = emailOtpStatus.includes('sent') || emailOtpStatus.includes('success') || emailOtpStatus.includes('disabled');
    const isTotpStatusGood = totpStatus.includes('success') || totpStatus.includes('disabled');

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FaPalette className="text-slate-500" /> System Settings
            </h2>

            {/* Tab bar */}
            <div className="flex gap-1 mb-6 border-b" style={{ borderColor: 'var(--border-color, #e2e8f0)' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className="px-4 py-2 text-sm font-medium transition-colors"
                        style={{
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab.id ? '2px solid #4361EE' : '2px solid transparent',
                            color: activeTab === tab.id ? '#4361EE' : '#64748B',
                            cursor: 'pointer',
                            marginBottom: '-1px',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Appearance Tab */}
            {activeTab === 'appearance' && (
                <div className="card border-0 p-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 border-b pb-2">Appearance</h3>

                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Primary Theme Color (Hex Code)
                            </label>
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-lg shadow-inner border border-slate-200 shrink-0"
                                    style={{ backgroundColor: themeColor }}
                                />
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={inputColor}
                                        onChange={(e) => setInputColor(e.target.value)}
                                        placeholder="#3b82f6"
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-opacity-50"
                                        style={{ '--tw-ring-color': themeColor }}
                                    />
                                </div>
                                <button
                                    onClick={handleSave}
                                    className="px-4 py-2 text-white font-medium rounded-lg flex items-center gap-2 transition-opacity hover:opacity-90"
                                    style={{ backgroundColor: themeColor }}
                                >
                                    <FaCheck size={14} /> Apply
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 mb-4">
                                Enter any valid hex code. This will update the color of sidebar links, buttons, and accents.
                            </p>

                            <div className="mt-4">
                                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2 gap-2 d-block">Quick Presets</span>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => handlePresetChange('#10b981')} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: '#10b981' }} title="Default Green" />
                                    <button onClick={() => handlePresetChange('#3b82f6')} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: '#3b82f6' }} title="Classic Blue" />
                                    <button onClick={() => handlePresetChange('#8b5cf6')} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: '#8b5cf6' }} title="Purple" />
                                    <button onClick={() => handlePresetChange('#f43f5e')} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: '#f43f5e' }} title="Rose" />
                                    <button onClick={() => handlePresetChange('#f59e0b')} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: '#f59e0b' }} title="Amber" />
                                    <button onClick={() => handlePresetChange('#0f172a')} className="w-8 h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform" style={{ backgroundColor: '#0f172a' }} title="Slate" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
                <div className="card border-0 p-6">
                    <h3 className="text-lg font-semibold text-slate-700 mb-6 border-b pb-2">Security</h3>

                    {totpSetupRequired && (
                        <div className="mb-6 p-4 rounded-xl flex items-start gap-3" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
                            <FaTriangleExclamation size={16} style={{ color: '#d97706', marginTop: 2, flexShrink: 0 }} />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#d97706', marginBottom: 2 }}>Authenticator App Required</div>
                                <div style={{ fontSize: '0.83rem', color: '#92400e' }}>
                                    Your administrator requires you to set up an authenticator app. Please enable it below to secure your account.
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="max-w-md space-y-8">

                        {/* ── Email OTP ──────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FaEnvelope size={15} style={{ color: '#4361EE' }} />
                                <h4 className="font-semibold" style={{ color: 'var(--text-primary, #1e293b)' }}>Email OTP</h4>
                                {emailOtpEnabled && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(67,97,238,0.1)', color: '#4361EE', border: '1px solid rgba(67,97,238,0.25)' }}>
                                        Enabled
                                    </span>
                                )}
                            </div>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #64748b)' }}>
                                Receive a 6-digit code to your email address each time you log in.
                            </p>

                            {emailOtpStatus && (
                                <div className="mb-4 p-3 rounded-lg text-sm" style={{
                                    background: isEmailOtpStatusGood ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                                    color: isEmailOtpStatusGood ? '#10b981' : '#f43f5e',
                                    border: `1px solid ${isEmailOtpStatusGood ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`
                                }}>
                                    {emailOtpStatus}
                                </div>
                            )}

                            {totpEnabled && (
                                <p className="text-sm p-3 rounded-lg" style={{ background: 'rgba(148,163,184,0.08)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' }}>
                                    Authenticator app (TOTP) is active. Disable it first to switch to Email OTP.
                                </p>
                            )}

                            {!totpEnabled && !emailOtpEnabled && emailOtpStep === 'idle' && (
                                <button onClick={handleEmailOtpSendCode} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--button-brand, #5286A5)', border: 'none', cursor: 'pointer' }}>
                                    Enable Email OTP
                                </button>
                            )}

                            {!totpEnabled && !emailOtpEnabled && emailOtpStep === 'pending' && (
                                <form onSubmit={handleEmailOtpVerify} className="space-y-3">
                                    <p className="text-sm" style={{ color: 'var(--text-secondary, #64748b)' }}>
                                        Enter the 6-digit code sent to <strong style={{ color: 'var(--text-primary, #1e293b)' }}>{currentUser?.email}</strong>:
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={emailOtpCode}
                                            onChange={e => setEmailOtpCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="flex-1 px-3 py-2 rounded-lg text-sm text-center tracking-widest"
                                            style={{ background: 'var(--input-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-primary, #1e293b)', fontSize: '1.1rem', letterSpacing: '0.3em' }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={emailOtpCode.length < 6}
                                            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                                            style={{ background: 'var(--button-brand, #5286A5)', border: 'none', cursor: emailOtpCode.length < 6 ? 'not-allowed' : 'pointer', opacity: emailOtpCode.length < 6 ? 0.6 : 1 }}
                                        >
                                            Confirm
                                        </button>
                                    </div>
                                    <div className="flex gap-3">
                                        <button type="button" onClick={handleEmailOtpSendCode} className="text-xs" style={{ background: 'none', border: 'none', color: '#4361EE', cursor: 'pointer', padding: 0 }}>
                                            Resend code
                                        </button>
                                        <button type="button" onClick={() => { setEmailOtpStep('idle'); setEmailOtpCode(''); setEmailOtpStatus(''); }} className="text-xs" style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0 }}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}

                            {!totpEnabled && emailOtpEnabled && (
                                <button onClick={handleEmailOtpDisable} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer' }}>
                                    Disable Email OTP
                                </button>
                            )}
                        </div>

                        {/* Divider */}
                        <div style={{ borderTop: '1px solid var(--border-color, #e2e8f0)' }} />

                        {/* ── TOTP ──────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <FaMobileScreen size={15} style={{ color: '#10b981' }} />
                                <h4 className="font-semibold" style={{ color: 'var(--text-primary, #1e293b)' }}>Authenticator App (TOTP)</h4>
                                {totpEnabled && (
                                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}>
                                        Enabled
                                    </span>
                                )}
                            </div>
                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary, #64748b)' }}>
                                Use Google Authenticator, Authy, or any TOTP app for extra login security.
                            </p>

                            {totpStatus && (
                                <div className="mb-4 p-3 rounded-lg text-sm" style={{
                                    background: isTotpStatusGood ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
                                    color: isTotpStatusGood ? '#10b981' : '#f43f5e',
                                    border: `1px solid ${isTotpStatusGood ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`
                                }}>
                                    {totpStatus}
                                </div>
                            )}

                            {!totpEnabled && !totpSetup && (
                                <button onClick={handleTotpSetup} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--button-brand, #5286A5)', border: 'none', cursor: 'pointer' }}>
                                    Enable Authenticator App
                                </button>
                            )}

                            {totpEnabled && !totpSetup && (
                                <button onClick={handleTotpDisable} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.3)', cursor: 'pointer' }}>
                                    Disable Authenticator App
                                </button>
                            )}

                            {totpSetup && qrDataUrl && (
                                <div className="space-y-4">
                                    <p className="text-sm" style={{ color: 'var(--text-secondary, #64748b)' }}>Scan this QR code with your authenticator app:</p>
                                    <img src={qrDataUrl} alt="TOTP QR Code" className="rounded-lg border p-2" style={{ background: '#fff', borderColor: 'var(--border-color, #e2e8f0)' }} />
                                    <p className="text-xs font-mono break-all p-2 rounded" style={{ background: 'var(--bg-secondary, #f8fafc)', color: 'var(--text-secondary, #64748b)' }}>
                                        Manual key: {totpSetup.secret}
                                    </p>
                                    <form onSubmit={handleTotpVerifySetup} className="flex gap-2">
                                        <input type="text" inputMode="numeric" maxLength={6} value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/\D/g,''))} placeholder="Enter 6-digit code" className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--input-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', color: 'var(--text-primary, #1e293b)' }} />
                                        <button type="submit" disabled={totpCode.length < 6} className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--button-brand, #5286A5)', border: 'none', cursor: totpCode.length < 6 ? 'not-allowed' : 'pointer', opacity: totpCode.length < 6 ? 0.6 : 1 }}>
                                            Confirm
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
