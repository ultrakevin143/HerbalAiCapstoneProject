'use client';

import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import api from '../lib/axios';

function requestError(caught: unknown, fallback: string): string {
  const response = (caught as { response?: { data?: { message?: string; errors?: { message?: string }[] } } } | null)?.response;
  return response?.data?.errors?.[0]?.message || response?.data?.message || fallback;
}

export default function PasswordSettings({ email, onChanged }: { email: string; onChanged: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState<'change' | 'link' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const requestPending = useRef(false);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (requestPending.current) return;
    setError(null);
    setMessage(null);
    if (!currentPassword) { setError('Enter your current password.'); return; }
    if (newPassword.length < 8) { setError('Use at least 8 characters for your new password.'); return; }
    if (new TextEncoder().encode(newPassword).length > 72) { setError('Use a password of at most 72 UTF-8 bytes.'); return; }
    if (newPassword === currentPassword) { setError('Choose a password different from your current password.'); return; }
    if (newPassword !== confirmation) { setError('New passwords do not match.'); return; }
    requestPending.current = true;
    setBusy('change');
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      window.dispatchEvent(new Event('auth-logout'));
      onChanged();
    } catch (caught: unknown) {
      setError(requestError(caught, 'Could not confirm the password change. Try signing in before submitting again.'));
    } finally {
      requestPending.current = false;
      setBusy(null);
    }
  };

  const handlePasswordLink = async () => {
    if (requestPending.current) return;
    requestPending.current = true;
    setBusy('link');
    setError(null);
    setMessage(null);
    try {
      const response = await api.post('/auth/password-setup', {});
      setMessage(response.data.message || 'Password link requested. Check your email and Spam folder. Requests are limited to once an hour.');
    } catch (caught: unknown) {
      setError(requestError(caught, 'Could not request a password link. Check your connection and try again.'));
    } finally {
      requestPending.current = false;
      setBusy(null);
    }
  };

  const fields = [
    { label: 'Current password', value: currentPassword, update: setCurrentPassword, autocomplete: 'current-password' },
    { label: 'New password', value: newPassword, update: setNewPassword, autocomplete: 'new-password' },
    { label: 'Confirm new password', value: confirmation, update: setConfirmation, autocomplete: 'new-password' },
  ];

  return (
    <section aria-labelledby="password-settings-title" className="mt-8 border-t border-line pt-6">
      <h3 id="password-settings-title" className="flex items-center gap-2 text-lg font-bold text-ink">
        <KeyRound className="h-5 w-5" aria-hidden="true" /> Password
      </h3>
      <p id="password-change-help" className="mt-2 text-sm text-muted">Use at least 8 characters. Changing your password signs you out on all devices.</p>
      <form onSubmit={handleChangePassword} aria-describedby="password-change-help" className="mt-4 space-y-4">
        {fields.map(field => (
          <label key={field.label} className="block text-sm font-bold text-ink">
            {field.label}
            <input
              type={visible ? 'text' : 'password'}
              autoComplete={field.autocomplete}
              required
              minLength={field.autocomplete === 'new-password' ? 8 : undefined}
              value={field.value}
              disabled={busy !== null}
              onChange={event => field.update(event.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-soft px-3 py-2 text-base font-normal text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          </label>
        ))}
        <button type="button" aria-pressed={visible} onClick={() => setVisible(!visible)} className="flex min-h-11 items-center gap-2 text-sm font-bold text-ink">
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
          {visible ? 'Hide passwords' : 'Show passwords'}
        </button>
        <button type="submit" disabled={busy !== null} className="flat-button flat-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
          {busy === 'change' ? 'Changing password…' : 'Change password'}
        </button>
      </form>
      <div className="mt-6">
        <h4 className="font-bold text-ink">Signed in with Google, or forgot your password?</h4>
        <p className="mt-2 break-words text-sm text-muted">Request a link at {email} to create or recover your password. After saving it, you can sign in with this email and password. Google sign-in still works.</p>
        <button type="button" onClick={handlePasswordLink} disabled={busy !== null} className="flat-button mt-3 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          <Mail className="h-4 w-4" aria-hidden="true" /> {busy === 'link' ? 'Requesting link…' : 'Email a password link'}
        </button>
        <p className="mt-2 text-sm text-muted">Check your inbox and Spam folder. One email request per hour; links expire after an hour and work only once.</p>
      </div>
      {error && <p role="alert" className="mt-4 text-sm font-bold text-error-ink">{error}</p>}
      {message && <p role="status" className="mt-4 text-sm text-success-ink">{message}</p>}
    </section>
  );
}
