import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginThunk, clearError } from '../redux/authSlice';
import { signupUser, fetchRtoAutocomplete, fetchIndustryAutocomplete, checkStudentEmailApi } from '../api/authApi';
import logo1 from '../assets/logo1.png';
import {
  Lock, Mail, Eye, EyeOff, ShieldCheck, ArrowRight,
  AlertCircle, Loader2, LayoutDashboard, Users, User, UserPlus, CheckCircle2, Building2,
  BookOpen, GraduationCap
} from 'lucide-react';

export default function LoginPage() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Coordinator');
  const [signupRtoName, setSignupRtoName] = useState('');
  const [rtoSuggestions, setRtoSuggestions] = useState([]);
  const [isSearchingRto, setIsSearchingRto] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [signupFacilityName, setSignupFacilityName] = useState('');
  const [industrySuggestions, setIndustrySuggestions] = useState([]);
  const [isSearchingIndustry, setIsSearchingIndustry] = useState(false);
  const [showIndustrySuggestions, setShowIndustrySuggestions] = useState(false);
  const [signupPhone, setSignupPhone] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');

  // Student specific registration & claiming state
  const [studentLookup, setStudentLookup] = useState({
    isChecking: false,
    foundInDatabase: false,
    isAlreadyUser: false,
    student: null,
    message: '',
  });
  const [signupCourse, setSignupCourse] = useState('');
  const [signupStudentRto, setSignupStudentRto] = useState('');
  const [isClaimedSuccess, setIsClaimedSuccess] = useState(false);

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

  // Debounced RTO autocomplete for signup (requires >= 3 chars and evaluates 50% name rule)
  useEffect(() => {
    if (signupRole !== 'RTO Manager') {
      setRtoSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const trimmed = signupRtoName.trim();
    if (trimmed.length < 3) {
      setRtoSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearchingRto(true);
        const list = await fetchRtoAutocomplete(trimmed, controller.signal);
        setRtoSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          setRtoSuggestions([]);
        }
      } finally {
        setIsSearchingRto(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [signupRtoName, signupRole]);

  // Debounced Industry autocomplete for signup (requires >= 3 chars and evaluates 50% name rule)
  useEffect(() => {
    if (signupRole !== 'Industry') {
      setIndustrySuggestions([]);
      setShowIndustrySuggestions(false);
      return;
    }

    const trimmed = signupFacilityName.trim();
    if (trimmed.length < 3) {
      setIndustrySuggestions([]);
      setShowIndustrySuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setIsSearchingIndustry(true);
        const list = await fetchIndustryAutocomplete(trimmed, controller.signal);
        setIndustrySuggestions(list);
        setShowIndustrySuggestions(list.length > 0);
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          setIndustrySuggestions([]);
        }
      } finally {
        setIsSearchingIndustry(false);
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [signupFacilityName, signupRole]);

  // Debounced Student email lookup for signup (detects pre-assigned vs new student)
  useEffect(() => {
    if (signupRole !== 'Student') {
      setStudentLookup({
        isChecking: false,
        foundInDatabase: false,
        isAlreadyUser: false,
        student: null,
        message: '',
      });
      return;
    }

    const trimmedEmail = signupEmail.trim();
    if (!trimmedEmail || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(trimmedEmail)) {
      setStudentLookup({
        isChecking: false,
        foundInDatabase: false,
        isAlreadyUser: false,
        student: null,
        message: '',
      });
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setStudentLookup((prev) => ({ ...prev, isChecking: true }));
        const res = await checkStudentEmailApi(trimmedEmail, controller.signal);
        if (res) {
          setStudentLookup({
            isChecking: false,
            foundInDatabase: !!res.foundInDatabase,
            isAlreadyUser: !!res.isAlreadyUser,
            student: res.student || null,
            message: res.message || '',
          });

          // Pre-populate name & phone if pre-enrolled student found
          if (res.foundInDatabase && res.student) {
            if (res.student.name && !signupName.trim()) {
              setSignupName(res.student.name);
            }
            if (res.student.phone && !signupPhone.trim()) {
              setSignupPhone(res.student.phone);
            }
          }
        }
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          setStudentLookup({
            isChecking: false,
            foundInDatabase: false,
            isAlreadyUser: false,
            student: null,
            message: '',
          });
        }
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [signupEmail, signupRole]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginThunk({ email, password }));
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setSignupError('');
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setSignupError('All fields are required.');
      return;
    }
    if (studentLookup.isAlreadyUser) {
      setSignupError('An account with this email is already registered. Please sign in.');
      return;
    }
    if (signupRole === 'RTO Manager' && !signupRtoName.trim()) {
      setSignupError('RTO / College Name is required for RTO Manager registration.');
      return;
    }
    if (signupRole === 'Industry' && !signupFacilityName.trim()) {
      setSignupError('Industry / Host Facility Name is required for Industry registration.');
      return;
    }
    try {
      setSignupLoading(true);
      const res = await signupUser({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword.trim(),
        role: signupRole,
        rtoName: signupRole === 'RTO Manager' ? signupRtoName.trim() : signupRole === 'Student' ? (studentLookup.student?.rtoName || signupStudentRto.trim()) : undefined,
        facilityName: signupRole === 'Industry' ? signupFacilityName.trim() : undefined,
        course: signupRole === 'Student' ? (studentLookup.student?.course || signupCourse.trim()) : undefined,
        phone: signupPhone.trim(),
      });
      setIsClaimedSuccess(!!(res?.data?.isPreExistingStudent || studentLookup.foundInDatabase));
      setSignupSuccess(true);
    } catch (err) {
      setSignupError(err?.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setSignupSuccess(false);
    setIsClaimedSuccess(false);
    setSignupError('');
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
          <div className="w-full max-w-[480px] bg-white rounded-[32px] border border-slate-100 shadow-2xl shadow-blue-900/10 p-8 lg:p-10 space-y-5 relative z-10">
            
            {/* Top Shield / User Icon Circle */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#0147A6] flex items-center justify-center shadow-xs">
                {isSignup ? <UserPlus className="w-8 h-8" /> : <Lock className="w-7 h-7" />}
              </div>
            </div>

            {/* Top Tab Switcher */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => { setIsSignup(false); setSignupSuccess(false); setSignupError(''); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                  !isSignup
                    ? 'bg-white text-[#0147A6] shadow-md shadow-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsSignup(true); setSignupSuccess(false); setSignupError(''); }}
                className={`flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isSignup
                    ? 'bg-[#0147A6] text-white shadow-md shadow-blue-900/20'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>New User Signup</span>
              </button>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center space-y-1 pb-1">
              <h2 className="text-2xl font-extrabold text-slate-900">
                {isSignup ? 'Create Portal Account' : 'Sign In to Portal'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isSignup
                  ? 'General registration for RTOs, Students, Coordinators & Industry Users'
                  : 'Enter your account email and password to access the portal'}
              </p>
            </div>

            {/* Error Alert */}
            {error && !isSignup && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{error}</span>
              </div>
            )}

            {/* Signup Error Alert */}
            {signupError && isSignup && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="font-semibold leading-relaxed">{signupError}</span>
              </div>
            )}

            {/* Signup Success Message */}
            {signupSuccess && isSignup && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex flex-col items-center text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <h4 className="text-base font-extrabold text-emerald-800">
                  {isClaimedSuccess ? 'Student Account Activated Successfully!' : 'Registration Submitted Successfully!'}
                </h4>
                <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                  {isClaimedSuccess ? (
                    <>Your student account has been claimed and activated. You can now log in immediately with your email and password to access your placement workflow and documents.</>
                  ) : (
                    <>Your signup request has been sent to the Administrator. Account status is currently <span className="font-extrabold underline">Pending</span>. You will be able to log in once Admin approves your account.</>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    toggleMode();
                    if (isClaimedSuccess && signupEmail) {
                      setEmail(signupEmail);
                    }
                  }}
                  className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-500 cursor-pointer mt-2"
                >
                  {isClaimedSuccess ? 'Sign In to Your Student Account' : 'Return to Sign In Screen'}
                </button>
              </div>
            )}

            {/* Signup Form */}
            {isSignup && !signupSuccess ? (
              <form onSubmit={handleSignupSubmit} className="space-y-3 text-xs">
                <div className={`rounded-xl p-2.5 text-[11px] font-semibold flex items-center gap-2 ${
                  signupRole === 'Student' && studentLookup.foundInDatabase
                    ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                    : 'bg-blue-50/70 border border-blue-200/80 text-blue-900'
                }`}>
                  {signupRole === 'Student' && studentLookup.foundInDatabase ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Pre-enrolled student found: Set password to activate your account immediately.</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>New registrations require Admin approval before log in.</span>
                    </>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                    {signupRole === 'Student' && studentLookup.isChecking && (
                      <span className="flex items-center gap-1 text-[10px] text-blue-600 font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" /> Checking student records...
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder={signupRole === 'Student' ? "Enter your enrolled student email address" : "e.g. sarah@organization.com"}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                    />
                  </div>

                  {/* Student email lookup status indicators */}
                  {signupRole === 'Student' && signupEmail.trim().length > 3 && (
                    <div className="pt-1">
                      {studentLookup.foundInDatabase && studentLookup.student && (
                        <div className="bg-emerald-50 border border-emerald-300/80 rounded-xl p-2.5 space-y-1 text-emerald-900">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Pre-Enrolled Student Profile Found!</span>
                          </div>
                          <p className="text-[11px] text-emerald-700">
                            <strong>{studentLookup.student.name}</strong> • {studentLookup.student.course} ({studentLookup.student.rtoName})
                          </p>
                          <p className="text-[10px] text-emerald-600 font-medium">
                            Set your password below to claim your account. Immediate activation without waiting!
                          </p>
                        </div>
                      )}

                      {!studentLookup.isChecking && !studentLookup.foundInDatabase && !studentLookup.isAlreadyUser && /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(signupEmail.trim()) && (
                        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 space-y-1 text-blue-900">
                          <div className="flex items-center gap-1.5 font-bold text-xs text-blue-800">
                            <UserPlus className="w-4 h-4 text-blue-600 shrink-0" />
                            <span>New Student Registration</span>
                          </div>
                          <p className="text-[11px] text-blue-700">
                            No pre-existing student record found. Complete the form to register as a new student applicant for Admin approval.
                          </p>
                        </div>
                      )}

                      {studentLookup.isAlreadyUser && (
                        <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-amber-900">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div className="text-[11px]">
                            <span className="font-bold block">Account Already Exists</span>
                            <span>This email is already registered. Please click <strong>Sign In</strong> above to log in.</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="password"
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Create a strong password"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">User Role / Account Type *</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-bold text-xs shadow-xs cursor-pointer"
                  >
                    <option value="Coordinator">Placement Coordinator</option>
                    <option value="RTO Manager">RTO (Registered Training Organisation)</option>
                    <option value="Student">Student</option>
                    <option value="Industry">Industry / Host Facility</option>
                  </select>
                </div>

                {signupRole === 'RTO Manager' && (
                  <div className="space-y-1 relative">
                    <label className="block text-xs font-bold text-slate-700">
                      RTO / College Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        required
                        value={signupRtoName}
                        onChange={(e) => {
                          setSignupRtoName(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => {
                          if (rtoSuggestions.length > 0) setShowSuggestions(true);
                        }}
                        placeholder="Search or enter RTO name..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                      />
                      {isSearchingRto && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        </div>
                      )}
                    </div>

                    {showSuggestions && rtoSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                        <div className="p-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 border-b border-slate-100 uppercase tracking-wider">
                          Suggested Registered Organizations
                        </div>
                        {rtoSuggestions.map((rto) => (
                          <button
                            key={rto._id}
                            type="button"
                            onClick={() => {
                              setSignupRtoName(rto.name);
                              setShowSuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between text-slate-800 transition"
                          >
                            <span className="font-semibold truncate">{rto.name}</span>
                            {rto.code && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono">
                                {rto.code}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {signupRole === 'Industry' && (
                  <div className="space-y-1 relative">
                    <label className="block text-xs font-bold text-slate-700">
                      Industry / Host Facility Name *
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        type="text"
                        required
                        value={signupFacilityName}
                        onChange={(e) => {
                          setSignupFacilityName(e.target.value);
                          setShowIndustrySuggestions(true);
                        }}
                        onFocus={() => {
                          if (industrySuggestions.length > 0) setShowIndustrySuggestions(true);
                        }}
                        placeholder="Search or enter facility name..."
                        className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                      />
                      {isSearchingIndustry && (
                        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />
                        </div>
                      )}
                    </div>

                    {showIndustrySuggestions && industrySuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                        <div className="p-1.5 text-[10px] font-bold text-slate-400 bg-slate-50 border-b border-slate-100 uppercase tracking-wider">
                          Suggested Partner Facilities
                        </div>
                        {industrySuggestions.map((ind) => (
                          <button
                            key={ind._id}
                            type="button"
                            onClick={() => {
                              setSignupFacilityName(ind.name);
                              setShowIndustrySuggestions(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 flex items-center justify-between text-slate-800 transition cursor-pointer"
                          >
                            <div className="truncate">
                              <span className="font-semibold">{ind.name}</span>
                              {ind.sector && (
                                <span className="ml-2 text-[10px] text-slate-400">({ind.sector})</span>
                              )}
                            </div>
                            {ind.code && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-mono shrink-0">
                                {ind.code}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {signupRole === 'Student' && !studentLookup.foundInDatabase && (
                  <>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Course / Qualification Program *</label>
                      <div className="relative">
                        <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          required
                          value={signupCourse}
                          onChange={(e) => setSignupCourse(e.target.value)}
                          placeholder="e.g. Diploma of Nursing / Cert III in Individual Support"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">College / RTO Name (Optional)</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                          type="text"
                          value={signupStudentRto}
                          onChange={(e) => setSignupStudentRto(e.target.value)}
                          placeholder="e.g. Sydney Health Institute"
                          className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">Phone Number (Optional)</label>
                  <input
                    type="text"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    placeholder="e.g. +61 400 000 000"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={signupLoading || studentLookup.isAlreadyUser}
                  className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-xs transition-all duration-500 flex items-center justify-center space-x-2 cursor-pointer mt-2 ${
                    signupRole === 'Student' && studentLookup.foundInDatabase
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center]'
                  }`}
                >
                  {signupLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{signupRole === 'Student' && studentLookup.foundInDatabase ? 'Activating Account...' : 'Submitting Request...'}</span>
                    </>
                  ) : (
                    <>
                      {signupRole === 'Student' && studentLookup.foundInDatabase ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Claim & Activate Student Account</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          <span>Submit Signup for Admin Approval</span>
                        </>
                      )}
                    </>
                  )}
                </button>
              </form>
            ) : !signupSuccess ? (
              /* Login Form */
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
                    placeholder="e.g. admin@mantisplacements.com"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-3.5 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
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
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-10 py-3 text-slate-900 placeholder-slate-400 outline-none focus:border-[#0147A6] focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-xs shadow-xs"
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

              {/* Remember me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#0147A6] border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-600 font-medium">Remember me</span>
                </label>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-sm rounded-xl shadow-xs transition-all duration-500 flex items-center justify-center space-x-2 cursor-pointer mt-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
            ) : null}

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
