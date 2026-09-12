import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { 
  Users, ShieldCheck, GraduationCap, Building2, UserCheck, 
  Search, RefreshCw, Clock, Wifi, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { fetchPresence } from '../../api/authApi';
import { formatLastSeen, LivePresenceBadge } from '../../utils/presenceUtils';

export default function LivePresenceHub() {
  const authUser = useSelector((state) => state.auth?.user);
  const [presenceData, setPresenceData] = useState({
    summary: {
      totalOnline: 1,
      adminsOnline: 1,
      coordinatorsOnline: 1,
      studentsOnline: 0,
      rtosOnline: 0,
      staffOnline: 0,
    },
    users: [],
    students: [],
    rtos: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'coordinators' | 'students' | 'rtos' | 'admins'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'online' | 'offline'

  const loadPresence = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetchPresence();
      if (res.success && res.summary) {
        setPresenceData(res);
      }
    } catch (err) {
      console.error('Failed to load presence:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPresence();
    // Poll presence every 20 seconds for real-time online/offline updates
    const interval = setInterval(loadPresence, 20000);
    return () => clearInterval(interval);
  }, [loadPresence]);

  const userName = authUser?.name || 'Wasiq Shah';
  const userRole = authUser?.role || 'Administrator';
  const userDept = authUser?.department || 'Administration & Operations';
  const userAvatar = authUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';

  // Consolidate list based on active tab
  const getDisplayItems = () => {
    let items = [];

    if (activeTab === 'all' || activeTab === 'admins' || activeTab === 'coordinators') {
      const userList = presenceData.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        type: u.role,
        roleCategory: u.role,
        department: u.department || 'Operations',
        avatar: u.avatar,
        isOnline: u.isOnline,
        lastSeen: u.lastSeen || u.lastActive,
      }));

      if (activeTab === 'admins') {
        items = userList.filter(u => u.roleCategory === 'Administrator');
      } else if (activeTab === 'coordinators') {
        items = userList.filter(u => u.roleCategory === 'Coordinator');
      } else {
        items = [...userList];
      }
    }

    if (activeTab === 'all' || activeTab === 'students') {
      const studentList = presenceData.students.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        type: 'Student',
        roleCategory: 'Student',
        department: s.course ? `${s.course} (${s.rto || 'General'})` : (s.rto || 'Enrolled Student'),
        avatar: s.avatar,
        isOnline: s.isOnline,
        lastSeen: s.lastSeen || s.lastActive,
      }));
      items = activeTab === 'students' ? studentList : [...items, ...studentList];
    }

    if (activeTab === 'all' || activeTab === 'rtos') {
      const rtoList = presenceData.rtos.map(r => ({
        id: r.id,
        name: r.name,
        email: r.contactEmail || r.code,
        type: 'RTO Partner',
        roleCategory: 'RTO Manager',
        department: r.contactName ? `Contact: ${r.contactName} (${r.loc || 'Australia'})` : (r.loc || 'Registered Provider'),
        avatar: r.logo,
        isOnline: r.isOnline,
        lastSeen: r.lastSeen || r.lastActive,
      }));
      items = activeTab === 'rtos' ? rtoList : [...items, ...rtoList];
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        i =>
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.email && i.email.toLowerCase().includes(q)) ||
          (i.department && i.department.toLowerCase().includes(q))
      );
    }

    // Apply online/offline status filter
    if (statusFilter === 'online') {
      items = items.filter(i => i.isOnline);
    } else if (statusFilter === 'offline') {
      items = items.filter(i => !i.isOnline);
    }

    return items;
  };

  const displayItems = getDisplayItems();

  return (
    <div className="space-y-4 font-sans">
      {/* 1. Personalized User Live Status Banner (For Every User Dashboard) */}
      <div className="bg-gradient-to-r from-[#01357A] via-[#0147A6] to-[#0274B3] rounded-2xl p-4 sm:p-5 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 z-10">
          <div className="relative">
            <img
              src={userAvatar}
              alt={userName}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-white/30 shadow-md"
            />
            <span
              className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-white animate-pulse"
              title="Online Active"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-white tracking-tight">{userName}</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold text-white uppercase tracking-wider">
                {userRole}
              </span>
            </div>
            <p className="text-xs text-white/80 font-medium mt-0.5">{userDept}</p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 flex items-center space-x-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <div className="text-left">
              <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Your Live Status</p>
              <p className="text-xs font-bold text-emerald-300">Online • Active Session</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 flex items-center space-x-2">
            <Clock size={15} className="text-white/70" />
            <div className="text-left">
              <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Last Activity</p>
              <p className="text-xs font-bold text-white">Just now (Synced)</p>
            </div>
          </div>
        </div>

        {/* Subtle decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
      </div>

      {/* 2. Executive Live Presence Hub (Visible for Super Admin / Administration & Management) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Wifi size={16} className="text-blue-600 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Live User Presence & Online Activity Hub
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>{presenceData.summary.totalOnline} Online Now</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Real-time monitoring of Students, Coordinators, Super Admin, and RTO Partners currently active on the portal.
            </p>
          </div>

          <button
            onClick={loadPresence}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer self-start sm:self-auto"
            title="Refresh Live Presence"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : 'text-slate-500'} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Summary Counter Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
              <UserCheck size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Total Online</p>
              <p className="text-base font-extrabold text-emerald-900">{presenceData.summary.totalOnline}</p>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Students Online</p>
              <p className="text-base font-extrabold text-blue-900">{presenceData.summary.studentsOnline}</p>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              <Users size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wide">Coordinators</p>
              <p className="text-base font-extrabold text-indigo-900">{presenceData.summary.coordinatorsOnline}</p>
            </div>
          </div>

          <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
              <Building2 size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-teal-700 uppercase tracking-wide">RTOs Online</p>
              <p className="text-base font-extrabold text-teal-900">{presenceData.summary.rtosOnline}</p>
            </div>
          </div>

          <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
              <ShieldCheck size={16} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Admins Online</p>
              <p className="text-base font-extrabold text-purple-900">{presenceData.summary.adminsOnline}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
          {/* Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Users' },
              { id: 'students', label: 'Students' },
              { id: 'coordinators', label: 'Coordinators' },
              { id: 'rtos', label: 'RTO Partners' },
              { id: 'admins', label: 'Super Admin' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#0147A6] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search and Status Dropdown */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, email..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-44 sm:w-56"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="online">Online Only</option>
              <option value="offline">Offline Only</option>
            </select>
          </div>
        </div>

        {/* Live Presence Table / Grid */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                <th className="py-2.5 px-3.5">User / Entity</th>
                <th className="py-2.5 px-3.5">Category & Role</th>
                <th className="py-2.5 px-3.5">Institution / Department</th>
                <th className="py-2.5 px-3.5">Live Presence</th>
                <th className="py-2.5 px-3.5 text-right">Last Seen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {displayItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic text-xs">
                    No active users or records found matching current filters.
                  </td>
                </tr>
              ) : (
                displayItems.map((item, idx) => {
                  const initials = (item.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

                  return (
                    <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center space-x-2.5">
                          <div className="relative shrink-0">
                            {item.avatar ? (
                              <img
                                src={item.avatar}
                                alt={item.name}
                                className="w-8 h-8 rounded-xl object-cover ring-1 ring-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center">
                                {initials}
                              </div>
                            )}
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-2 ring-white ${
                                item.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                              }`}
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                            <span className="text-[11px] text-slate-400 block truncate">{item.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block ${
                          item.roleCategory === 'Administrator' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          item.roleCategory === 'Coordinator' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          item.roleCategory === 'Student' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          item.roleCategory === 'RTO Manager' ? 'bg-teal-50 text-teal-700 border-teal-200' :
                          'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {item.type}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-600 max-w-[200px] truncate">
                        {item.department || '-'}
                      </td>

                      <td className="py-2.5 px-3.5">
                        <LivePresenceBadge isOnline={item.isOnline} lastSeen={item.lastSeen} size="xs" pulse={true} />
                      </td>

                      <td className="py-2.5 px-3.5 text-right font-medium text-slate-500 text-[11px]">
                        {formatLastSeen(item.lastSeen, item.isOnline)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
