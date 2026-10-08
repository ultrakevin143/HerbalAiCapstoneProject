'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const storageKey = 'herbal-ai-display';
const defaultSnapshot = '{"theme":"light","size":"normal"}';
let memorySnapshot = defaultSnapshot;
type Preferences = { theme: 'light' | 'dark'; size?: string };

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener('herbal-display-change', listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener('herbal-display-change', listener);
  };
}

function getSnapshot() {
  try {
    return localStorage.getItem(storageKey) ?? memorySnapshot;
  } catch {
    return memorySnapshot;
  }
}

function parsePreferences(snapshot: string): Preferences {
  try {
    const value = JSON.parse(snapshot);
    return {
      theme: value?.theme === 'dark' ? 'dark' : 'light',
    };
  } catch {
    return { theme: 'light' };
  }
}

export function usePreferences() {
  return parsePreferences(useSyncExternalStore(subscribe, getSnapshot, () => defaultSnapshot));
}

function savePreferences(value: Preferences) {
  memorySnapshot = JSON.stringify(value);
  try {
    localStorage.setItem(storageKey, memorySnapshot);
  } catch {}
  window.dispatchEvent(new Event('herbal-display-change'));
}

export function DisplayPreferenceSync() {
  const { theme } = usePreferences();
  useEffect(() => {
    const preferences = parsePreferences(getSnapshot());
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
  }, [theme]);
  return null;
}

interface ThemeToggleProps {
  className?: string;
  variant?: 'icon' | 'row';
}

export function ThemeToggle({ className = '', variant = 'icon' }: ThemeToggleProps) {
  const preferences = usePreferences();
  const isDark = preferences.theme === 'dark';

  const toggle = () => {
    savePreferences({ ...preferences, theme: isDark ? 'light' : 'dark' });
  };

  if (variant === 'row') {
    return (
      <div className={`flex items-center justify-between ${className}`}>
        <span className="text-sm font-bold text-ink">Theme</span>
        <button
          type="button"
          onClick={toggle}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-panel px-3 py-1.5 text-xs font-bold text-ink shadow-xs hover:bg-soft transition-colors cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun size={15} className="text-amber-400" aria-hidden="true" />
              <span>Light mode</span>
            </>
          ) : (
            <>
              <Moon size={15} className="text-[#1b4332] dark:text-ink" aria-hidden="true" />
              <span>Dark mode</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      className={`flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-black/10 dark:border-line bg-white/80 dark:bg-panel text-[#1b4332] dark:text-ink hover:bg-[#eef5f0] dark:hover:bg-soft transition-colors cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0 ${className}`}
    >
      {isDark ? (
        <Sun size={18} className="text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" aria-hidden="true" />
      ) : (
        <Moon size={18} className="text-[#1b4332] dark:text-ink transition-transform duration-200" aria-hidden="true" />
      )}
    </button>
  );
}

// Default export alias for seamless backwards compatibility
export default ThemeToggle;
