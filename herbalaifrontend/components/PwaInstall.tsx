'use client';

import { useEffect, useRef, useState } from 'react';
import { Download, X } from 'lucide-react';
import { createInstallNotice, type InstallNoticeState } from '../lib/pwa-install';

export function PwaRegistration() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(async (registrations) => {
        const localRegistrations = registrations.filter((registration) => registration.scope.startsWith(`${window.location.origin}/`));
        if (localRegistrations.length === 0) return;
        await Promise.all(localRegistrations.map((registration) => registration.unregister()));
        if ('caches' in window) {
          const names = await caches.keys();
          await Promise.all(names.filter((name) => name.startsWith('herbal-ai-static-')).map((name) => caches.delete(name)));
        }
        if (navigator.serviceWorker.controller) window.location.reload();
      }).catch(() => {});
      return;
    }

    if (!['localhost', '127.0.0.1'].includes(window.location.hostname)) {
      navigator.serviceWorker.register('/sw.js').catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }
  }, []);

  return null;
}

export function PwaInstallNotice() {
  const controller = useRef<ReturnType<typeof createInstallNotice> | null>(null);
  const [notice, setNotice] = useState<InstallNoticeState>({ mode: null, visible: false, pending: false, instructions: false, error: '' });

  useEffect(() => {
    const current = createInstallNotice(window, setNotice);
    controller.current = current;
    current.start();
    return () => {
      current.dispose();
      controller.current = null;
    };
  }, []);

  if (!notice.visible) return null;

  return (
    <aside
      aria-label="Add Herbal-Ai to your home screen"
      className="fixed z-40 w-[calc(100%_-_2rem)] max-w-sm rounded-2xl bg-panel p-4 text-ink shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      style={{ left: 'max(1rem, env(safe-area-inset-left))', bottom: 'max(1rem, env(safe-area-inset-bottom))', maxHeight: 'calc(100dvh - 2rem)', overflowY: 'auto' }}
    >
      <button
        type="button"
        aria-label="Dismiss installation suggestion"
        onClick={() => controller.current?.dismiss()}
        className="absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-xl text-muted hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <X size={18} aria-hidden="true" />
      </button>
      <div role="status" aria-live="polite" className="pr-8">
        <p className="text-sm font-extrabold">Keep Herbal-Ai within reach</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          {notice.instructions ? 'In Safari, tap Share, then Add to Home Screen and confirm Add.' : 'Add Herbal-Ai to your home screen for quick access?'}
        </p>
      </div>
      {notice.error && <p role="alert" className="mt-2 text-sm leading-relaxed text-ink">{notice.error}</p>}
      <div className="mt-3 flex items-center gap-2">
        {!notice.instructions && !notice.error && (
          <button
            type="button"
            disabled={notice.pending}
            onClick={() => { void controller.current?.add(); }}
            className="flex min-h-11 items-center gap-2 rounded-xl bg-[#2d6a4f] px-4 text-sm font-bold text-white transition-colors hover:bg-[#1b4332] disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <Download size={16} aria-hidden="true" />
            {notice.pending ? 'Opening…' : 'Add'}
          </button>
        )}
        <button
          type="button"
          onClick={() => controller.current?.dismiss()}
          className="min-h-11 rounded-xl px-3 text-sm font-semibold text-ink hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {notice.instructions ? 'Got it' : 'Not now'}
        </button>
      </div>
    </aside>
  );
}
