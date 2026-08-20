import React, { useState, useMemo } from 'react';
import {
  Users, Search, ChevronDown, Filter, Plus, Trash2, X,
  ShieldCheck, UserCheck, UserX, Building2, Mail, Phone,
  Calendar, CheckCircle2, Clock, MoreVertical, Edit2
} from 'lucide-react';

// ==========================================
// 1. METRICS OVERVIEW CARDS
// ==========================================
function MetricsCards({ stats }) {
  return (
    <div className="grid grid-cols-4 gap-5">
      {/* Total Users */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats?.totalUsers ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-blue-600">
          <span>System Accounts</span>
        </div>
      </div>

      {/* Active Users */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Users</span>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats?.activeUsers ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <UserCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-emerald-600">
          <CheckCircle2 className="w-4 h-4" />
          <span>Active Status</span>
        </div>
      </div>

      {/* Administrators */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Administrators</span>
            <h3 className="text-3xl font-extrabold text-slate-900">{stats?.adminUsers ?? 0}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-purple-600">
          <span>Full Access</span>
        </div>
      </div>

      {/* Coordinators & Staff */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Coordinators & Staff</span>
            <h3 className="text-3xl font-extrabold text-slate-900">{(stats?.coordinatorUsers ?? 0) + (stats?.staffUsers ?? 0)}</h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-amber-600">
          <span>Operations Personnel</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. FILTER CONTROLS COMPONENT
// ==========================================
function FilterControls({ users = [], onApplyFilters }) {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('All');
  const [status, setStatus] = useState('All');
  const [department, setDepartment] = useState('All');

  const departments = useMemo(() => {
    const set = new Set(users.map(u => u.department).filter(Boolean));
    return Array.from(set);
  }, [users]);

  const handleApply = () => {
    if (onApplyFilters) {
      onApplyFilters({
        search: search.trim() || undefined,
        role: role !== 'All' ? role : undefined,
        status: status !== 'All' ? status : undefined,
        department: department !== 'All' ? department : undefined,
      });
    }
  };

  const handleReset = () => {
    setSearch('');
    setRole('All');
    setStatus('All');
    setDepartment('All');
    if (onApplyFilters) {
      onApplyFilters({});
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {/* Search */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Search Users</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email..."
              className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-3.5 py-2 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs"
            />
          </div>
        </div>

        {/* Role Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">User Role</label>
          <div className="relative">
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Administrator">Administrator</option>
              <option value="Coordinator">Coordinator</option>
              <option value="RTO Manager">RTO Manager</option>
              <option value="Staff">Staff</option>
              <option value="Student">Student</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Status Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Status</label>
          <div className="relative">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Department Select */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">Department</label>
          <div className="relative">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3.5 py-2 pr-10 text-sm text-slate-700 outline-none focus:border-indigo-500 shadow-xs cursor-pointer"
            >
              <option value="All">All Departments</option>
              {departments.map((dept, i) => (
                <option key={i} value={dept}>{dept}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm rounded-lg shadow-xs transition-colors cursor-pointer"
        >
          Reset
        </button>
        <button
          onClick={handleApply}
          className="inline-flex items-center gap-2 px-5 py-2 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-semibold text-sm rounded-lg shadow-xs transition-all duration-500 cursor-pointer"
        >
          <Filter className="w-4 h-4" />
          <span>Apply Filters</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 3. USERS TABLE COMPONENT
// ==========================================
function UsersTable({ users = [], onDeleteUser, onEditUser }) {
  const getRoleBadge = (role) => {
    switch (role) {
      case 'Administrator':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Coordinator':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'RTO Manager':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'Staff':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (st) => {
    switch (st) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Inactive':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Suspended':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900">User Accounts List</h3>
        <span className="text-xs text-slate-500 font-semibold">{users.length} Users Found</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-4 px-4 font-bold text-slate-600">User Profile & Email</th>
              <th className="py-4 px-4 font-bold text-slate-600">Role</th>
              <th className="py-4 px-4 font-bold text-slate-600">Department</th>
              <th className="py-4 px-4 font-bold text-slate-600">Phone</th>
              <th className="py-4 px-4 font-bold text-slate-600">Status</th>
              <th className="py-4 px-4 font-bold text-slate-600">Last Login</th>
              <th className="py-4 px-4 text-right font-bold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {users.map((user, idx) => {
              const uId = user.id || user._id;
              const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

              return (
                <tr key={uId || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded-xl object-cover ring-2 ring-slate-100 shadow-xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                          {initials}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                        <span className="text-slate-500 text-[11px]">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${getRoleBadge(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-600">{user.department || 'Operations'}</td>
                  <td className="py-4 px-4 text-slate-600">{user.phone || 'N/A'}</td>
                  <td className="py-4 px-4">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border inline-block ${getStatusBadge(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500 text-[11px]">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Recent'}
                  </td>
                  <td className="py-4 px-4 text-right space-x-1">
                    <button
                      onClick={() => onEditUser && onEditUser(user)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex cursor-pointer"
                      title="Edit User"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteUser && onDeleteUser(uId)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex cursor-pointer"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-400 text-sm font-medium">
                  No user accounts found matching selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 4. RIGHT SIDEBAR COMPONENT
// ==========================================
function RightSidebar({ stats, onAddUser }) {
  return (
    <div className="col-span-3 space-y-6">
      {/* Action Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900">User Management</h3>
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20">
            <Users className="w-7 h-7" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Manage system permissions, team member accounts, and roles.
          </p>
        </div>
        <button
          onClick={onAddUser}
          className="w-full py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold text-xs rounded-xl shadow-xs transition-all duration-500 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New User Account</span>
        </button>
      </div>

      {/* Role Breakdown Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Role Breakdown</h3>
          <span className="text-xs text-slate-400 font-semibold">{stats?.totalUsers ?? 0} Total</span>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
              <span className="text-slate-600 font-semibold">Administrators</span>
            </div>
            <span className="font-bold text-slate-900">{stats?.adminUsers ?? 0}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
              <span className="text-slate-600 font-semibold">Coordinators</span>
            </div>
            <span className="font-bold text-slate-900">{stats?.coordinatorUsers ?? 0}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500"></span>
              <span className="text-slate-600 font-semibold">RTO Managers</span>
            </div>
            <span className="font-bold text-slate-900">{stats?.rtoManagerUsers ?? 0}</span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
              <span className="text-slate-600 font-semibold">Staff Members</span>
            </div>
            <span className="font-bold text-slate-900">{stats?.staffUsers ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. MAIN USERS PAGE CONTENT COMPONENT
// ==========================================
export default function UsersPageApp({
  users = [],
  stats,
  onFilterChange,
  onDeleteUser,
  onAddUser,
  showAddModal,
  onCloseAddModal,
  onCreateUser,
  editingUser,
  onUpdateUser
}) {
  const [modalName, setModalName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalRole, setModalRole] = useState('Staff');
  const [modalDept, setModalDept] = useState('Placement Operations');
  const [modalStatus, setModalStatus] = useState('Active');
  const [modalPhone, setModalPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Sync editing user state
  React.useEffect(() => {
    if (editingUser) {
      setModalName(editingUser.name || '');
      setModalEmail(editingUser.email || '');
      setModalRole(editingUser.role || 'Staff');
      setModalDept(editingUser.department || 'Placement Operations');
      setModalStatus(editingUser.status || 'Active');
      setModalPhone(editingUser.phone || '');
    } else {
      setModalName('');
      setModalEmail('');
      setModalRole('Staff');
      setModalDept('Placement Operations');
      setModalStatus('Active');
      setModalPhone('');
    }
  }, [editingUser, showAddModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!modalName || !modalEmail) return;

    try {
      setSubmitting(true);
      if (editingUser) {
        await onUpdateUser(editingUser.id || editingUser._id, {
          name: modalName,
          email: modalEmail,
          role: modalRole,
          department: modalDept,
          status: modalStatus,
          phone: modalPhone,
        });
      } else {
        await onCreateUser({
          name: modalName,
          email: modalEmail,
          role: modalRole,
          department: modalDept,
          status: modalStatus,
          phone: modalPhone,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50 min-h-screen text-slate-800 font-sans relative">
      <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
        {/* KPI Overview */}
        <MetricsCards stats={stats} />

        {/* Filters */}
        <FilterControls users={users} onApplyFilters={onFilterChange} />

        {/* Data Grid */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-9">
            <UsersTable users={users} onDeleteUser={onDeleteUser} onEditUser={onAddUser} />
          </div>
          <div className="col-span-3">
            <RightSidebar stats={stats} onAddUser={() => onAddUser(null)} />
          </div>
        </div>
      </div>

      {/* CREATE / EDIT USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  {editingUser ? 'Edit User Account' : 'Add New User Account'}
                </h3>
              </div>
              <button onClick={onCloseAddModal} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Wasiq Shah"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. wasiq@portal.com"
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Role</label>
                  <select
                    value={modalRole}
                    onChange={(e) => setModalRole(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Administrator">Administrator</option>
                    <option value="Coordinator">Coordinator</option>
                    <option value="RTO Manager">RTO Manager</option>
                    <option value="Staff">Staff</option>
                    <option value="Student">Student</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Placement Operations"
                    value={modalDept}
                    onChange={(e) => setModalDept(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="e.g. +61 400 000 000"
                    value={modalPhone}
                    onChange={(e) => setModalPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#0147A6] hover:bg-gradient-to-r hover:from-[#0147A6] hover:via-[#0B6DC8] hover:to-[#02AFA9] hover:bg-[length:200%_auto] hover:bg-[position:right_center] text-white font-bold rounded-xl transition-all duration-500 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Saving...' : editingUser ? 'Update Account' : 'Create User'}
                </button>
                <button
                  type="button"
                  onClick={onCloseAddModal}
                  className="px-4 py-2.5 border border-slate-200 font-bold text-slate-600 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
