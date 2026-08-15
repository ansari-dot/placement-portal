import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Settings, ChevronDown, ChevronRight, Menu, LogOut, User, HelpCircle, X } from 'lucide-react';

export default function Header({ title = 'Dashboard', breadcrumbs = [] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const settingsRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setIsNotificationsOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setIsSettingsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/my-students?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    // Clear any session data
    localStorage.removeItem('portal_user');
    navigate('/');
  };

  const notifications = [
    { id: 1, title: 'New internship request', desc: 'John Smith applied for Software Developer Intern', time: '2 min ago', color: 'bg-blue-500' },
    { id: 2, title: 'Appointment scheduled', desc: 'Aisha Khan - Wed 21 May, 11:00 AM', time: '1 hr ago', color: 'bg-emerald-500' },
    { id: 3, title: 'New student added', desc: 'Priya Sharma was added to your list', time: '3 hrs ago', color: 'bg-amber-500' },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center space-x-3">
        {/* Mobile Menu Button */}
        <button
          className="lg:hidden text-slate-600 focus:outline-none hover:text-slate-900 transition"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div>
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 mt-0.5">
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-2.5 h-2.5 text-slate-400" />}
                  {index === 0 ? (
                    <Link to="/" className="hover:text-blue-600 transition">{crumb}</Link>
                  ) : (
                    <span className={index === breadcrumbs.length - 1 ? 'text-slate-800 font-medium' : ''}>
                      {crumb}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative hidden md:block w-64">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          <Search className="w-3.5 h-3.5 text-slate-400" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search students, requests, RTOs, industries..."
          className="w-full bg-slate-50 text-[11px] text-slate-800 placeholder-slate-400 pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
        />
      </form>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        {/* Notification bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            className="relative cursor-pointer text-slate-600 hover:text-slate-900 transition focus:outline-none"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
              setIsSettingsOpen(false);
            }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[9px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center ring-2 ring-white">
              {notifications.length}
            </span>
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                <span className="text-[10px] font-semibold text-blue-600 cursor-pointer hover:underline">Mark all as read</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition cursor-pointer border-b border-slate-50 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.color}`} />
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900">{n.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">{n.desc}</p>
                        <span className="text-[9px] text-slate-400 font-medium">{n.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5 border-t border-slate-100 text-center">
                <Link to="/workflow" className="text-[10px] font-semibold text-blue-600 hover:underline">View all notifications</Link>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative hidden sm:block" ref={settingsRef}>
          <button
            className="cursor-pointer text-slate-600 hover:text-slate-900 transition focus:outline-none"
            onClick={() => {
              setIsSettingsOpen(!isSettingsOpen);
              setIsProfileOpen(false);
              setIsNotificationsOpen(false);
            }}
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Settings Dropdown */}
          {isSettingsOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
              <div className="py-1">
                <Link to="/" className="flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>General Settings</span>
                </Link>
                <Link to="/" className="flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile Settings</span>
                </Link>
                <Link to="/" className="flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Help & Support</span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileRef}>
          <button
            className="flex items-center space-x-2.5 pl-3 border-l border-slate-200 focus:outline-none"
            onClick={() => {
              setIsProfileOpen(!isProfileOpen);
              setIsNotificationsOpen(false);
              setIsSettingsOpen(false);
            }}
            aria-label="User profile"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"
              alt="Wasiq Shah"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
            />
            <div className="hidden sm:block text-left">
              <h4 className="text-[11px] font-bold text-slate-900 leading-tight">Wasiq Shah</h4>
              <span className="text-[10px] text-slate-500 font-medium">Administrator</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 hidden sm:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-xs font-bold text-slate-900">Wasiq Shah</h4>
                <span className="text-[10px] text-slate-500 font-medium">Administrator</span>
              </div>
              <div className="py-1">
                <Link to="/" className="flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </Link>
                <Link to="/" className="flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition">
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account Settings</span>
                </Link>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-52 bg-gradient-to-b from-[#0751a3] via-[#0879a7] to-[#05b5a8] shadow-xl">
            <div className="p-3.5 flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-gradient-to-tr from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                M
              </div>
              <div className="min-w-0">
                <h1 className="text-white font-bold tracking-wider text-xs leading-tight">MANTIS</h1>
                <span className="text-[7px] text-cyan-400 tracking-widest uppercase font-semibold">PLACEMENTS</span>
              </div>
            </div>
            <nav className="px-3 py-2 space-y-1">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} className="block px-2.5 py-1.5 rounded-md text-[10px] text-white/75 hover:bg-white/10 hover:text-white transition">Dashboard</Link>
              <Link to="/my-students" onClick={() => setIsMobileMenuOpen(false)} className="block px-2.5 py-1.5 rounded-md text-[10px] text-white/75 hover:bg-white/10 hover:text-white transition">My Students</Link>
              <Link to="/add-student" onClick={() => setIsMobileMenuOpen(false)} className="block px-2.5 py-1.5 rounded-md text-[10px] text-white/75 hover:bg-white/10 hover:text-white transition">Add New Student</Link>
              <Link to="/workflow" onClick={() => setIsMobileMenuOpen(false)} className="block px-2.5 py-1.5 rounded-md text-[10px] text-white/75 hover:bg-white/10 hover:text-white transition">Workflow</Link>
              <Link to="/rto" onClick={() => setIsMobileMenuOpen(false)} className="block px-2.5 py-1.5 rounded-md text-[10px] text-white/75 hover:bg-white/10 hover:text-white transition">RTOs</Link>
              <Link to="/industry" onClick={() => setIsMobileMenuOpen(false)} className="block px-2.5 py-1.5 rounded-md text-[10px] text-white/75 hover:bg-white/10 hover:text-white transition">Industries</Link>
              <Link to="/jobs" onClick={() => setIsMobileMenuOpen(false)} className="block px-2.5 py-1.5 rounded-md text-[10px] text-white/75 hover:bg-white/10 hover:text-white transition">Jobs</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}