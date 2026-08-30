import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, UserCheck, Loader2, Users, CheckCircle2, UserX } from 'lucide-react';
import { fetchUsers } from '../../api/userApi';
import api from '../../api/axios';

const ROLE_COLORS = {
  Administrator: 'bg-purple-50 text-purple-700 border-purple-200',
  Coordinator:   'bg-blue-50 text-blue-700 border-blue-200',
  'RTO Manager': 'bg-teal-50 text-teal-700 border-teal-200',
  Staff:         'bg-slate-100 text-slate-600 border-slate-200',
};

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces';

export default function AssignCoordinatorModal({ student, onClose, onAssigned }) {
  const [users, setUsers]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(null);   // { _id, name, role, ... }
  const [error, setError]           = useState('');

  // Pre-select the already-assigned coordinator (if any)
  useEffect(() => {
    if (student?.assignedCoordinator) {
      setSelected({
        _id: student.assignedCoordinator,
        name: student.assignedCoordinatorName || 'Current Coordinator',
      });
    }
  }, [student]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchUsers({ status: 'Active' });
      const list = res?.data ?? [];
      setUsers(list);
    } catch (err) {
      setError('Could not load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = async () => {
    if (!selected) return;
    setSaving(true);
    setError('');
    try {
      await api.patch(`/students/${student.dbId || student.id}/assign-coordinator`, {
        coordinatorId:   selected._id,
        coordinatorName: selected.name,
      });
      onAssigned?.({
        coordinatorId:   selected._id,
        coordinatorName: selected.name,
      });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not assign coordinator. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/students/${student.dbId || student.id}/assign-coordinator`, {
        coordinatorId:   null,
        coordinatorName: '',
      });
      onAssigned?.({ coordinatorId: null, coordinatorName: '' });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || 'Could not unassign coordinator. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isAlreadyAssigned =
    student?.assignedCoordinator &&
    selected?._id === student?.assignedCoordinator;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4.5 h-4.5" size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Assign Coordinator</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[240px]">
                {student?.name || 'Student'}
                {student?.studentId ? ` · ${student.studentId}` : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current assignment banner */}
        {student?.assignedCoordinatorName && (
          <div className="mx-5 mt-4 px-3.5 py-2.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="text-[11px] text-blue-800 font-medium">
                Currently assigned to <span className="font-bold">{student.assignedCoordinatorName}</span>
              </span>
            </div>
            <button
              onClick={handleUnassign}
              disabled={saving}
              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 underline ml-2 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        )}

        {/* Search */}
        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 bg-slate-50/60"
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-2 space-y-1.5 min-h-0">
          {loading && (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-xs font-medium">Loading users...</span>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Users className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-xs font-medium">No users found</p>
              {search && (
                <button onClick={() => setSearch('')} className="mt-1 text-[11px] text-blue-500 hover:underline">
                  Clear search
                </button>
              )}
            </div>
          )}

          {!loading && filtered.map((u) => {
            const isSelected = selected?._id === (u._id || u.id);
            const isCurrent  = student?.assignedCoordinator &&
              (student.assignedCoordinator === (u._id || u.id));
            return (
              <button
                key={u._id || u.id}
                onClick={() => setSelected({ _id: u._id || u.id, name: u.name, role: u.role, email: u.email })}
                className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl border transition text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 bg-white'
                }`}
              >
                {/* Avatar */}
                <div className="shrink-0">
                  {u.avatar ? (
                    <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                      {(u.name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">{u.name}</p>
                    {isCurrent && (
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                </div>

                {/* Role badge + radio */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold border ${ROLE_COLORS[u.role] || ROLE_COLORS.Staff}`}>
                    {u.role}
                  </span>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition ${
                    isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                  }`}>
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <p className="mx-5 text-[11px] text-rose-500 font-medium px-3 py-2 bg-rose-50 border border-rose-200 rounded-xl">
            {error}
          </p>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center space-x-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selected || saving || isAlreadyAssigned}
            className="flex-2 flex-grow-[2] py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Assigning...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>
                  {selected
                    ? `Assign to ${selected.name}`
                    : 'Select a Coordinator'}
                </span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
