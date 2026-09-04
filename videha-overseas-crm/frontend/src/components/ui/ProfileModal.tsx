import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Key, Shield, User as UserIcon, Check } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, role, permissions, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setIsSavingProfile(true);
    try {
      const res = await api.auth.updateProfile({ name, phone });
      if (res.success) {
        await refreshUser();
        setProfileMsg({ type: 'success', text: 'Profile updated successfully.' });
      }
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword !== confirmPassword) {
      setPwdMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPwdMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsSavingPwd(true);
    try {
      const res = await api.auth.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPwdMsg({ type: 'success', text: 'Password changed successfully.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      setPwdMsg({ type: 'error', text: err.message || 'Password update failed.' });
    } finally {
      setIsSavingPwd(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Profile & Security" maxWidth="lg">
      <div className="space-y-5">
        {/* Sub Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            Profile Details
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Change Password
          </button>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
            {profileMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Official corporate email managed by CRM administrator.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                  placeholder="+91..."
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={user?.department || '—'}
                  disabled
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Managed by CRM administrator.
                </span>
              </div>
            </div>

            {/* Role & Permissions Readout */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-600">Assigned Role:</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                  <Shield className="w-3 h-3 text-sky-600" />
                  {role?.displayName || user?.roleName}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mb-1">
                  Active Permissions ({permissions.length})
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {permissions.map(p => (
                    <span
                      key={p}
                      className="text-[10px] bg-slate-200/70 text-slate-700 px-1.5 py-0.5 rounded font-mono"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            {pwdMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  pwdMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {pwdMsg.text}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="At least 6 characters"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="••••••••"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPwd}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-800 disabled:opacity-50"
              >
                {isSavingPwd ? 'Updating...' : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
