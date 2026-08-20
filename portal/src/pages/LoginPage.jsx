import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk, clearError } from '../redux/authSlice';
import logo1 from '../assets/logo1.png';
import {
  Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight,
  AlertCircle, Loader2, LayoutDashboard, Users, User
} from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { isAuthenticated, loading, error } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginThunk({ email, password }));
  };

  const handleQuickFill = () => {
    setEmail('wasiq.shah@mantisplacements.com');
    setPassword('Admin@123');
    dispatch(clearError());
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f7fc] flex items-center justify-center p-4 sm:p-8 lg:p-12 font-sans relative overflow-hidden">
      
      {/* Top-Center-Right Overlapping Blue Circle Shape */}
      <div className="absolute top-0 left-1/3 sm:left-1/2 lg:left-[45%] -translate-y-1/3 w-80 h-80 sm:w-96 sm:h-96 bg-[#0070f3] rounded-full pointer-events-none opacity-90 z-0">
        <div className="absolute inset-0 bg-[#005ecb] rounded-full scale-90 translate-x-4 translate-y-4 opacity-40"></div>
      </div>

      {/* Bottom-Left Cyan Circle Shape */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#02AFA9] rounded-full pointer-events-none opacity-80 z-0">
        <div className="absolute inset-0 bg-[#0879a7] rounded-full scale-90 translate-x-4 -translate-y-4 opacity-50"></div>
      </div>

      {/* Vector Dot Matrix Grids */}
      <div className="absolute top-12 left-1/3 opacity-25 pointer-events-none z-0">
        <div className="grid grid-cols-6 gap-2.5">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-12 left-1/4 opacity-25 pointer-events-none z-0">
        <div className="grid grid-cols-6 gap-2.5">
          {[...Array(24)].map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
          ))}
        </div>
      </div>

      {/* Main Grid Wrapper */}
      <div className="w-full max-w-[1180px] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10 my-auto">
        
        {/* ================= LEFT HERO PANEL ================= */}
        <div className="lg:col-span-6 space-y-8 pr-0 lg:pr-8 py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img src={logo1} alt="Mantis Placements" className="h-14 object-contain" />
          </div>

          {/* Welcome Heading */}
          <div className="space-y-3">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Welcome Back, <br />
              <span className="text-[#0070f3]">Admin!</span>
            </h1>
            <p className="text-base text-slate-600 font-medium leading-relaxed max-w-md">
              Access your dashboard, manage placements, and support student success.
            </p>
          </div>

          {/* 3 Feature Items */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#eef6ff] text-[#0070f3] flex items-center justify-center shrink-0 border border-blue-100/60 shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Secure Access</h4>
                <p className="text-xs text-slate-500 font-normal">Your data is protected with enterprise-grade security.</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#eef6ff] text-[#0070f3] flex items-center justify-center shrink-0 border border-blue-100/60 shadow-xs">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Smart Dashboard</h4>
                <p className="text-xs text-slate-500 font-normal">Get real-time insights and important updates.</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-[#eef6ff] text-[#0070f3] flex items-center justify-center shrink-0 border border-blue-100/60 shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Better Placements</h4>
                <p className="text-xs text-slate-500 font-normal">Empowering students through meaningful opportunities.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FLOATING CARD PANEL ================= */}
        <div className="lg:col-span-6 flex flex-col items-center lg:items-end justify-center">
          
          {/* Floating White Card Matching Mockup */}
          <div className="w-full max-w-[460px] bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-blue-900/10 p-8 lg:p-10 space-y-5 relative z-10">
            
            {/* Top Shield Icon Circle */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-[#ebf5ff] text-[#0070f3] flex items-center justify-center shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1 pb-2">
              <h2 className="text-2xl font-extrabold text-slate-900">Admin Portal Access</h2>
              <p className="text-xs text-slate-500 font-normal">Sign in with your administrator credentials</p>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              
              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) dispatch(clearError());
                    }}
                    placeholder="admin@mantisplacements.com"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) dispatch(clearError());
                    }}
                    placeholder="••••••••••••"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0070f3] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#0070f3] border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("Password reset functionality: Please contact system administration.")}
                  className="text-xs font-semibold text-[#0070f3] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0070f3] hover:bg-[#005ecb] text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 cursor-pointer mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Bottom Security Note */}
            <div className="pt-2 text-center">
              <div className="inline-flex items-center space-x-1.5 text-xs text-slate-500 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Protected by Placements Security</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
