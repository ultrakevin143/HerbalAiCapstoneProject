'use client';

import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import api from '../lib/axios';
import { requestError, responseMessage } from '../lib/request-feedback';

export default function PasswordSettings({ email, hasLocalPassword, passwordStatus, onChanged }: {
  email: string;
  hasLocalPassword?: boolean | null;
  passwordStatus?: 'set' | 'unset' | 'unknown';
  onChanged: () => void;
}) {
  const needsPasswordSetup = passwordStatus === 'unset' || hasLocalPassword === false;
  const hasConfirmedPassword = !needsPasswordSetup && (passwordStatus === 'set' || hasLocalPassword === true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState<'change' | 'link' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const requestPending = useRef(false);
  const changeFeedbackRef = useRef<HTMLParagraphElement>(null);
  const linkFeedbackRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (error) changeFeedbackRef.current?.scrollIntoView({ block: 'nearest' });
  }, [error]);

  useEffect(() => {
    if (message || linkError) linkFeedbackRef.current?.scrollIntoView({ block: 'nearest' });
  }, [message, linkError]);

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (requestPending.current || needsPasswordSetup) return;
    setError(null);
    setMessage(null);
    setLinkError(null);
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
    setLinkError(null);
    try {
      const response = await api.post('/auth/password-setup', {});
      setMessage(responseMessage(response, 'Check your email and Spam folder. Requests are limited to once an hour.'));
    } catch (caught: unknown) {
      setLinkError(requestError(caught, 'Could not request a password link. Check your connection and try again.'));
    } finally {
      requestPending.current = false;
      setBusy(null);
    }
  };

  const fields = [
    { name: 'currentPassword', label: 'Current password', value: currentPassword, update: setCurrentPassword, autocomplete: 'current-password' },
    { name: 'newPassword', label: 'New password', value: newPassword, update: setNewPassword, autocomplete: 'new-password' },
    { name: 'confirmPassword', label: 'Confirm new password', value: confirmation, update: setConfirmation, autocomplete: 'new-password' },
  ];

  const linkFeedback = (message || linkError) && (
    <p id="password-link-feedback" ref={linkFeedbackRef} role={linkError ? 'alert' : 'status'} aria-atomic="true" className={`mt-3 rounded-xl border border-line bg-soft p-3 text-sm break-words ${linkError ? 'font-bold text-error-ink' : 'text-success-ink'}`}>
      {linkError || <><strong>Password link requested.</strong> {message}</>}
    </p>
  );

  const changePasswordForm = <>
    <p id="password-change-help" className="mt-2 text-sm text-muted">Use at least 8 characters. Changing your password signs you out on all devices.</p>
    <form onSubmit={handleChangePassword} aria-describedby={error ? 'password-change-help password-change-error' : 'password-change-help'} className="mt-4 space-y-4">
      <input id="password-username" name="username" type="text" autoComplete="username" value={email} readOnly hidden />
      {fields.map(field => (
        <label key={field.label} className="block text-sm font-bold text-ink">
          {field.label}
          <input
            id={`password-${field.name}`}
            name={field.name}
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
      {error && <p id="password-change-error" ref={changeFeedbackRef} role="alert" className="rounded-xl border border-line bg-soft p-3 text-sm font-bold text-error-ink break-words">{error}</p>}
      <button type="submit" disabled={busy !== null} className="flat-button flat-button-primary w-full disabled:cursor-not-allowed disabled:opacity-50">
        {busy === 'change' ? 'Changing password…' : 'Change password'}
      </button>
    </form>
  </>;

  if (!hasConfirmedPassword) {
    return (
      <section aria-labelledby="password-settings-title" className="mt-8 border-t border-line pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0 flex-1">
            <h3 id="password-settings-title" className="flex items-center gap-2 text-lg font-bold text-ink">
              <KeyRound className="h-5 w-5" aria-hidden="true" /> Password
            </h3>
            {needsPasswordSetup && <p className="mt-2 text-sm text-muted">No password set.</p>}
            <p id="password-setup-help" className="mt-2 text-base text-muted">{needsPasswordSetup
              ? 'You currently sign in through Google. Create an optional Herbal-Ai password to also sign in with your email and password.'
              : 'Create or reset your Herbal-Ai password using a secure email link. If you sign in with Google, you do not need your Google password.'}</p>
          </div>
          <button type="button" onClick={handlePasswordLink} disabled={busy !== null} aria-busy={busy === 'link'} aria-describedby={message || linkError ? 'password-setup-help password-link-feedback' : 'password-setup-help'} className="flat-button flat-button-primary min-h-11 w-full shrink-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
            {busy === 'link' ? 'Requesting link…' : 'Set Password'}
          </button>
        </div>
        {linkFeedback}
        <p className="mt-3 break-words text-sm text-muted">We&apos;ll email a secure setup link to {email}. Check your inbox and Spam folder. One request per hour; links expire after an hour and work only once.</p>
        <p className="mt-2 text-sm text-muted">{needsPasswordSetup ? 'Google sign-in still works.' : 'Google sign-in still works for linked accounts.'} This does not change your Google password.</p>
        {!needsPasswordSetup && (
          <details className="mt-4 border-t border-line pt-3">
            <summary className="min-h-11 cursor-pointer text-sm font-bold text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">Already have a Herbal-Ai password? Change it</summary>
            {changePasswordForm}
          </details>
        )}
      </section>
    );
  }

  return (
    <section aria-labelledby="password-settings-title" className="mt-8 border-t border-line pt-6">
      <h3 id="password-settings-title" className="flex items-center gap-2 text-lg font-bold text-ink">
        <KeyRound className="h-5 w-5" aria-hidden="true" /> Herbal-Ai password
      </h3>
      {changePasswordForm}
      <div className="mt-6">
        <h4 className="font-bold text-ink">Create or reset your Herbal-Ai password</h4>
        <p className="mt-2 break-words text-sm text-muted">Signed in with Google and haven&apos;t created a Herbal-Ai password? Request a link at {email} to create one. You can also use this link if you forgot an existing Herbal-Ai password.</p>
        <p className="mt-2 text-sm text-muted">After saving it, you can sign in with this email and your Herbal-Ai password. Google sign-in still works for linked accounts. This does not change your Google password.</p>
        {linkFeedback}
        <button type="button" onClick={handlePasswordLink} disabled={busy !== null} aria-busy={busy === 'link'} aria-describedby={message || linkError ? 'password-link-feedback' : undefined} className="flat-button mt-3 flex w-full items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
          <Mail className="h-4 w-4" aria-hidden="true" /> {busy === 'link' ? 'Requesting link…' : 'Email a password link'}
        </button>
        <p className="mt-2 text-sm text-muted">Check your inbox and Spam folder. One email request per hour; links expire after an hour and work only once.</p>
      </div>
    </section>
  );
}
