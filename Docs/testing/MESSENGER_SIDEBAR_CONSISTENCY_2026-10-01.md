# Messenger sidebar consistency — 1 October 2026

## Reproduced findings

This follows the released connection/history repair. Baseline head was `0c3c732db133e5b244e46ad88e1440bdbfc45fc9`.

Two deterministic tests failed against the actual baseline page callbacks extracted into a temporary Node test (zero passed, two failed):

1. Editing older Alpha activity moved Alpha ahead of newer Beta activity. The callback always prepended an accepted update rather than ordering conversations by activity time.
2. A Beta event updated state while an old sidebar HTTP snapshot was pending. Completing that request replaced the event preview with the old snapshot. Sidebar fetching lacked the concurrent-update replay already added to active history.

These are controlled callback/state reproductions using the production source, not live database mutations or a claimed React-browser reproduction. The temporary reproducer remains outside Git. An initial local browser attempt used the wrong semantic role and the held request timed out. Another bounded attempt ended with the fresh preview; browser focus/resume reconciliation can affect this scenario. Neither is counted as a failing live-browser check. The deterministic callback tests establish the two defects independently.

## Repair and regression coverage

Pure preview updating and snapshot reconciliation now live in the existing Messenger utility. Updated conversations sort by descending activity time, then contact ID. Older message events do not overwrite newer previews. Incoming/HTTP-response updates are buffered during a refresh and replayed against its snapshot. The existing request generation guard remains; a superseded refresh cannot replace current results or clear a newer buffer. Completed buffers are released and socket cleanup clears them. Pagination offsets still use the server's page length, not the number of event-created entries.

The existing frontend Node suite now passes **19 cases**: twelve previous Messenger cases plus five preview utility cases and two tests executing the actual page callbacks. Added coverage includes ordering, stale snapshots with sends/edits/deletions, newer server snapshots, recipient identity, missing recipient data, deterministic conversation time ties, malformed/unrelated events, pagination offsets, and superseded buffer ownership. The page tests locate `applyMessage` and `refreshConversations` in the actual TSX syntax tree and transpile them with installed TypeScript. HTTP and state setters are stubbed; React/browser state, credentials, and PostgreSQL are not involved.

No markup, layout, styling, backend contract, schema, credentials, or provider setting changes. The unrelated primary checkout remains untouched. Loopback fixtures use labeled memory-only data; their sources, dummy cookies/tokens, API URL, and preview outputs stay out of Git and production settings.

## Boundaries

- The backend sidebar does not expose message IDs. This batch does not claim to resolve every equal-timestamp message-identity ambiguity or change its pagination strategy.
- Controlled fixtures and callback tests are not live database, physical-device, or participant UAT evidence.
- Failed-send draft retention, genuine human tab-resume behavior, previous-password rejection, actual live community last-page deletion, and participant UAT remain distinct checks. No password is entered or changed by this scheduled run.

## Executed results

- All nineteen Messenger Node cases passed locally. The scoped Impeccable detector reported no findings. Whitespace validation and diff review confirm no JSX/layout/styling change.
- Final frontend lint, TypeScript checking, and production build passed. No local PostgreSQL/Docker suite was executed; database coverage requires isolated CI.
- The final production-built page showed Beta above Alpha after an older Alpha edit. A held sidebar snapshot followed by a concurrent Beta event completed with the newer Beta preview retained. These are controlled local browser observations; the deterministic callback tests isolate the snapshot race independently of focus-triggered refetches.
- Desktop 1366 × 768 and narrow 320 × 740 sidebar views retained their existing layout with document scroll widths matching viewport widths. This is emulation, not physical-device/UAT evidence. Screenshot `herbalai-sidebar-consistency-20261001.png` is saved outside Git in the local temporary directory.
- The local preview and fixture are stopped, the agent-created tab is closed, and the viewport override is reset. No fixture or build configuration is staged.

## Publication and live validation

- Repair commit `a0931f768348efb88d06a35292828682fd3f8d3d` passed temporary-branch CI `36821999859`: all 444 backend tests across 61 files and all 19 Messenger frontend cases passed, together with frontend lint/typecheck/build. After ancestry checks, the same commit was fast-forwarded to `main` and `codex/readability-accessibility`; their CI runs `36822327850` and `36822327851` passed. Vercel and Railway's `herbal-ai-staging - HerbalAiCapstoneProject` both reported successful deployment for that exact commit.
- Public frontend-proxied health, one-item herb listing, and one-item forum listing returned HTTP 200. These checks do not prove authenticated writes or email delivery.
- A fresh Mercado Chrome tab restored the existing Herbal QA contributor on live Messenger. The existing labeled Admin Admin QA conversation loaded its history and matching sidebar preview. A full reload restored authentication and the sidebar without entering a password.
- The previously missing failed-send **text draft** check now passed in the live browser: tab-scoped offline emulation was enabled, a labeled non-medical draft was submitted, and a JavaScript alert blocked the initial automation response. Dismissing the alert initially timed out; the following raw dialog recovery reported no dialog. After normal networking was restored, the composer still contained the exact draft and Send message was enabled; the displayed history and sidebar remained unchanged. This establishes text retention, not image attachment retention, successful delivery, or the exact alert wording. Screenshot `herbalai-live-draft-retention-20261001.png` is saved outside Git in the local temporary directory. The draft was then cleared, the authenticated reload checked, and the agent-created tab closed; no offline override remains.
- Gina Chrome was unavailable. No new authenticated administrator action or two-profile concurrent live event test is counted as passed. The ordering and snapshot race are covered by the failing baseline callbacks, fixed regression cases, and controlled local browser evidence, not a newly reproduced live race. No password, email request, upload, or live deletion was performed in this batch.

The remaining checks are genuine human tab resume, previous-password rejection, actual live community last-page deletion, image-specific failed-send retention, and participant/physical-device acceptance evidence. Prior reports' pending results remain historical observations; this section supersedes the text-draft and publication status for this batch only.
