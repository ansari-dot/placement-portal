import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutThunk } from '../../redux/authSlice';
import logo1 from '../../assets/logo1.png';
import { Search, Bell, Settings, ChevronDown, ChevronRight, Menu, LogOut, User, HelpCircle, X, CheckCheck } from 'lucide-react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead
} from '../../api/notificationApi';

export default function Header({ title = 'Dashboard', breadcrumbs = [] }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dynamic Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();

  const profileRef = useRef(null);
  const notificationsRef = useRef(null);
  const settingsRef = useRef(null);

  // Fetch Live Notifications from MongoDB REST API
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetchNotifications();
      if (res.success && res.data) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount ?? res.data.filter(n => !n.isRead).length);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll notifications every 30 seconds for live background updates
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

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

  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      await dispatch(logoutThunk()).unwrap();
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/login');
  };

  // Mark all as read handler
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  // Click individual notification handler
  const handleNotificationClick = async (n) => {
    const nId = n.id || n._id;
    if (!n.isRead && nId) {
      try {
        await markNotificationRead(nId);
        setNotifications(prev => prev.map(item => (item.id === nId || item._id === nId) ? { ...item, isRead: true } : item));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark notification read:', err);
      }
    }
    setIsNotificationsOpen(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  // Color helper based on type
  const getTypeColor = (type) => {
    switch (type) {
      case 'appointment': return 'bg-emerald-500';
      case 'request': return 'bg-blue-500';
      case 'student': return 'bg-amber-500';
      case 'internship': return 'bg-teal-500';
      case 'job': return 'bg-purple-500';
      default: return 'bg-slate-400';
    }
  };

  // Time-ago formatting helper
  const getTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

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
            className="relative cursor-pointer text-slate-600 hover:text-slate-900 transition focus:outline-none p-1.5 rounded-lg hover:bg-slate-50"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsProfileOpen(false);
              setIsSettingsOpen(false);
              loadNotifications();
            }}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={handleMarkAllRead}
                    className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center space-x-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all as read</span>
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n, i) => {
                  const nId = n.id || n._id || i;
                  return (
                    <div 
                      key={nId} 
                      onClick={() => handleNotificationClick(n)}
                      className={`px-4 py-3 hover:bg-slate-50 transition cursor-pointer border-b border-slate-50 last:border-b-0 ${!n.isRead ? 'bg-blue-50/30 font-semibold' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getTypeColor(n.type)}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-[11px] font-bold text-slate-900 leading-tight">{n.title}</p>
                            {!n.isRead && (
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full shrink-0 ml-1"></span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{n.desc}</p>
                          <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                            {getTimeAgo(n.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {notifications.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No notifications right now.
                  </div>
                )}
              </div>

              <div className="px-4 py-2.5 border-t border-slate-100 text-center bg-slate-50/30">
                <Link to="/workflow" className="text-[10px] font-semibold text-blue-600 hover:underline">
                  View all in Workflow &rsaquo;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="relative hidden sm:block" ref={settingsRef}>
          <button
            className="cursor-pointer text-slate-600 hover:text-slate-900 transition focus:outline-none p-1.5 rounded-lg hover:bg-slate-50"
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
            className="flex items-center space-x-2.5 pl-3 border-l border-slate-200 focus:outline-none cursor-pointer"
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
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
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
             <div className="p-4 flex justify-center items-center">
               <img src={logo1} alt="Mantis Placements" className="w-36 h-12 object-contain" />
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