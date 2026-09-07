# Mobile layout and remaining workflow verification

Date: 6 September 2026. Tester: Codex, scripted Chrome interaction and screenshot review.

## Changes implemented

- Messenger uses a conversation list or an active chat on phones, with a Back control; tablet/desktop retains the two-pane view. Message inputs shrink correctly, touch users can open message actions without hover, and Edit/Delete actions stay in the message flow instead of being clipped underneath the first-message header.
- Signed-in desktop navigation switches to the compact menu below 1280px. Notifications are available on mobile. The menu and notification drawer have viewport-bounded scrolling.
- Admin navigation collapses below 1024px. Content uses the available width, statistics use two columns on small screens, and data tables scroll within their containers instead of widening the page.
- Dr. AI places the consultation ahead of reference cards on phones, sizes its panel against the dynamic viewport and keeps its input/send controls within the panel.
- Herb details use a bounded, named dialog. Comments/replies wrap long text, allow narrower layouts and expose labelled like/unlike controls. Mobile form text uses 16px sizing; primary flat buttons and principal navigation controls have at least 44px height.

## Defects reproduced and repaired

| Finding | Before | Verified repair |
|---|---|---|
| MOB-01 | At 768px, authenticated navigation widened the page to 1124px | Compact navigation and no page overflow in repeated width checks |
| MOB-02 | Messenger's desktop sidebar left the mobile chat clipped | Single-pane mobile list/chat, Back navigation, input visibility and touch interactions |
| MOB-03 | Fixed admin sidebar consumed most of a phone screen | Collapsible menu, full-width content and accessible table scrolling |
| MOB-04 | Notifications unavailable in mobile navigation | Mobile bell and bounded drawer exercised at 320px and landscape |
| MOB-05 | First-message Edit menu opened underneath the header; touch was intercepted | In-flow action controls; first-message touch editing and desktop edit/delete retests passed |

An initially empty-looking category chart was a screenshot timing artifact during its entrance animation. Final layout screenshots request reduced motion and wait for category paths when data exists; no chart/data change was required.

## Functional results

`node scripts/rehearse-mobile-workflows.mjs` completed successfully:

| Workflow | Evidence | Result |
|---|---|---|
| Herb comments | Two contributor browsers: live post/reply, like and unlike after reload, non-owner delete denial, author deletions and reload persistence | Pass |
| Narrow herb modal | Long unbroken comment text plus a reply at 320, 390 and 430px; dialog and comments fit without horizontal scrolling | Pass |
| Mobile Messenger | Back to list, contact selection, send and touch-edit the first message; composer at 320 × 568 | Pass |
| Admin users | UI ban/unban, banned status survives reload, warmed session immediately returns 403 after ban and 200 after unban, contributor ban denied, self-ban hidden and API denied | Pass |
| Admin navigation | Dashboard, Pending Suggestions, All Herbs, Users, Knowledge Base and Audit Logs opened at 390px without document overflow | Pass |
| Logout/session | Real login-issued access/refresh cookies, UI logout, both cookies removed, session request rejected, revoked refresh token rejected by `/auth/refresh-token`, four protected routes redirect to sign-in | Pass |
| Runtime/cleanup | No captured uncaught page errors; only temporary accounts and their comments, messages, tokens and audit records removed | Pass |

Existing community/Messenger desktop rehearsal also passed again after the mobile changes, including live text/image delivery, editing/deletion, image opening and 55-message pagination. Its uploaded test asset was removed. Existing public rehearsal passed all 23 checks across mobile and desktop.

Frontend ESLint, separate `tsc --noEmit`, and the production build passed (18 routes). The constrained build skips its embedded type pass; the separate type check completed first. Backend application code was unchanged in this round; its previous recorded regression remains 55/55 tests.

## Layout matrix and evidence

Final matrix: **56/56 page-width checks passed** at 320, 375, 390, 430, 768, 1024, 1280 and 1440px (844px height), plus **7/7 landscape checks passed** at 844 × 390. Landscape navigation-drawer bounds and notification opening also passed. These counts describe the exercised layout checks, not whole-project completion or universal device compatibility.

`scripts/audit-mobile-layout.mjs` covers authenticated Home, Library, Dr. AI, Suggest Herb, Community, an active Messenger conversation, and the administrator dashboard. Checks include document overflow, main region bounds, usable chat-input width and mobile admin content width. Screenshots were inspected for representative phone/tablet pages, not merely counted as evidence.

Generated JSON and screenshots are retained locally under `.demo-logs/mobile-final/`; landscape evidence is under `.demo-logs/mobile-landscape/`; interaction screenshots are under `.demo-logs/mobile-workflows/`. These are ignored local artifacts, regenerable with the scripts.

```powershell
$env:EMAIL_DELIVERY_MODE='log'
.\scripts\start-demo.ps1 -SkipBuild
$env:AUDIT_LABEL='final'
$env:AUDIT_WIDTHS='320,375,390,430,768,1024,1280,1440'
$env:AUDIT_ASSERT='1'
node scripts/audit-mobile-layout.mjs
node scripts/rehearse-mobile-workflows.mjs
.\scripts\stop-demo.ps1
```

For the landscape run, use `AUDIT_LABEL=landscape`, `AUDIT_WIDTHS=844` and `AUDIT_HEIGHT=390`. Rebuild before using `-SkipBuild` after any source edit.

## Remaining acceptance limits

This is verified Chrome emulation and local production-build testing, not proof of perfection on every phone. Real iOS Safari/Android Chrome virtual-keyboard behavior, pinch/large-text zoom, screen readers, safe-area hardware, slow/offline connections and full WCAG conformance still require dedicated testing. Landscape checks are viewport emulation, not physical device rotation. Not every admin editing dialog or possible long-content combination was covered.

Controlled mailbox verification/reset delivery, participant UAT, performance acceptance and deferred deployment/restore checks remain open. No hosting purchase or external email delivery was performed.
