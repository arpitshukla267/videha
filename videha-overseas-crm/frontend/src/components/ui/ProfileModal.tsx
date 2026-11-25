import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import { Key, Shield, User as UserIcon, Mail, Check, ArrowRight } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, role, permissions, refreshUser, changeEmail } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'email' | 'security'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Email form
  const [newEmail, setNewEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailMsg, setEmailMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSavingPwd, setIsSavingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
    }
  }, [user]);

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

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMsg(null);

    const targetEmail = newEmail.trim().toLowerCase();
    const confirmTarget = confirmEmail.trim().toLowerCase();

    if (!targetEmail) {
      setEmailMsg({ type: 'error', text: 'Please enter a new email address.' });
      return;
    }

    if (targetEmail !== confirmTarget) {
      setEmailMsg({ type: 'error', text: 'New email addresses do not match.' });
      return;
    }

    if (targetEmail === user?.email?.toLowerCase()) {
      setEmailMsg({ type: 'error', text: 'New email must be different from your current email.' });
      return;
    }

    setIsSavingEmail(true);
    try {
      const res = await changeEmail(targetEmail, emailPassword || undefined);
      if (res.success) {
        setEmailMsg({
          type: 'success',
          text: `Login email updated to ${targetEmail}. Please use this new email for future logins. Task and Follow-up reminders will be sent to this email.`,
        });
        setNewEmail('');
        setConfirmEmail('');
        setEmailPassword('');
      }
    } catch (err: any) {
      setEmailMsg({ type: 'error', text: err.message || 'Failed to update login email.' });
    } finally {
      setIsSavingEmail(false);
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
            onClick={() => setActiveTab('email')}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'email'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Change Login Email
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
              <div className="flex items-center justify-between mb-1">
                <label className="block font-medium text-slate-700">Login Email Address</label>
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className="text-[11px] text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1"
                >
                  Change Email <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-600 font-mono cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Your current CRM login email and reminder notification recipient.
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

        {activeTab === 'email' && (
          <form onSubmit={handleChangeEmail} className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="font-semibold text-slate-900 mb-0.5">Update Login Email</p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Updating your login email changes the actual address you use to sign in to Videha Overseas CRM. All future Task and Follow-up reminder emails will automatically be delivered to this new email address.
              </p>
            </div>

            {emailMsg && (
              <div
                className={`p-3 rounded-lg text-xs font-medium ${
                  emailMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {emailMsg.text}
              </div>
            )}

            <div>
              <label className="block font-medium text-slate-700 mb-1">Current Login Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-600 font-mono cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">New Login Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                placeholder="new.email@example.com"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Confirm New Login Email</label>
              <input
                type="email"
                value={confirmEmail}
                onChange={e => setConfirmEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900 font-mono"
                placeholder="new.email@example.com"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Current Password (Verification)</label>
              <input
                type="password"
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-slate-900"
                placeholder="Enter your current password"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                Required to securely verify your identity before updating login credentials.
              </span>
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
                disabled={isSavingEmail}
                className="px-4 py-2 rounded-lg bg-teal-800 text-white font-medium hover:bg-teal-900 disabled:opacity-50"
              >
                {isSavingEmail ? 'Updating Email...' : 'Update Login Email'}
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
