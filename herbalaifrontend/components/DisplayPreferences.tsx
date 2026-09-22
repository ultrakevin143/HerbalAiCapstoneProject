'use client';

import { useEffect, useId, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

const storageKey = 'herbal-ai-display';
const defaultSnapshot = '{"theme":"light","size":"normal"}';
let memorySnapshot = defaultSnapshot;
type Preferences = { theme: 'light' | 'dark'; size: 'normal' | 'large' | 'extra-large' };

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
      size: value?.size === 'large' || value?.size === 'extra-large' ? value.size : 'normal',
    };
  } catch {
    return { theme: 'light', size: 'normal' };
  }
}

function usePreferences() {
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
  const { theme, size } = usePreferences();
  useEffect(() => {
    const preferences = parsePreferences(getSnapshot());
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
    document.documentElement.dataset.textSize = preferences.size;
  }, [theme, size]);
  return null;
}

export function ThemeToggle({ className = '' }: { className?: string }) {
  const preferences = usePreferences();
  const isDark = preferences.theme === 'dark';
  return (
    <button
      type="button"
      className={className}
      aria-pressed={isDark}
      onClick={() => savePreferences({ ...preferences, theme: isDark ? 'light' : 'dark' })}
    >
      {isDark ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
      <span>{isDark ? 'Light theme' : 'Dark theme'}</span>
    </button>
  );
}

interface DisplayPreferencesProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function DisplayPreferences({ open, onOpenChange }: DisplayPreferencesProps = {}) {
  const preferences = usePreferences();
  const sizeId = useId();
  const isDark = preferences.theme === 'dark';
  return (
    <details
      className="display-menu"
      open={open}
      onToggle={(event) => onOpenChange?.(event.currentTarget.open)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.currentTarget.open = false;
          onOpenChange?.(false);
          event.currentTarget.querySelector('summary')?.focus();
        }
      }}
    >
      <summary>Display</summary>
      <div className="reading-toolbar" role="group" aria-label="Reading preferences">
      <label htmlFor={sizeId}>Text size</label>
      <select id={sizeId} value={preferences.size} onChange={(event) => savePreferences({ ...preferences, size: event.target.value as Preferences['size'] })}>
        <option value="normal">Normal</option>
        <option value="large">Large</option>
        <option value="extra-large">Extra large</option>
      </select>
      <button type="button" aria-pressed={isDark} onClick={() => savePreferences({ ...preferences, theme: isDark ? 'light' : 'dark' })}>
        {isDark ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
        Dark theme
      </button>
      </div>
    </details>
  );
}
