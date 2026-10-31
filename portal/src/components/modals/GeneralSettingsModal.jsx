import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  X,
  Settings,
  Bell,
  Globe,
  Shield,
  CheckCircle2,
  Moon,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function GeneralSettingsModal({ isOpen, onClose }) {
  const authUser = useSelector((state) => state.auth?.user);

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    inAppBadges: true,
    weeklyReport: false,
    orientationReminders: true,
  });

  const [timezone, setTimezone] = useState('Australia/Sydney');
  const [dateFormat, setDateFormat] = useState('DD/MM/YYYY');

  if (!isOpen) return null;

  const handleToggle = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    toast.success('System preferences saved successfully!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0147A6] via-[#0B6DC8] to-[#02AFA9] text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">General Settings</h3>
              <p className="text-xs text-white/80">Notification and portal display preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Notification Preferences */}
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <Bell size={16} className="text-blue-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Notification Preferences
              </h4>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  key: 'emailAlerts',
                  title: 'Email Notifications',
                  desc: 'Receive transactional updates regarding invoice generation & placement alerts',
                },
                {
                  key: 'inAppBadges',
                  title: 'Real-time In-App Alerts',
                  desc: 'Show unread notification pill on the header top navigation bar',
                },
                {
                  key: 'orientationReminders',
                  title: 'Orientation & Interview Reminders',
                  desc: 'Automated 24h reminders before scheduled facility orientation meetings',
                },
                {
                  key: 'weeklyReport',
                  title: 'Weekly Progress Digest',
                  desc: 'Summarized weekly logbook hours & student pipeline snapshot',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between"
                >
                  <div className="pr-3">
                    <span className="text-xs font-bold text-slate-900 block">{item.title}</span>
                    <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">{item.desc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggle(item.key)}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition cursor-pointer shrink-0 ${
                      notifications[item.key] ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="bg-white w-4 h-4 rounded-full shadow-md" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Regional & Timezone Preferences */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center space-x-2 mb-3">
              <Globe size={16} className="text-teal-600" />
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Regional & Localization
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="Australia/Sydney">Sydney, Melbourne (AEST/AEDT)</option>
                  <option value="Australia/Brisbane">Brisbane (AEST)</option>
                  <option value="Australia/Adelaide">Adelaide (ACST/ACDT)</option>
                  <option value="Australia/Perth">Perth (AWST)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Date Format</label>
                <select
                  value={dateFormat}
                  onChange={(e) => setDateFormat(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Australian Standard)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                </select>
              </div>
            </div>
          </div>

          {/* Session Overview */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Shield size={16} className="text-blue-600" />
              <div>
                <span className="font-bold text-slate-800 block">Encrypted Session</span>
                <span className="text-[10px] text-slate-500">Authenticated as {authUser?.name} ({authUser?.role})</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Online
            </span>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              <CheckCircle2 size={14} />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
