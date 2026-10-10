# Small home-screen installation notice

Date: 10 October 2026 (Asia/Manila). Status: reviewed installation-notice release candidate; publication authorized, exact-SHA CI and live verification pending.

## Changes

- Removed the old Install Herbal-Ai button from the mobile navigation menu.
- Mounted one site-wide notification in the root layout, outside page navigation and account state.
- The invitation waits seven seconds after mount. Chromium browsers must first emit an eligible `beforeinstallprompt` event; unsupported browsers do not receive a misleading Add button.
- Add invokes the saved browser prompt only after a click. Browser confirmation remains necessary; this cannot silently install an application. Accepted installation, an `appinstalled` event, or standalone display mode hides the notice.
- iPhone/iPad Safari instead explains Share → Add to Home Screen → Add. This is manual guidance, not automatic installation or proof of an installed app.
- Not now and the close control hide the invitation and record a seven-day browser-local dismissal. Cancelling the native prompt also records a dismissal. Blocked storage falls back to suppression for the current mounted session.
- The notification has a 384px maximum width, 14px readable copy, 44px controls, polite announcement, theme colors and safe-area offsets. No full-screen backdrop, focus trap or modal is added.
- Prompt failures produce a visible recovery message rather than an unhandled rejection. Consumed prompts are not reused; repeated Add clicks and completion after unmount are guarded.
- Backend, existing registration/cache policy, manifests, authentication, payment and AI behavior are unchanged. Existing uncommitted credit-toolbar changes are preserved.

## Observed validation

- All 17 installation regressions passed, covering eligibility, timing, acceptance, cancellation, repeated clicks, cooldown, storage failure, installed suppression, iOS guidance, failure handling, cleanup and global mounting.
- Combined with the 27 existing credits regressions: 44/44 passed.
- Frontend lint and TypeScript checks passed; focused design detector returned no findings; `git diff --check` passed.
- A separate clean source copy, without the mocked-install preview component, passed `npm run build -- --webpack`: compilation, TypeScript and all 24 generated pages. Only its build-time API URL points to the credential-free loopback fixture; the running user frontend and production configuration are unchanged.
- Desktop loopback browser fixture: notification measured 384 × 157.5px at 1280 × 720; all controls measured 44px high; no horizontal overflow. The synthetic Add action cancelled the mock prompt and left an unsent TEST ONLY chat draft intact.
- DevTools responsive measurement at 390 × 844: notice was 358 × 157.5px (18.7% of viewport height), with 16px side/bottom clearance and no horizontal overflow. The temporary device-metrics override was cleared afterward. This is emulated layout evidence, not a physical phone installation.
- Not now hid the notice; a fresh page load with the mocked eligibility event still did not redisplay it. Mock reset controls and events exist only in the ignored external preview copy, never in the repository's root layout or production component.
- Desktop screenshot: `C:\Users\Hp\Documents\Codex\2026-10-07\what-can-you-proposed-fix-for\pwa-notice-desktop-20261010.png`.
- Native event availability and outcomes in this preview are synthetic. The fixture is confined to a copied frontend outside Git, enabled by `?pwa-preview=1`. It never installs an application, calls an AI provider, sends a payment or connects to the live database.

## Remaining acceptance

Confirm genuine Add/browser-confirmation installation on a supported HTTPS browser after a reviewed deployment; verify an installed launch suppresses the invitation. Check the Safari instruction path on an actual iPhone/iPad. Browser emulation and mocked install events are not physical-device or genuine installation evidence.

Browser behavior reference: [MDN beforeinstallprompt](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event). Eligibility timing is browser-controlled and the API is not available in every browser.
