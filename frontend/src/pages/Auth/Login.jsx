import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';
import { Users, UserCircle, BarChart3, Folder, DollarSign, User } from 'lucide-react';
import loginBg from '../../assets/images/Login.png';

const nodes = [
  { id: 'leads', label: 'Leads', icon: Users, x: 15, y: 25 },
  { id: 'customers', label: 'Customers', icon: UserCircle, x: 8, y: 55 },
  { id: 'projects-left', label: 'Projects', icon: BarChart3, x: 20, y: 85 },
  { id: 'projects-right', label: 'Projects', icon: Folder, x: 85, y: 25 },
  { id: 'finance', label: 'Finance', icon: DollarSign, x: 92, y: 55 },
  { id: 'hr', label: 'HR', icon: User, x: 85, y: 85 },
];

const extraPoints = {
  'center': { x: 50, y: 50 },
  'l1': { x: 28, y: 40 },
  'l2': { x: 26, y: 65 },
  'l3': { x: 35, y: 18 },
  'l4': { x: 32, y: 85 },
  'r1': { x: 72, y: 40 },
  'r2': { x: 74, y: 65 },
  'r3': { x: 65, y: 18 },
  'r4': { x: 68, y: 85 },
};

const getPoint = (id) => {
  const node = nodes.find(n => n.id === id);
  if (node) return { x: node.x, y: node.y };
  return extraPoints[id];
};

const connections = [
  // Direct to center
  ['leads', 'center'], ['customers', 'center'], ['projects-left', 'center'],
  ['projects-right', 'center'], ['finance', 'center'], ['hr', 'center'],
  
  // Outer ring
  ['leads', 'customers'], ['customers', 'projects-left'],
  ['projects-right', 'finance'], ['finance', 'hr'],
  
  // Inner web - Left
  ['leads', 'l1'], ['customers', 'l1'], ['customers', 'l2'], ['projects-left', 'l2'],
  ['l1', 'l2'], ['l1', 'center'], ['l2', 'center'],
  ['leads', 'l3'], ['l1', 'l3'], ['l3', 'center'],
  ['projects-left', 'l4'], ['l2', 'l4'], ['l4', 'center'],
  
  // Inner web - Right
  ['projects-right', 'r1'], ['finance', 'r1'], ['finance', 'r2'], ['hr', 'r2'],
  ['r1', 'r2'], ['r1', 'center'], ['r2', 'center'],
  ['projects-right', 'r3'], ['r1', 'r3'], ['r3', 'center'],
  ['hr', 'r4'], ['r2', 'r4'], ['r4', 'center'],
  
  // Cross bridges
  ['l3', 'r3'], ['l4', 'r4'],
];

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
    <div 
      className="min-h-screen relative overflow-hidden bg-cover bg-center flex items-center justify-center font-sans"
      style={{ backgroundImage: `url(${loginBg})` }}
    >






      {/* Central Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[440px] bg-[#1c1c24]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white leading-tight mb-2 tracking-tight">
            A365Shift<br />AI-Business CRM
          </h1>
          <p className="text-slate-300 text-sm">
            Managing leads and projects smarter.
          </p>
        </div>

        {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-100 text-sm text-center font-medium">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-sm font-medium ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-sm font-medium ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
            />
          </div>

          {/* Options */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center space-x-2 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input
                  type="checkbox"
                  className="peer appearance-none w-5 h-5 border border-white/20 rounded bg-white/5 checked:bg-blue-500 checked:border-blue-500 transition-colors cursor-pointer"
                  defaultChecked
                />
                <svg
                  className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                Remember Me
              </span>
            </label>
            <Link to="/forgot-password" className="text-slate-300 text-sm hover:text-white transition-colors">
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-3/4 mx-auto block mt-6  text-white font-medium py-2.5 text-sm  transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
