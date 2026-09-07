# Profile editing and Dr. Ai quick-prompt rehearsal — 7 September 2026

## Result

**Pass.** TC-AUTH-04 and TC-CHAT-04 passed in the local production build. The run used one isolated temporary contributor account and did not modify a real account.

## Profile editing — TC-AUTH-04

- Added an authenticated `PATCH /api/auth/me` route for self-service changes to display name, avatar, and bio.
- Added an Edit profile dialog reachable from desktop and mobile navigation.
- Saved all three allowed fields and confirmed the updated name appeared immediately.
- Reloaded the page, reopened the editor, and confirmed all values persisted.
- Confirmed a one-character name disables submission and the API rejects empty updates.
- Sent a direct request containing `role`, `email`, and `isBanned`; the strict schema returned HTTP 400 and the database retained the original email, username, contributor role, and unbanned state.
- Confirmed username and email are displayed as read-only information, not editable inputs.
- Confirmed the complete dialog fits and scrolls within a 320 × 568 viewport.

## Dr. Ai quick prompts — TC-CHAT-04

- Added three visible prompt choices for Lagundi uses, Sambong preparation, and Bayabas warnings.
- Selected the Lagundi choice and confirmed the browser submitted the exact intended message with an empty initial history.
- Confirmed the selected text appeared as the user message and streamed response chunks rendered as one model response.
- Confirmed the Lagundi source chip and medical disclaimer remained visible.
- Confirmed the prompt row scrolls within its container and the page has no horizontal overflow at 320 px.
- Confirmed response auto-scroll remains inside the conversation panel instead of moving the whole mobile page.

The quick-prompt browser check used a deterministic intercepted SSE response so it tested the UI selection, request payload, streaming renderer, source chip, and disclaimer without consuming an unnecessary live Gemini call. Live Dr. Ai retrieval/provider behavior remains covered by the separate authenticated chat and grounding evidence.

## Defects found and repaired during visual review

1. The chat message-end target could scroll the whole document on a narrow screen. Auto-scroll now targets the conversation panel itself.
2. The profile dialog was initially nested inside the sticky backdrop-filtered navigation element, which clipped its mobile presentation. The dialog now renders as a sibling of the navigation element.

Both repairs passed the same production-browser rerun and screenshot review.

## Verification evidence

- Browser script: `scripts/rehearse-profile-and-quick-prompts.mjs`
- Screenshots: `.demo-logs/profile-quick-prompts/profile-editor-320.png` and `.demo-logs/profile-quick-prompts/quick-prompts-320.png`
- Backend regression: **82/82 tests passed across 14 files**.
- Backend TypeScript build and ESLint: passed.
- Frontend standalone TypeScript and ESLint: passed.
- Frontend constrained production build: passed with 18 routes.
- Browser console/page errors: none.
- Cleanup: the exact temporary account and cascaded related records were deleted and absence was asserted.

## Evidence boundary

This is Chrome production-build evidence at desktop and 320px emulated widths. It is not physical-device acceptance, participant UAT, full WCAG certification, or production deployment evidence.
