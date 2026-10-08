'use client';

import { useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import api from '../lib/axios';
import AccessibleDialog from './AccessibleDialog';
import { Button } from './ui/button';
import { createBanRequest, maximumBanDurations, type BanDurationUnit, type BanUser } from '../lib/user-ban';

export default function UserBanDialog({ user, onSaved, onClose }: {
  user: BanUser;
  onSaved: (user: BanUser) => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<'temporary' | 'indefinite'>('temporary');
  const [duration, setDuration] = useState('7');
  const [unit, setUnit] = useState<BanDurationUnit>('days');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const close = () => { if (!inFlight.current) onClose(); };
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (inFlight.current || !confirmed) return;
    setError('');
    let payload;
    try { payload = user.isBanned ? {} : createBanRequest(type, reason, duration, unit); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Check the ban options.'); return; }
    inFlight.current = true;
    setPending(true);
    try {
      const result = await api.post(`/auth/users/${encodeURIComponent(user.id)}/${user.isBanned ? 'unban' : 'ban'}`, payload);
      const updated = result.data?.data?.user;
      if (result.data?.status !== 'success' || updated?.id !== user.id || typeof updated.isBanned !== 'boolean') {
        throw new Error('The moderation result could not be confirmed. Refresh before retrying.');
      }
      onSaved(updated);
    } catch (failure) {
      setError(axios.isAxiosError<{ message?: string; errors?: { message: string }[] }>(failure)
        ? failure.response?.data?.errors?.[0]?.message || failure.response?.data?.message || 'Could not update this account. Refresh its status before retrying.'
        : failure instanceof Error ? failure.message : 'Could not update this account.');
    } finally { inFlight.current = false; setPending(false); }
  };

  return (
    <AccessibleDialog label={user.isBanned ? 'Unban user' : 'Ban user'} onClose={close}>
      <form onSubmit={submit} className="space-y-5 text-ink">
        <div className="pr-12">
          <h2 className="text-xl font-extrabold">{user.isBanned ? 'Unban user' : 'Ban user'}</h2>
          <p className="mt-1 text-sm text-muted">{user.name} (@{user.username})</p>
        </div>
        {user.isBanned ? (
          <div className="rounded-xl border border-line bg-soft p-4 text-sm">
            <p>{user.banReason || 'No reason was recorded for this earlier ban.'}</p>
            <p className="mt-2">{user.banExpiresAt ? `Ends ${new Date(user.banExpiresAt).toLocaleString()}` : 'Indefinite: remains active until an administrator unbans this account.'}</p>
            <p className="mt-2">This restores sign-in access. Previously revoked sessions stay revoked.</p>
          </div>
        ) : (
          <>
            <label className="block text-sm font-semibold">Ban type
              <select value={type} onChange={event => setType(event.target.value as typeof type)} disabled={pending} className="mt-2 w-full rounded-lg border border-line bg-panel p-3 text-ink">
                <option value="temporary">Temporary ban</option>
                <option value="indefinite">Indefinite ban</option>
              </select>
            </label>
            {type === 'temporary' ? (
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold">Duration
                    <input type="number" value={duration} onChange={event => setDuration(event.target.value)} min={1} max={maximumBanDurations[unit]} step={1} required disabled={pending} className="mt-2 w-full rounded-lg border border-line bg-panel p-3 text-ink" />
                  </label>
                  <label className="text-sm font-semibold">Duration unit
                    <select value={unit} onChange={event => setUnit(event.target.value as BanDurationUnit)} disabled={pending} className="mt-2 w-full rounded-lg border border-line bg-panel p-3 text-ink">
                      <option value="minutes">Minutes</option><option value="hours">Hours</option><option value="days">Days</option>
                    </select>
                  </label>
                </div>
                <p className="mt-2 text-xs text-muted">Enter your own duration, up to 365 days. Access returns automatically when the server-recorded expiry is reached.</p>
              </div>
            ) : <p className="text-sm text-muted">This account stays banned until an administrator explicitly unbans it.</p>}
            <label className="block text-sm font-semibold">Reason shown to the user
              <textarea value={reason} onChange={event => setReason(event.target.value)} required minLength={3} maxLength={500} rows={3} disabled={pending} className="mt-2 w-full rounded-lg border border-line bg-panel p-3 text-ink" />
            </label>
          </>
        )}
        <p className="text-sm text-muted">Account records are preserved. Banning revokes sessions and active recovery links; it does not delete the account.</p>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} required disabled={pending} className="mt-1" />
          <span>I confirm {user.isBanned ? 'unbanning' : 'banning'} this account. This action is recorded in the audit log.</span>
        </label>
        {error && <p role="alert" className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" onClick={close} disabled={pending}>Cancel</Button>
          <Button type="submit" disabled={pending || !confirmed} aria-busy={pending}>
            {pending ? 'Saving…' : user.isBanned ? 'Confirm unban' : 'Confirm ban'}
          </Button>
        </div>
      </form>
    </AccessibleDialog>
  );
}
