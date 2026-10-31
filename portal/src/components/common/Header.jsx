import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logoutThunk } from '../../redux/authSlice';
import logo1 from '../../assets/logo1.png';
import {
  Search, Bell, Settings, ChevronDown, ChevronRight, Menu, LogOut, User,
  HelpCircle, X, CheckCheck, Plus, Send, Users,
  GraduationCap, ClipboardList, Calendar, Briefcase, CreditCard, School, Building2, Loader2
} from 'lucide-react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  createNotification
} from '../../api/notificationApi';
import { globalSearch } from '../../api/searchApi';
import ProfileSettingsModal from '../modals/ProfileSettingsModal';
import HelpSupportModal from '../modals/HelpSupportModal';
import GeneralSettingsModal from '../modals/GeneralSettingsModal';

export default function Header({ title = 'Dashboard', breadcrumbs = [] }) {
  const authUser = useSelector((state) => state.auth?.user);
  const isAdmin = authUser?.role === 'Administrator' || authUser?.role === 'Admin';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Global Live Search State
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef(null);
  const searchDebounceRef = useRef(null);

  // Dynamic Notifications State
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Admin Notification Composer Modal State
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [composeTitle, setComposeTitle] = useState('');
  const [composeDesc, setComposeDesc] = useState('');
  const [composeTargetRole, setComposeTargetRole] = useState('All');
  const [composeType, setComposeType] = useState('system');
  const [composeLink, setComposeLink] = useState('');
  const [sendSuccessMsg, setSendSuccessMsg] = useState('');


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
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced live global search
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults(null);
      setIsSearching(false);
      setIsSearchOpen(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await globalSearch(q);
        if (res && res.data) {
          setSearchResults(res.data);
          setIsSearchOpen(true);
        }
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  const handleSelectResult = (path) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setIsSearchOpen(false);

    const currentPath = window.location.pathname;
    if (currentPath.includes('/workflow')) {
      const sp = new URLSearchParams(window.location.search);
      const step = sp.get('step') || '1';
      navigate(`/workflow?step=${step}&search=${encodeURIComponent(q)}`);
    } else if (currentPath.includes('/my-students')) {
      navigate(`/my-students?search=${encodeURIComponent(q)}`);
    } else if (currentPath.includes('/students')) {
      navigate(`/students?search=${encodeURIComponent(q)}`);
    } else {
      navigate(isAdmin ? `/workflow?step=1&search=${encodeURIComponent(q)}` : `/my-students?search=${encodeURIComponent(q)}`);
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

  // Admin Broadcast / Targeted Notification Send Handler
  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!composeTitle.trim() || !composeDesc.trim()) return;

    setIsSending(true);
    setSendSuccessMsg('');
    try {
      let targetRoles = [];
      if (composeTargetRole === 'All') {
        targetRoles = ['All'];
      } else if (composeTargetRole === 'Student') {
        targetRoles = ['Student'];
      } else if (composeTargetRole === 'Industry') {
        targetRoles = ['Industry', 'Industry/Host'];
      } else if (composeTargetRole === 'RTO') {
        targetRoles = ['RTO', 'RTO Manager'];
      } else if (composeTargetRole === 'Coordinator') {
        targetRoles = ['Coordinator', 'Placement Coordinator', 'Staff'];
      } else if (composeTargetRole === 'Admin') {
        targetRoles = ['Administrator', 'Admin'];
      }

      await createNotification({
        title: composeTitle.trim(),
        desc: composeDesc.trim(),
        type: composeType,
        link: composeLink.trim(),
        targetRoles,
        targetRole: composeTargetRole,
      });

      setSendSuccessMsg(`Notification sent to ${composeTargetRole} successfully!`);
      setComposeTitle('');
      setComposeDesc('');
      setComposeLink('');
      await loadNotifications();
      setTimeout(() => {
        setIsSendModalOpen(false);
        setSendSuccessMsg('');
      }, 1400);
    } catch (err) {
      console.error('Failed to create notification:', err);
      alert('Failed to send notification: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSending(false);
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

      {/* Live Global Search Bar */}
      <div ref={searchContainerRef} className="relative hidden md:block w-72 lg:w-96">
        <form onSubmit={handleSearch} className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 text-slate-400" />
            )}
          </span>
          <input
            type="text"
            value={searchQuery}
            onFocus={() => {
              if (searchResults && searchQuery.trim()) setIsSearchOpen(true);
            }}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students, requests, RTOs, industries..."
            className="w-full bg-slate-50 text-[11px] text-slate-800 placeholder-slate-400 pl-9 pr-8 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
                setIsSearchOpen(false);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </form>

        {/* Global Live Search Results Dropdown */}
        {isSearchOpen && searchResults && (
          <div className="absolute left-0 mt-2 w-[420px] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden max-h-[480px] overflow-y-auto divide-y divide-slate-100">
            {/* Header info */}
            <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500 font-medium">
              <span>Quick Search Results for "{searchQuery}"</span>
              <span className="text-[10px] text-blue-600 font-semibold">Press Enter to filter</span>
            </div>

            {/* Students */}
            {searchResults.students?.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Students ({searchResults.students.length})</span>
                </div>
                {searchResults.students.map((s) => (
                  <button
                    key={s.id || s.studentId}
                    type="button"
                    onClick={() => handleSelectResult(isAdmin ? `/workflow?step=1&search=${encodeURIComponent(s.name || s.studentId)}` : `/my-students?search=${encodeURIComponent(s.name || s.studentId)}`)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">{s.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{s.studentId} · {s.rto || s.course || 'RTO Student'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-blue-50 text-blue-700 border-blue-200">
                      {s.placementStatus}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Placement Requests */}
            {searchResults.requests?.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Requests ({searchResults.requests.length})</span>
                </div>
                {searchResults.requests.map((r) => (
                  <button
                    key={r.id || r.reqId}
                    type="button"
                    onClick={() => handleSelectResult(`/workflow?step=2&search=${encodeURIComponent(r.reqId || r.student)}`)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600">{r.reqId}: {r.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{r.student} · {r.company || 'Pending'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-indigo-50 text-indigo-700 border-indigo-200">
                      {r.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Appointments */}
            {searchResults.appointments?.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>Appointments ({searchResults.appointments.length})</span>
                </div>
                {searchResults.appointments.map((a) => (
                  <button
                    key={a.id || a.apptId}
                    type="button"
                    onClick={() => handleSelectResult(`/workflow?step=3&search=${encodeURIComponent(a.apptId || a.student)}`)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-amber-600">{a.student}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{a.apptId} · {a.company || 'Appointment'}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-amber-50 text-amber-700 border-amber-200">
                      {a.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Placements */}
            {searchResults.placements?.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                  <span>Placements ({searchResults.placements.length})</span>
                </div>
                {searchResults.placements.map((i) => (
                  <button
                    key={i.id || i.intId}
                    type="button"
                    onClick={() => handleSelectResult(`/workflow?step=4&search=${encodeURIComponent(i.intId || i.student)}`)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-purple-600">{i.intId}: {i.student}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{i.company || 'Facility'} · {i.title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-purple-50 text-purple-700 border-purple-200">
                      {i.status}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Payments */}
            {searchResults.payments?.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Payments ({searchResults.payments.length})</span>
                </div>
                {searchResults.payments.map((p) => (
                  <button
                    key={p._id || p.id}
                    type="button"
                    onClick={() => handleSelectResult(`/workflow?step=5&search=${encodeURIComponent(p.studentName || p.studentId)}`)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600">{p.studentName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{p.studentId} · {p.rto || 'RTO'} · ${p.totalAmount || p.paymentAmount || 0}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-emerald-50 text-emerald-700 border-emerald-200">
                      {p.placementStatus || p.paymentStatus}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* RTOs */}
            {searchResults.rtos?.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <School className="w-3.5 h-3.5 text-sky-600" />
                  <span>RTOs ({searchResults.rtos.length})</span>
                </div>
                {searchResults.rtos.map((rto) => (
                  <button
                    key={rto._id || rto.code}
                    type="button"
                    onClick={() => handleSelectResult('/rtos')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-sky-600">{rto.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Code: {rto.code || 'N/A'} · {rto.contactName || rto.email || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Industries */}
            {searchResults.industries?.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Building2 className="w-3.5 h-3.5 text-teal-600" />
                  <span>Industries ({searchResults.industries.length})</span>
                </div>
                {searchResults.industries.map((ind) => (
                  <button
                    key={ind._id}
                    type="button"
                    onClick={() => handleSelectResult('/industries')}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center justify-between transition group cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-900 group-hover:text-teal-600">{ind.companyName || ind.organizationName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{ind.industryType || 'Host Facility'} · {ind.contactPerson || ind.email || ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {(!searchResults.students?.length &&
              !searchResults.requests?.length &&
              !searchResults.appointments?.length &&
              !searchResults.placements?.length &&
              !searchResults.payments?.length &&
              !searchResults.rtos?.length &&
              !searchResults.industries?.length) && (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching results found for <span className="font-semibold text-slate-700">"{searchQuery}"</span>
              </div>
            )}
          </div>
        )}
      </div>

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
            <div className="absolute right-0 mt-2 w-84 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-slate-900">Notifications</h4>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-bold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsNotificationsOpen(false);
                        setIsSendModalOpen(true);
                      }}
                      className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold rounded flex items-center space-x-1 shadow-sm transition"
                      title="Send role-specific notification"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Send</span>
                    </button>
                  )}
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-semibold text-blue-600 hover:underline flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.map((n, i) => {
                  const nId = n.id || n._id || i;
                  const targetLabel = n.targetRoles?.length > 0 ? n.targetRoles.join(', ') : n.targetRole;
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
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-[9px] text-slate-400 font-medium">
                              {getTimeAgo(n.createdAt)}
                            </span>
                            {isAdmin && targetLabel && (
                              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                                To: {targetLabel}
                              </span>
                            )}
                          </div>
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
                <button
                  type="button"
                  onClick={() => {
                    setIsGeneralSettingsOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>General Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Profile Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsHelpModalOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Help & Support</span>
                </button>
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
            <div className="relative">
              <img
                src={authUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"}
                alt={authUser?.name || "Wasiq Shah"}
                className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100"
              />
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse"
                title="Status: Online"
              />
            </div>
            <div className="hidden sm:block text-left">
              <div className="flex items-center space-x-1.5">
                <h4 className="text-[11px] font-bold text-slate-900 leading-tight">{authUser?.name || "Wasiq Shah"}</h4>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="flex items-center space-x-1">
                <span className="text-[10px] text-slate-500 font-medium">{authUser?.role || "Administrator"}</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">Online</span>
              </div>
            </div>
            <ChevronDown size={14} className={`text-slate-400 hidden sm:block transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">{authUser?.name || "Wasiq Shah"}</h4>
                  <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Online now</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">{authUser?.role || "Administrator"} • {authUser?.department || "Administration"}</p>
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400">
                  <span>Presence Status:</span>
                  <span className="font-bold text-emerald-600">Active Session</span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Last Seen:</span>
                  <span className="font-semibold text-slate-600">Active now</span>
                </div>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setIsProfileOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    if (isAdmin) {
                      navigate('/users');
                    } else {
                      setIsProfileModalOpen(true);
                    }
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-2.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer text-left"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAdmin ? 'Account & User Settings' : 'Account Settings'}</span>
                </button>
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

      {/* Admin Send Role-Based Notification Modal */}
      {isSendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Send Role Notification</h3>
                  <p className="text-[10px] text-slate-500">Only selected user roles will see this notification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSendModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white/60 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sendSuccessMsg && (
              <div className="m-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-medium flex items-center space-x-2">
                <CheckCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{sendSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSendNotification} className="p-5 space-y-4">
              {/* Target Role Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target Audience (Role)
                </label>
                <select
                  value={composeTargetRole}
                  onChange={(e) => setComposeTargetRole(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  <option value="All">🌐 All Users (Public Broadcast)</option>
                  <option value="Student">🎓 Students Only</option>
                  <option value="Industry">🏢 Industry / Host Employers Only</option>
                  <option value="RTO">🏛️ RTO Managers Only</option>
                  <option value="Coordinator">📋 Placement Coordinators Only</option>
                  <option value="Admin">🔒 Administrators Only</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  {composeTargetRole === 'All'
                    ? 'Everyone across the platform will see this notice.'
                    : `Only users with the "${composeTargetRole}" role will see this notification.`}
                </p>
              </div>

              {/* Notification Type & Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Type
                  </label>
                  <select
                    value={composeType}
                    onChange={(e) => setComposeType(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="system">System Notice</option>
                    <option value="student">Student Alert</option>
                    <option value="internship">Internship</option>
                    <option value="appointment">Appointment</option>
                    <option value="job">Job Update</option>
                    <option value="request">Placement Request</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Portal Link (Optional)
                  </label>
                  <input
                    type="text"
                    value={composeLink}
                    onChange={(e) => setComposeLink(e.target.value)}
                    placeholder="e.g. /workflow or /my-students"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Notification Title *
                </label>
                <input
                  type="text"
                  required
                  value={composeTitle}
                  onChange={(e) => setComposeTitle(e.target.value)}
                  placeholder="e.g. Mandatory Placement Orientation"
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Message / Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={composeDesc}
                  onChange={(e) => setComposeDesc(e.target.value)}
                  placeholder="Enter details of the notification here..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSendModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending || !composeTitle.trim() || !composeDesc.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Send Notification'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Settings Modal */}
      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Help & Support Modal */}
      <HelpSupportModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />

      {/* General Settings Modal */}
      <GeneralSettingsModal
        isOpen={isGeneralSettingsOpen}
        onClose={() => setIsGeneralSettingsOpen(false)}
      />
    </header>
  );
}