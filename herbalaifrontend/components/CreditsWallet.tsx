'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Coins } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import SessionUnavailable from './SessionUnavailable';
import AccessibleDialog from './AccessibleDialog';
import { Button } from './ui/button';
import api from '../lib/axios';
import { creditWalletSchema, resumableCheckoutUrl, safeTestCheckoutUrl } from '../lib/credits';
import type { CreditWallet } from '../lib/credits';

const amount = (minor: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(minor / 100);
const requestError = (error: unknown) => {
  const parsed = z.object({ response: z.object({ data: z.object({ message: z.string() }) }) }).safeParse(error);
  return parsed.success ? parsed.data.response.data.message : 'The test wallet could not complete this request. Please refresh to check its status.';
};

export default function CreditsWallet({ embedded = false, revision: chatRevision = 0 }: { embedded?: boolean; revision?: number }) {
  const { user, loading, sessionUnavailable, checkSession } = useAuth();
  const userId = user?.id;
  const [wallet, setWallet] = useState<{ ownerId: string; data: CreditWallet } | null>(null);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState('');
  const [walletError, setWalletError] = useState('');
  const [pending, setPending] = useState(false);
  const [panelOwner, setPanelOwner] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<{ ownerId: string; purchaseId: string; url: string } | null>(null);
  const lastRefresh = useRef(0);
  const [answer, setAnswer] = useState<{ ownerId: string; reply: string } | null>(null);
  const active = useRef(true);
  const account = useRef(userId);
  useEffect(() => { account.current = userId; return () => { account.current = undefined; }; }, [userId]);
  const checkoutKeys = useRef(new Map<string, string>());
  const checkoutPurchases = useRef(new Map<string, string>());
  const answerRequest = useRef(0);
  const locked = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  useEffect(() => {
    let cancelled = false;
    if (!userId || sessionUnavailable) return;
    api.get('/credits').then(response => {
      if (cancelled) return;
      const data = creditWalletSchema.parse(response.data.data);
      const paid = new Set(data.purchases.filter(purchase => purchase.status === 'PAID').map(purchase => purchase.id));
      for (const [key, purchaseId] of checkoutPurchases.current) {
        if (key.startsWith(`${userId}:`) && paid.has(purchaseId)) {
          checkoutKeys.current.delete(key);
          checkoutPurchases.current.delete(key);
        }
      }
      for (const purchase of data.purchases) {
        if (purchase.status !== 'PENDING' || !purchase.packageId || !purchase.requestKey || locked.current) continue;
        const key = `${userId}:${purchase.packageId}`;
        if (!checkoutPurchases.current.has(key)) {
          checkoutKeys.current.set(key, purchase.requestKey);
          checkoutPurchases.current.set(key, purchase.id);
        }
      }
      setCheckout(current => current?.ownerId === userId && paid.has(current.purchaseId) ? null : current);
      setWallet({ ownerId: userId, data });
      setWalletError('');
    }).catch(() => { if (!cancelled) setWalletError('The wallet could not be loaded. Please try Refresh.'); });
    return () => { cancelled = true; };
  }, [userId, sessionUnavailable, revision, chatRevision]);
  useEffect(() => {
    if (!userId || sessionUnavailable) return;
    const refreshOnReturn = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastRefresh.current < 1000) return;
      lastRefresh.current = Date.now();
      setRevision(value => value + 1);
    };
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.removeEventListener('focus', refreshOnReturn);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [userId, sessionUnavailable]);

  const buy = async (packageId: string) => {
    if (locked.current || !userId) return;
    locked.current = true;
    setPending(true);
    setError('');
    setCheckout(null);
    const key = `${userId}:${packageId}`;
    const requestId = checkoutKeys.current.get(key) ?? crypto.randomUUID();
    checkoutKeys.current.set(key, requestId);
    try {
      const response = await api.post('/credits/checkout', { packageId, requestId });
      if (active.current && account.current === userId) {
        const data = z.object({ purchaseId: z.uuid(), checkoutUrl: z.string() }).parse(response.data.data);
        const url = safeTestCheckoutUrl(data.checkoutUrl);
        checkoutPurchases.current.set(key, data.purchaseId);
        setCheckout({ ownerId: userId, purchaseId: data.purchaseId, url });
      }
    } catch (failure) { if (active.current && account.current === userId) { setError(requestError(failure)); setRevision(value => value + 1); } }
    finally { locked.current = false; if (active.current) setPending(false); }
  };

  const openAnswer = async (requestId: string) => {
    if (!userId) return;
    const selection = ++answerRequest.current;
    setAnswer(null);
    setError('');
    try {
      const response = await api.get(`/credits/answers/${encodeURIComponent(requestId)}`);
      if (active.current && account.current === userId && answerRequest.current === selection) setAnswer({ ownerId: userId, reply: z.object({ reply: z.string().min(1).max(200000) }).parse(response.data.data).reply });
    } catch (failure) { if (active.current && account.current === userId && answerRequest.current === selection) setError(requestError(failure)); }
  };

  const backToChat = () => setPanelOwner(null);

  if (sessionUnavailable) return embedded ? null : <SessionUnavailable retry={checkSession} />;
  const current = wallet && wallet.ownerId === userId ? wallet.data : null;
  const notification = error || walletError;
  const content = <div className="space-y-5">
    <div className="pr-12">
      <h2 className="font-serif-custom text-2xl font-bold text-ink">Dr. Ai credits</h2>
      <p className="mt-1 text-sm text-muted">Your balance and credit activity, in one place.</p>
    </div>
    {embedded && <Button variant="outline" className="w-full" onClick={backToChat}>Back to Dr. Ai</Button>}
    <p className="rounded-xl border border-line bg-soft p-3 text-xs text-ink">Test mode only. No real-money purchases are enabled. Test amounts are not published retail prices. The Library remains free.</p>
    {notification && <p role="alert" className="rounded-xl border border-line p-3 text-sm text-ink">{notification}</p>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{current?.enabled ? 'One credit per completed answer.' : 'Wallet status'}</p>
      <Button variant="ghost" size="sm" onClick={() => { setError(''); setRevision(value => value + 1); }} disabled={pending || loading || !userId}>Refresh wallet</Button>
    </div>
    {!current ? <p role="status" className="text-muted">{walletError ? 'Wallet unavailable. Try Refresh wallet.' : loading ? 'Checking session…' : 'Loading wallet…'}</p> : !current.enabled ? <p className="text-ink">Credit purchases are disabled. Your existing Dr. Ai access is unchanged.</p> : <>
      <section className="rounded-2xl border border-line bg-soft p-5">
        <p className="text-sm text-muted">Available test credits</p>
        <p className="mt-1 text-3xl font-semibold text-ink">{current.balance}</p>
        <p className="mt-3 text-xs leading-relaxed text-muted">A credit is reserved when you ask a question. Completed answers use it; failed requests restore it. Reopening a saved answer does not use another credit.</p>
      </section>
      <section className="space-y-3" aria-label="Add test credits">
        <h3 className="text-base font-semibold text-ink">Add test credits</h3>
        <p className="text-xs leading-relaxed text-muted">Payment method: GCash through PayMongo. Use only the provider’s simulated Authorize or Fail controls. Never enter your real GCash PIN or OTP, or scan and pay a QR code.</p>
        {!current.checkoutAvailable && <p className="text-sm text-muted">GCash test checkout is not configured yet.</p>}
        {!current.packages.length && <p className="text-sm text-muted">No test packages are configured.</p>}
        <div className="space-y-3">{current.packages.map(pack => <div key={pack.id} className="rounded-xl border border-line p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4 className="text-sm font-semibold text-ink">{pack.name}</h4>
            <span className="text-sm text-muted">{amount(pack.amountMinor)} test amount</span>
          </div>
          <p className="my-3 text-sm text-ink">{pack.credits} test credits</p>
          <Button className="w-full" onClick={() => buy(pack.id)} disabled={pending || !current.checkoutAvailable}>{pending ? 'Preparing checkout…' : 'Open GCash test checkout'}</Button>
        </div>)}</div>
        {checkout && checkout.ownerId === userId && <div role="status" className="rounded-xl border border-line bg-soft p-3 text-sm text-ink">
          <a href={checkout.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-4">Continue to GCash test checkout</a>
          <p className="mt-2 text-xs text-muted">Opens a separate tab so your conversation and draft stay here.</p>
          <p className="mt-2 text-xs text-muted">Changed your mind? Close the checkout tab and return to Dr. Ai. Returning does not complete a payment.</p>
        </div>}
        <p className="text-xs leading-relaxed text-muted">Credits update only after a verified test payment, not simply when you return. Your balance refreshes when you return to this tab; you can also use Refresh wallet.</p>
      </section>
      <details className="rounded-xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Purchase history</summary>
        <div className="mt-3 space-y-3">{!current.purchases.length && <p className="text-sm text-muted">No test purchases yet.</p>}{current.purchases.map(purchase => {
          const resumeUrl = resumableCheckoutUrl(purchase);
          return <div key={purchase.id} className="text-sm text-ink">
            <p>{purchase.credits} credits · {amount(purchase.amountMinor)} test amount · {purchase.status}<span className="mt-1 block text-xs text-muted">{new Date(purchase.createdAt).toLocaleString()}</span></p>
            {resumeUrl && <>
              <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-accent underline underline-offset-4">Resume GCash test checkout</a>
              <p className="mt-1 text-xs text-muted">Awaiting payment. A failed attempt can be retried in the same checkout; closing its tab does not complete payment.</p>
            </>}
          </div>;
        })}</div>
      </details>
      <details className="rounded-xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Credit activity</summary>
        <div className="mt-3 space-y-3">{!current.ledger.length && <p className="text-sm text-muted">No credit activity yet.</p>}{current.ledger.map(entry => <p key={entry.id} className="text-sm text-ink">{entry.kind} · {entry.delta > 0 ? '+' : ''}{entry.delta} credits<span className="mt-1 block text-xs text-muted">{new Date(entry.createdAt).toLocaleString()}</span></p>)}</div>
      </details>
      <details className="rounded-xl border border-line p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Saved answers</summary>
        <div className="mt-3 space-y-3">
          {!current.requests.some(request => request.status === 'COMPLETED') && <p className="text-sm text-muted">No completed answers yet.</p>}
          {current.requests.filter(request => request.status === 'COMPLETED').map(request => <div key={request.requestKey} className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink">
            <span>{new Date(request.createdAt).toLocaleString()}</span>
            <Button variant="outline" size="sm" onClick={() => openAnswer(request.requestKey)}>Open saved answer</Button>
          </div>)}
          {answer && answer.ownerId === userId && <p className="whitespace-pre-wrap rounded-xl bg-soft p-3 text-sm text-ink">{answer.reply}</p>}
        </div>
      </details>
    </>}
  </div>;

  if (!embedded) return content;
  if (!userId || (!current?.enabled && !walletError)) return null;
  return <>
    <div className="dr-ai-credit-summary mb-3 flex shrink-0 flex-wrap items-center justify-end gap-3 text-xs">
      <span className="hidden text-muted sm:inline">1 per completed answer</span>
      <button type="button" aria-label={current?.balance === 0 ? 'Add test credits: 0 available' : 'Manage credits'} aria-haspopup="dialog" aria-expanded={panelOwner === userId} onClick={() => setPanelOwner(userId)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-panel px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2">
        <Coins aria-hidden="true" className="h-4 w-4 shrink-0 text-accent" />
        <span aria-live="polite" className="tabular-nums">{walletError ? 'Credit balance unavailable' : `${current?.balance ?? 0} test credits available`}</span>
        <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted" />
      </button>
    </div>
    {current?.enabled && current.balance === 0 && <p role="status" className="mb-2 text-xs text-muted">No test credits left. Add credits to continue; your typed question stays here.</p>}
    {panelOwner === userId && <AccessibleDialog label="Dr. Ai credits" variant="drawer" onClose={() => setPanelOwner(null)}>{content}</AccessibleDialog>}
  </>;
}
