import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2, KeyRound, Smartphone } from 'lucide-react';
import { apiClient } from '../../services/apiClient';
import loginBg from '../../assets/images/Login.png';

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  outline: 'none',
  fontFamily: 'DM Sans, sans-serif',
};
const focusStyle = { borderColor: 'rgba(67,97,238,0.6)', background: 'rgba(255,255,255,0.07)', boxShadow: '0 0 0 3px rgba(67,97,238,0.14)' };
const blurStyle  = { borderColor: 'rgba(255,255,255,0.09)', background: 'rgba(255,255,255,0.04)', boxShadow: 'none' };

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const [step, setStep]                     = useState('credentials');
  const [partialToken, setPartialToken]     = useState('');
  const [otpCode, setOtpCode]               = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  const { login, completeLogin } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.requires2FA) {
        setPartialToken(result.partialToken);
        if (result.method === 'email') {
          await apiClient.post('/auth/send-otp', { partialToken: result.partialToken });
          startResendCooldown();
          setStep('otp');
        } else {
          setStep('totp');
        }
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiClient.post('/auth/verify-otp', { code: otpCode, partialToken });
      await completeLogin(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  async function handleResendOtp() {
    setError('');
    try {
      await apiClient.post('/auth/send-otp', { partialToken });
      startResendCooldown();
    } catch (err) {
      setError(err.message);
    }
  }

  function startResendCooldown() {
    setResendCooldown(60);
    clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(v => {
        if (v <= 1) { clearInterval(cooldownRef.current); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  async function handleTotpSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await apiClient.post('/auth/verify-totp', { code: otpCode, partialToken });
      await completeLogin(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(7,9,15,0.30) 100%)' }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[2px] pointer-events-none" style={{ background: 'linear-gradient(90deg, transparent, #4361EE, #7C3AED, transparent)' }} />

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <div className="rounded-[26px] p-8 border" style={{ background: 'rgba(13,17,28,0.88)', backdropFilter: 'blur(28px) saturate(1.6)', WebkitBackdropFilter: 'blur(28px) saturate(1.6)', borderColor: 'rgba(255,255,255,0.08)', boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)' }}>

          <div className="flex flex-col items-center mb-7">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)', boxShadow: '0 8px 28px rgba(67,97,238,0.45)' }}>
              <ShieldCheck size={20} className="text-white" />
            </div>
            <h1 className="text-[24px] font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>A365Shift CRM</h1>
            <p className="text-slate-500 text-[12.5px] mt-1">
              {step === 'credentials' ? 'Sign in to your workspace' : step === 'otp' ? 'Check your email for a code' : 'Enter your authenticator code'}
            </p>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-5 px-4 py-3 rounded-xl text-[12.5px] text-center" style={{ background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.28)', color: '#FDA4AF' }}>
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {step === 'credentials' && (
              <motion.form key="creds" onSubmit={handleSubmit} className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#64748B' }}>Email Address</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-[13.5px] transition-all" style={inputStyle} onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => Object.assign(e.target.style, blurStyle)} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#64748B' }}>Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#475569' }} />
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="w-full pl-10 pr-11 py-3 rounded-xl text-white text-[13.5px] transition-all" style={inputStyle} onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => Object.assign(e.target.style, blurStyle)} />
                    <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <Link to="/forgot-password" className="text-[12px]" style={{ color: '#64748B', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <button type="submit" disabled={loading} className="w-full mt-1 flex items-center justify-center gap-2 py-[13px] rounded-xl font-semibold text-[13.5px] text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3D54D8 100%)', boxShadow: '0 4px 22px rgba(67,97,238,0.45)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.72 : 1, fontFamily: 'DM Sans, sans-serif' }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /><span>Signing in…</span></> : <><span>Sign in</span><ArrowRight size={15} /></>}
                </button>
              </motion.form>
            )}

            {step === 'otp' && (
              <motion.form key="otp" onSubmit={handleOtpSubmit} className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(67,97,238,0.15)', border: '1px solid rgba(67,97,238,0.3)' }}>
                    <KeyRound size={18} style={{ color: '#4361EE' }} />
                  </div>
                  <p className="text-[13px]" style={{ color: '#94a3b8' }}>We sent a 6-digit code to <strong className="text-white">{email}</strong></p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#64748B' }}>6-Digit Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,''))} placeholder="000000" required className="w-full px-4 py-3 rounded-xl text-white text-center text-[20px] tracking-[0.3em] transition-all" style={inputStyle} onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => Object.assign(e.target.style, blurStyle)} />
                </div>
                <button type="submit" disabled={loading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 py-[13px] rounded-xl font-semibold text-[13.5px] text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3D54D8 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || otpCode.length < 6) ? 0.72 : 1 }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /><span>Verifying…</span></> : <><span>Verify Code</span><ArrowRight size={15} /></>}
                </button>
                <div className="text-center">
                  <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} className="text-[12px] transition-colors" style={{ color: resendCooldown > 0 ? '#475569' : '#4361EE', background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
                <button type="button" onClick={() => { setStep('credentials'); setOtpCode(''); setError(''); }} className="w-full text-[12px] text-center" style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Back to sign in
                </button>
              </motion.form>
            )}

            {step === 'totp' && (
              <motion.form key="totp" onSubmit={handleTotpSubmit} className="space-y-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-2">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(67,97,238,0.15)', border: '1px solid rgba(67,97,238,0.3)' }}>
                    <Smartphone size={18} style={{ color: '#4361EE' }} />
                  </div>
                  <p className="text-[13px]" style={{ color: '#94a3b8' }}>Enter the 6-digit code from your authenticator app</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: '#64748B' }}>Authenticator Code</label>
                  <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g,''))} placeholder="000000" required className="w-full px-4 py-3 rounded-xl text-white text-center text-[20px] tracking-[0.3em] transition-all" style={inputStyle} onFocus={e => Object.assign(e.target.style, focusStyle)} onBlur={e => Object.assign(e.target.style, blurStyle)} />
                </div>
                <button type="submit" disabled={loading || otpCode.length < 6} className="w-full flex items-center justify-center gap-2 py-[13px] rounded-xl font-semibold text-[13.5px] text-white" style={{ background: 'linear-gradient(135deg, #4361EE 0%, #3D54D8 100%)', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: (loading || otpCode.length < 6) ? 0.72 : 1 }}>
                  {loading ? <><Loader2 size={15} className="animate-spin" /><span>Verifying…</span></> : <><span>Verify</span><ArrowRight size={15} /></>}
                </button>
                <button type="button" onClick={() => { setStep('credentials'); setOtpCode(''); setError(''); }} className="w-full text-[12px] text-center" style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer' }}>
                  ← Back to sign in
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center mt-6 text-[11px] tracking-wider" style={{ color: '#334155', fontFamily: 'DM Sans, sans-serif' }}>
            AI-BUSINESS CRM &nbsp;·&nbsp; ENTERPRISE SUITE
          </p>
        </div>
      </motion.div>
    </div>
  );
}
