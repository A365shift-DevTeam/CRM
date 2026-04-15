import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from 'lucide-react';
import loginBg from '../../assets/images/Login.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('Login Error:', err);
      setError(`Failed to log in: ${err.message}`);
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#07090F]/65" />

      {/* Subtle top accent glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[480px] h-[2px] pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, #4361EE, #7C3AED, transparent)' }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[420px] mx-4"
      >
        <div
          className="rounded-[26px] p-8 border"
          style={{
            background: 'rgba(13, 17, 28, 0.88)',
            backdropFilter: 'blur(28px) saturate(1.6)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.6)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04), 0 -1px 0 rgba(255,255,255,0.06) inset',
          }}
        >
          {/* Brand */}
          <motion.div
            className="flex flex-col items-center mb-7"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)',
                boxShadow: '0 8px 28px rgba(67,97,238,0.45)',
              }}
            >
              <ShieldCheck size={20} className="text-white" />
            </div>
            <h1
              className="text-[24px] font-bold text-white tracking-tight leading-tight text-center"
              style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}
            >
              A365Shift CRM
            </h1>
            <p className="text-slate-500 text-[12.5px] mt-1 tracking-wide">
              Sign in to your workspace
            </p>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-5 px-4 py-3 rounded-xl text-[12.5px] text-center"
              style={{
                background: 'rgba(244,63,94,0.12)',
                border: '1px solid rgba(244,63,94,0.28)',
                color: '#FDA4AF',
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.22 }}
            >
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2"
                style={{ color: '#64748B' }}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#475569' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-[13.5px] transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    outline: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(67,97,238,0.6)';
                    e.target.style.background = 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.14)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                    e.target.style.background = 'rgba(255,255,255,0.04)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.08em] mb-2"
                style={{ color: '#64748B' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: '#475569' }}
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-11 py-3 rounded-xl text-white text-[13.5px] transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.09)',
                    outline: 'none',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'rgba(67,97,238,0.6)';
                    e.target.style.background = 'rgba(255,255,255,0.07)';
                    e.target.style.boxShadow = '0 0 0 3px rgba(67,97,238,0.14)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'rgba(255,255,255,0.09)';
                    e.target.style.background = 'rgba(255,255,255,0.04)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#94A3B8'}
                  onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </motion.div>

            {/* Remember + Forgot */}
            <motion.div
              className="flex items-center justify-between pt-0.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.38 }}
            >
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4 flex-shrink-0">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="peer appearance-none w-4 h-4 rounded border transition-colors cursor-pointer"
                    style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.18)' }}
                  />
                  <svg
                    className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-[12px] transition-colors" style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif' }}>
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[12px] transition-colors"
                style={{ color: '#64748B', fontFamily: 'DM Sans, sans-serif', textDecoration: 'none' }}
                onMouseEnter={e => e.currentTarget.style.color = '#4361EE'}
                onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
              >
                Forgot password?
              </Link>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.44 }}
            >
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={loading ? {} : { scale: 1.015 }}
                whileTap={loading ? {} : { scale: 0.975 }}
                className="w-full mt-1 flex items-center justify-center gap-2 py-[13px] rounded-xl font-semibold text-[13.5px] text-white transition-opacity"
                style={{
                  background: 'linear-gradient(135deg, #4361EE 0%, #3D54D8 100%)',
                  boxShadow: '0 4px 22px rgba(67,97,238,0.45), 0 1px 0 rgba(255,255,255,0.12) inset',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.72 : 1,
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight size={15} />
                  </>
                )}
              </motion.button>
            </motion.div>
          </form>

          {/* Footer */}
          <motion.p
            className="text-center mt-6 text-[11px] tracking-wider"
            style={{ color: '#334155', fontFamily: 'DM Sans, sans-serif' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            AI-BUSINESS CRM &nbsp;·&nbsp; ENTERPRISE SUITE
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
