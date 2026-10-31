import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../redux/authSlice';
import { updateProfile } from '../../api/authApi';
import {
  X,
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  Building2,
  Camera,
  CheckCircle2,
  Loader2,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function ProfileSettingsModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth?.user);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    avatar: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [saving, setSaving] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  useEffect(() => {
    if (authUser && isOpen) {
      setFormData({
        name: authUser.name || '',
        phone: authUser.phone || '',
        avatar: authUser.avatar || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setShowPasswordSection(false);
    }
  }, [authUser, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.warning('Name cannot be empty.');
      return;
    }

    if (showPasswordSection || formData.newPassword) {
      if (!formData.currentPassword) {
        toast.warning('Please enter your current password to set a new password.');
        return;
      }
      if (formData.newPassword.length < 6) {
        toast.warning('New password must be at least 6 characters long.');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.warning('New passwords do not match.');
        return;
      }
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        avatar: formData.avatar.trim(),
      };

      if (formData.newPassword) {
        payload.currentPassword = formData.currentPassword;
        payload.newPassword = formData.newPassword;
      }

      const res = await updateProfile(payload);
      if (res.success && res.user) {
        dispatch(updateUser(res.user));
        toast.success('Profile settings updated successfully!');
        onClose();
      } else {
        toast.error(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to update profile settings.';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0147A6] via-[#0B6DC8] to-[#02AFA9] text-white p-5 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-xs">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Profile Settings</h3>
              <p className="text-xs text-white/80">Manage your personal credentials and preferences</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Avatar & Identity Banner */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center space-x-4">
            <div className="relative group">
              <img
                src={formData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces'}
                alt={formData.name || 'User'}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500 shadow-sm"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 text-sm truncate">{formData.name || authUser?.name || 'User'}</h4>
              <p className="text-xs text-slate-500 truncate">{authUser?.email}</p>
              <div className="mt-1 flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  {authUser?.role || 'User'}
                </span>
                {authUser?.rtoName && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200 truncate">
                    {authUser.rtoName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Avatar Presets Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Camera size={14} className="text-slate-400" />
              <span>Profile Avatar Selection</span>
            </label>
            <div className="flex items-center space-x-2">
              {avatarPresets.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => setFormData((p) => ({ ...p, avatar: preset }))}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 transition cursor-pointer ${
                    formData.avatar === preset ? 'border-blue-600 ring-2 ring-blue-200' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt="preset" className="w-full h-full object-cover" />
                </button>
              ))}
              <input
                type="text"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="Or paste custom image URL..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Full Name & Phone Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+61 400 000 000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Email (Read-Only) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address (Login Identity)</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={authUser?.email || ''}
                disabled
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-500 cursor-not-allowed select-none"
              />
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Contact administration if you require an official email change.
            </span>
          </div>

          {/* Security & Password Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <KeyRound size={16} className="text-blue-600" />
                <span className="text-xs font-bold text-slate-800">Account Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                {showPasswordSection ? 'Cancel Password Change' : 'Change Password'}
              </button>
            </div>

            {showPasswordSection && (
              <div className="mt-3 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="Enter current password"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="Min. 6 characters"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm new password"
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer shadow-sm"
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
