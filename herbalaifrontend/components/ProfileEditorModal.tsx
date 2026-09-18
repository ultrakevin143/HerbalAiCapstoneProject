'use client';

import React, { useState } from 'react';
import { Save, UserRound, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileEditorModal({ isOpen, onClose }: ProfileEditorModalProps) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await updateProfile({ name: name.trim(), avatar: avatar.trim() || null, bio: bio.trim() || null });
      setMessage('Profile saved.');
    } catch (caught: unknown) {
      const apiMessage = typeof caught === 'object' && caught !== null && 'response' in caught
        ? (caught as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(apiMessage || 'Unable to save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-editor-title"
        className="max-h-full w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-panel p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="profile-editor-title" className="flex items-center gap-2 text-xl font-extrabold text-ink">
              <UserRound className="h-5 w-5" /> Edit profile
            </h2>
            <p className="mt-1 text-sm text-muted">Update the personal details shown around Herbal AI.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close profile editor" className="rounded-full p-2 text-muted hover:bg-panel">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-bold text-ink">
            Display name
            <input aria-label="Display name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-normal" />
          </label>
          <label className="block text-sm font-bold text-ink">
            Avatar URL or emoji
            <input aria-label="Avatar URL or emoji" maxLength={500} value={avatar} onChange={(event) => setAvatar(event.target.value)} className="mt-1 w-full rounded-xl border border-line px-3 py-2 font-normal" />
          </label>
          <label className="block text-sm font-bold text-ink">
            Bio
            <textarea aria-label="Bio" maxLength={1000} rows={4} value={bio} onChange={(event) => setBio(event.target.value)} className="mt-1 w-full resize-y rounded-xl border border-line px-3 py-2 font-normal" />
            <span className="mt-1 block text-right text-sm font-normal text-muted">{bio.length}/1000</span>
          </label>

          <div className="rounded-xl bg-panel p-3 text-sm text-muted">
            <p><strong>Username:</strong> {user.username}</p>
            <p className="mt-1"><strong>Email:</strong> {user.email}</p>
            <p className="mt-1">Username, email, role, and account status cannot be changed here.</p>
          </div>

          {message && <p role="status" className="text-sm font-bold text-success-ink">{message}</p>}
          {error && <p role="alert" className="text-sm font-bold text-error-ink">{error}</p>}

          <button type="submit" disabled={saving || name.trim().length < 2} className="flat-button flat-button-primary flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
