'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function subscribeToDisplayMode(listener: () => void) {
  const media = window.matchMedia('(display-mode: standalone)');
  media.addEventListener('change', listener);
  return () => media.removeEventListener('change', listener);
}

function getStandaloneSnapshot() {
  return window.matchMedia('(display-mode: standalone)').matches;
}

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

export function PwaInstallButton({ onComplete }: { onComplete?: () => void }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installAccepted, setInstallAccepted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const isStandalone = useSyncExternalStore(subscribeToDisplayMode, getStandaloneSnapshot, () => false);
  const isInstalled = isStandalone || installAccepted;

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setShowInstructions(false);
    };
    const handleInstalled = () => {
      setInstallAccepted(true);
      setInstallPrompt(null);
      setShowInstructions(false);
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!installPrompt) {
      setShowInstructions(true);
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setInstallAccepted(true);
      onComplete?.();
    }
    setInstallPrompt(null);
  }, [installPrompt, onComplete]);

  if (isInstalled) return null;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={install}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#40916c]/25 px-3 py-2.5 text-sm font-extrabold text-[#2d6a4f] transition-colors hover:bg-[#eef5f0] dark:text-[#74c69d] dark:hover:bg-soft"
      >
        <Download size={16} aria-hidden="true" />
        Install Herbal-Ai
      </button>
      {showInstructions && (
        <p role="status" className="px-2 text-center text-xs font-semibold leading-relaxed text-[#2d6a4f]/80 dark:text-muted">
          In Chrome, open the three-dot menu and choose Add to Home screen or Install app.
        </p>
      )}
    </div>
  );
}
