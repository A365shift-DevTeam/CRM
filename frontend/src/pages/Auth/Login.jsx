import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Loader2, Smartphone, Check, Mail } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Images
import worldMap from '../../assets/images/World Map.png';
import ambotLogo from '../../assets/images/ambot logo.png';
import ambotIcon from '../../assets/images/Ambot logo png123.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState('credentials');
  const [partialToken, setPartialToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => () => clearInterval(cooldownRef.current), []);

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
      } else if (result.user?.totpSetupRequired) {
        navigate('/settings', { state: { totpSetupRequired: true } });
      } else if (result.user?.isFirstLogin) {
        navigate('/first-login-reset');
      } else if (result.user?.role === 'SUPER_ADMIN') {
        navigate('/super-admin');
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
      if (data.isFirstLogin) navigate('/first-login-reset');
      else if (data.role === 'SUPER_ADMIN') navigate('/super-admin');
      else navigate('/');
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

  // Common input classes
  const inputClass = "w-full bg-[#edf2fb] py-1 px-3 outline-none text-[#152c5b] text-[13px] transition-colors mt-1";

  return (
    <div className="min-h-screen relative flex bg-[#ffffff] overflow-hidden" style={{ fontFamily: 'DM Sans, sans-serif' }}>

      {/* Full Page World Map Background */}
      <div
        className="absolute inset-0 z-0 pointer-events-none bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${worldMap})`,
          backgroundSize: '100%',
          opacity: 1,
          filter: 'contrast(1.5) brightness(0.95)'
        }}
      />

      {/* Top Left Logo */}
      <div className="absolute top-8 left-8 z-20">
        <img src={ambotLogo} alt="AmBot 365" className="h-8 object-contain" />
      </div>

      {/* Left Side */}
      <div className="hidden lg:flex w-[50%] relative flex-col justify-center pl-36 z-10 -mt-40 antialiased font-sans">

        <h1 className="text-[50px] text-[#152c5b] whitespace-nowrap mb-4 tracking-tight">
          <span className="font-normal">A365</span> <span className="font-bold" style={{ fontFamily: '"Manrope", sans-serif' }}>Business Hub</span>
        </h1>

        <div className="flex flex-col space-y-3 text-[#152c5b] text-[22px] pl-[34px]">
          <p className="font-normal">Contacts | Sales| Agents | Digital</p>
          <p className="font-normal">Create Contacts</p>
        </div>

        {/* Slogan */}
        <div className="absolute bottom-24 left-36 z-20">
          <p className="text-[#152c5b] text-[16px] font-medium tracking-wide">
            We Build It . You Operate It . Transformation begins.
          </p>
        </div>
      </div>

      {/* Right Side */}
      <div className="w-full lg:w-[50%] flex items-center justify-center relative p-8">

        {/* Card */}
        <div className="bg-white rounded-[20px] shadow-[0_4px_30px_rgb(0,0,0,0.06)] w-full max-w-[360px] p-6 relative z-10 border border-gray-100">

          {/* Top Gradient Border Mask */}
          <div className="absolute inset-0 rounded-[19px] overflow-hidden pointer-events-none z-0">
            <div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-[#408464] via-[#58977c] to-[#a3d9b8]"></div>
          </div>

          <div className="flex items-center mb-5 gap-3 mt-1">
            <img src={ambotIcon} alt="Icon" className="w-[36px] h-[36px] object-contain flex-shrink-0 shadow-sm rounded-[8px]" />
            <div>
              <h2 className="text-[18px] font-medium text-[#152c5b] leading-tight">Login</h2>
              <p className="text-[#152c5b] text-[13px] opacity-90 mt-0.5">Employee | Admin</p>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2 rounded-lg text-[12px] bg-red-50 text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div className="relative pl-6 pr-2">

            <AnimatePresence mode="wait">
              {step === 'credentials' && (
                <motion.form key="creds" onSubmit={handleSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                  {/* Username Field */}
                  <div className="relative mb-4">
                    <div className="absolute -left-[22px] top-[5px] flex items-center justify-center w-3 h-3">
                      {isValidEmail(email) ? (
                        <Check size={14} strokeWidth={4} className="text-[#58977c]" />
                      ) : (
                        <div className="w-[7px] h-[7px] rounded-full bg-[#6db68c]"></div>
                      )}
                    </div>
                    <label className="block text-[#152c5b] text-[14px] font-medium tracking-wide">Email</label>
                    <div className="w-full relative">
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClass} placeholder="Enter Your Username" />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="relative mb-4">
                    <div className="absolute -left-[22px] top-[5px] flex items-center justify-center w-3 h-3">
                      {password.length >= 6 ? (
                        <Check size={14} strokeWidth={4} className="text-[#58977c]" />
                      ) : (
                        <div className="w-[7px] h-[7px] rounded-full bg-[#6db68c]"></div>
                      )}
                    </div>
                    <label className="block text-[#152c5b] text-[14px] font-medium tracking-wide">Password</label>
                    <div className="relative w-full">
                      <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className={inputClass} placeholder="Enter Your Password" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-[55%] translate-y-[-50%] text-gray-400 hover:text-[#58977c] transition-colors">
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <div className="w-full text-right mt-1">
                      <Link to="/forgot-password" className="text-[11px] text-gray-400 hover:text-[#152c5b] transition-colors font-medium">Forgot password?</Link>
                    </div>
                  </div>

                  <div className="flex justify-center mt-4 w-full pr-2">
                    <button type="submit" disabled={loading} className="bg-[#5a9c7d] hover:bg-[#4b886b] text-white px-8 py-1 rounded-full font-medium text-[13px] tracking-wide transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm">
                      {loading && <Loader2 size={13} className="animate-spin" />}
                      Login
                    </button>
                  </div>
                </motion.form>
              )}

              {(step === 'otp' || step === 'totp') && (
                <motion.form key="otp" onSubmit={step === 'otp' ? handleOtpSubmit : handleTotpSubmit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="relative mb-4 opacity-50">
                    <div className="absolute -left-[22px] top-[5px] flex items-center justify-center w-3 h-3">
                      <Check size={14} strokeWidth={4} className="text-[#58977c]" />
                    </div>
                    <label className="block text-[#152c5b] text-[14px] font-medium tracking-wide">Username</label>
                    <div className={`${inputClass} bg-transparent border-b border-gray-200 px-0 py-0.5`}>{email}</div>
                  </div>

                  <div className="relative mb-4 opacity-50">
                    <div className="absolute -left-[22px] top-[5px] flex items-center justify-center w-3 h-3">
                      <Check size={14} strokeWidth={4} className="text-[#58977c]" />
                    </div>
                    <label className="block text-[#152c5b] text-[14px] font-medium tracking-wide">Password</label>
                    <div className={`${inputClass} bg-transparent border-b border-gray-200 px-0 py-0.5`}>••••••••</div>
                  </div>

                  <div className="relative mb-4">
                    <div className="absolute -left-[22px] top-[5px] flex items-center justify-center w-3 h-3 z-10">
                      {otpCode.length === 6 ? (
                        <Check size={14} strokeWidth={4} className="text-[#58977c]" />
                      ) : (
                        <div className="w-[7px] h-[7px] rounded-full bg-[#6db68c]"></div>
                      )}
                    </div>

                    <div className="hidden xl:flex absolute -left-[140px] top-[10px] -translate-y-1/2 z-20 items-center">

                      {/* Icon wrapper for the heartbeat wave */}
                      <div className="relative flex items-center justify-center">
                        {/* 3 Line Waves */}
                        <motion.div
                          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0 }}
                          className="absolute w-[50px] h-[50px] rounded-full border-[1.5px] border-[#58977c] z-0"
                        />
                        <motion.div
                          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.66 }}
                          className="absolute w-[50px] h-[50px] rounded-full border-[1.5px] border-[#58977c] z-0"
                        />
                        <motion.div
                          animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.33 }}
                          className="absolute w-[50px] h-[50px] rounded-full border-[1.5px] border-[#58977c] z-0"
                        />

                        {/* Main Icon */}
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
                          className="w-[50px] h-[50px] bg-white rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 flex items-center justify-center relative z-10"
                        >
                          {step === 'otp' ? (
                            <Mail size={22} strokeWidth={1.5} className="text-[#152c5b]" />
                          ) : (
                            <Smartphone size={22} strokeWidth={1.5} className="text-[#152c5b]" />
                          )}
                        </motion.div>
                      </div>

                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 70 }}
                        transition={{ duration: 0.5, delay: 0.4, ease: "easeInOut" }}
                        className="h-[2px] bg-[#58977c] relative z-0 origin-left"
                      ></motion.div>
                    </div>

                    <label className="block text-[#152c5b] text-[14px] font-medium tracking-wide">
                      {step === 'otp' ? 'OTP' : 'Authenticator Code'}
                    </label>
                    <input type="text" inputMode="numeric" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} required className={`${inputClass} tracking-[0.3em] font-bold text-base py-0.5`} autoFocus />

                    {step === 'otp' && (
                      <div className="flex justify-between items-center mt-1 w-full">
                        <button type="button" onClick={() => { setStep('credentials'); setOtpCode(''); setError(''); }} className="text-[11px] text-gray-400 hover:text-[#152c5b] font-medium transition-colors">
                          Back
                        </button>
                        <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0} className="text-[11px] text-[#58977c] hover:text-[#427b60] disabled:text-gray-300 font-semibold transition-colors">
                          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                        </button>
                      </div>
                    )}
                    {step === 'totp' && (
                      <div className="mt-1 w-full">
                        <button type="button" onClick={() => { setStep('credentials'); setOtpCode(''); setError(''); }} className="text-[11px] text-gray-400 hover:text-[#152c5b] font-medium transition-colors">
                          Back
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center mt-2 w-full pr-2">
                    <button type="submit" disabled={loading || otpCode.length < 6} className="bg-[#5a9c7d] hover:bg-[#4b886b] text-white px-8 py-1 rounded-full font-medium text-[13px] tracking-wide transition-colors disabled:opacity-70 flex items-center gap-2 shadow-sm">
                      {loading && <Loader2 size={13} className="animate-spin" />}
                      Verify
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
}
