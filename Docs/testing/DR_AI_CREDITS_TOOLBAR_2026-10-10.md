# Dr. Ai credits toolbar arrangement

Date: 10 October 2026, Asia/Manila.
Status: publication authorized; reviewed credits-toolbar candidate awaiting exact-SHA CI and live deployment verification.

## Requested arrangement

Move the credit balance above the active chat, not inside the conversation/composer, without adding a global navigation button. Preserve the current visual identity and payment flow rather than copying another product's complete design.

## Changes

- Wrap the active chat in a flex-column workspace; its credit control is a sibling preceding the chat panel.
- Replace the old composer balance/Manage credits row with a compact, right-aligned coin/balance control above the chat. Its accessible name still opens the existing wallet drawer.
- Keep the per-completed-answer note on larger screens; keep the count/control visible on phones.
- Preserve live balance announcements, account-scoped wallet state, post-answer revision refresh, zero-credit guidance and the original checkout/Back behavior.
- Use existing theme tokens, tabular balance figures, keyboard focus styling and a measured 44px touch target.
- Remove the old short-height composer-child hiding selector, which could otherwise hide the first error alert after moving the balance out of the composer.
- Update placement and rendered-control regressions. No backend, API, billing, merchant settings, authentication or global Navbar source was changed.

## Observed validation

- All **27 credits frontend regressions passed**.
- Frontend ESLint and TypeScript `--noEmit` passed.
- The isolated production build (`next build --webpack`) passed compilation, TypeScript and prerendering; the production preview starts successfully on loopback 4590.
- Focused design detector returned `[]`; `git diff --check` passed.
- Browser desktop preview at the default viewport: credit summary is outside both panel/composer, above the panel, with no horizontal overflow; balance button height 44px.
- Responsive browser viewport 390 × 844: count/control stay above the panel and inside the viewport, with no horizontal overflow; button height 44px. This is emulation, not a physical-device result.
- The existing drawer opened from the new control. Back to Dr. Ai closed it and retained the unsent TEST ONLY draft.
- A synthetic zero-balance wallet refresh updated the upper control to zero and displayed recovery guidance outside the chat; the same draft remained intact. No prompt or checkout was submitted.
- Temporary viewport override was reset.

The visual preview uses a copied frontend outside Git on loopback 4590 and an explicitly synthetic, credential-free API on loopback 4559. Its `/chat` cookie gate is bypassed only in the copied fixture build; the actual project's proxy/authentication was not changed. This is layout/drawer evidence, not genuine login, AI generation or PayMongo acceptance. Existing local services on 3000/5001 and production settings remain separate.

The first isolated Turbopack preview rejected the dependency junction outside its filesystem root; the preview was recovered using Webpack. An omitted catalog fixture endpoint initially caused a prefetch 404 and was added only to the outside-Git fixture. Neither observation is evidence of a new production API defect. The production build then passed and replaced the temporary dev preview; the user's existing local services were not stopped.

Proof artifacts are outside Git in the Codex task output folder: `credits-toolbar-desktop-20261010.png`, `credits-toolbar-mobile-20261010.png`, `credits-toolbar-tests-20261010.log`, `credits-toolbar-frontend-validation-20261010.log` and `credits-toolbar-design-detector-20261010.json`.

## Publication gate

Review and publish only the frontend arrangement/test/docs bundle if requested. Keep the synthetic preview, its auth gate, fixtures and credentials out of Git/deployment. No conversational AI fix was resumed after the user declined it; earlier medical retrieval/payment-history backlogs remain independent.
