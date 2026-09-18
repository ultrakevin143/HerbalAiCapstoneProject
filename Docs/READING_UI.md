# Reading-friendly public UI

## Design

The public website uses a flat, neutral palette with lime accents, large sans-serif headings, outlined controls, and solid cards. Grass.io was used as visual inspiration; its brand, copy, and assets were not copied. Existing local plant images are reused.

The shared navigation and authentication pages offer light/dark theme selection and Normal, Large, and Extra large text. Preferences are saved in the browser under `herbal-ai-display`, applied before hydration, and synchronized between tabs. If browser storage is unavailable, controls still work for the current page session. No account preference or payment functionality is added.

Public pages, account forms, community, messenger, and shared profile components use semantic color tokens in `herbalaifrontend/app/globals.css`. The separate admin console retains its existing light shell. Shared typography and controls also affect that console; it has not received a full visual redesign.

## Reading and interaction

- Default body text is 16px; plant-detail copy and chat paragraphs are 18px. Text settings scale these sizes without disabling browser zoom.
- Library cards have keyboard-operable detail buttons. Native modal dialogs isolate background content, wrap keyboard focus, close with Escape, and return focus to the opener. Expanded images use a second dialog.
- Plant warnings appear before preparation and recorded dosage. Missing warnings are explicitly identified instead of implying safety.
- AI safety guidance appears next to the question input. The input exposes its existing 1,000-character request limit and a character counter; server-side enforcement remains authoritative.
- Reduced-motion preferences disable decorative motion. Headings and ordinary UI labels no longer rely on decorative italic type.

## Verification

Run against a local production frontend:

```powershell
npm.cmd --prefix herbalaifrontend run lint
npm.cmd --prefix herbalaifrontend run build
./scripts/start-demo.ps1 -SkipBuild
node scripts/test-reading-ui.mjs
```

The browser test uses isolated, mocked API responses and a fake cookie accepted only by its mocked session. It creates no real users, does not mutate the database, and does not call an AI provider. It checks light/dark layouts at 320, 390, 768, and 1440 pixels, saved text preferences, keyboard dialogs, nested Escape behavior, focus restoration, and chat submission. It also checks account and About page reflow. Screenshots are written to ignored `.demo-logs/reading-ui`.

Set `CHROME_PATH` to another Chromium executable if Microsoft Edge is not installed at the default Windows path. `UI_TEST_URL` can select another localhost frontend port.

These are targeted regression checks, not a full WCAG conformance audit. Live authenticated community/messaging workflows and screen-reader testing remain separate checks.

## Feedback revision

- The landing page restores the earlier Herbal AI wordmark and conversation-preview layout with flat theme colors. Only the brand wordmark uses italic serif type.
- Desktop navigation groups the main links beside the logo and keeps actions together. Signed-in profile, community, messenger, contribution, staff, and logout actions live in the labeled burger menu. Mobile visitors use the same menu for navigation.
- Display settings are collapsed into a navigation menu instead of occupying a second toolbar row.
- Home/About headlines have smaller type and no lime text highlighting. Herb category badges use small, sentence-case labels on neutral backgrounds.
- The AI page fits the viewport. Only the conversation scrolls; its question input and short safety note stay visible. Example questions are inside the conversation area, not stacked above the input. The layout responds to visual viewport resizing for mobile keyboards.

## Backend startup

An existing preview can occupy port 5000. Stop that preview with `scripts/stop-demo.ps1` before starting the development backend. Do not stop an unrelated process simply because it uses that port. The backend now catches asynchronous listen errors, reports the conflict, closes its pool, and exits unsuccessfully rather than continuing to emit metrics after startup fails.

Runtime database URLs using the legacy `prefer`, `require`, or `verify-ca` aliases are normalized to `verify-full`, preserving the installed driver's existing certificate verification behavior. Explicit libpq compatibility and local `sslmode=disable` configurations are left unchanged. For remote database configuration, use explicit `sslmode=verify-full`; see [PostgreSQL SSL documentation](https://www.postgresql.org/docs/current/libpq-ssl.html). Verification is not disabled to silence warnings.
