export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export interface InstallNoticeState {
  mode: 'native' | 'ios' | null;
  visible: boolean;
  pending: boolean;
  instructions: boolean;
  error: string;
}

export const INSTALL_NOTICE_DELAY = 7000;
export const INSTALL_NOTICE_COOLDOWN = 7 * 24 * 60 * 60 * 1000;
export const INSTALL_NOTICE_STORAGE_KEY = 'herbal-ai-install-dismissed-at';

export function createInstallNotice(browser: Window, notify: (state: InstallNoticeState) => void) {
  let state: InstallNoticeState = { mode: null, visible: false, pending: false, instructions: false, error: '' };
  let prompt: InstallPromptEvent | null = null;
  let timer: number | undefined;
  let disposed = false;
  let suppressed = false;
  let ready = false;
  const media = browser.matchMedia('(display-mode: standalone)');
  const navigator = browser.navigator as Navigator & { standalone?: boolean };
  const installed = () => media.matches || navigator.standalone === true;
  const update = (patch: Partial<InstallNoticeState>) => {
    state = { ...state, ...patch };
    if (!disposed) notify(state);
  };
  const rememberDismissal = () => {
    suppressed = true;
    try {
      browser.localStorage.setItem(INSTALL_NOTICE_STORAGE_KEY, String(Date.now()));
    } catch {}
  };
  const dismiss = () => {
    rememberDismissal();
    update({ visible: false, error: '' });
  };
  const show = () => {
    if (!disposed && ready && !suppressed && !installed() && state.mode) update({ visible: true });
  };
  const handlePrompt = (event: Event) => {
    event.preventDefault();
    prompt = event as InstallPromptEvent;
    update({ mode: 'native', instructions: false, error: '' });
    show();
  };
  const handleInstalled = () => {
    suppressed = true;
    prompt = null;
    update({ visible: false, pending: false, error: '' });
  };
  const handleDisplayMode = () => {
    if (installed()) handleInstalled();
  };

  return {
    start() {
      try {
        const timestamp = Number(browser.localStorage.getItem(INSTALL_NOTICE_STORAGE_KEY));
        suppressed = Number.isFinite(timestamp) && timestamp > 0 && Date.now() - timestamp < INSTALL_NOTICE_COOLDOWN;
      } catch {}
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
      if (isIos && isSafari) update({ mode: 'ios' });
      browser.addEventListener('beforeinstallprompt', handlePrompt);
      browser.addEventListener('appinstalled', handleInstalled);
      media.addEventListener('change', handleDisplayMode);
      timer = browser.setTimeout(() => { ready = true; show(); }, INSTALL_NOTICE_DELAY);
    },
    async add() {
      if (disposed || suppressed || installed() || state.pending) return;
      if (!prompt) {
        if (state.mode === 'ios') update({ instructions: true });
        return;
      }
      const currentPrompt = prompt;
      prompt = null;
      update({ pending: true, error: '' });
      try {
        await currentPrompt.prompt();
        const choice = await currentPrompt.userChoice;
        if (disposed) return;
        if (choice.outcome === 'accepted') handleInstalled();
        else dismiss();
      } catch {
        update({ error: 'The browser could not open installation. Use its menu to install Herbal-Ai, or try again on a later visit.' });
      } finally {
        if (!disposed) update({ pending: false });
      }
    },
    dismiss,
    dispose() {
      disposed = true;
      browser.clearTimeout(timer);
      browser.removeEventListener('beforeinstallprompt', handlePrompt);
      browser.removeEventListener('appinstalled', handleInstalled);
      media.removeEventListener('change', handleDisplayMode);
      prompt = null;
    },
  };
}
