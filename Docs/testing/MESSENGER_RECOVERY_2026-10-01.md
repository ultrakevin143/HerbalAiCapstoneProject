# Messenger connection and history recovery — 1 October 2026

## Finding and scope

The previous live Messenger record showed that an already-open receiver did not display an edit until reloading. That observation does not establish a single network cause. Source inspection found that the client captured one socket token during initial setup and did not reconcile active history after reconnection. It also allowed an old history response to replace the conversation selected more recently, and depended on socket delivery to display successful HTTP mutations.

This batch changes Messenger behavior and adds regression coverage. Existing page markup, classes, colors, and layout are retained; the mobile Back button additionally invalidates its pending history request. There is no backend, database, credential, email-verification, or provider configuration change. Work is confined to the managed release worktree, not the unrelated primary checkout.

## Repair

- Fetch a fresh authenticated socket token for every handshake. Temporary token-fetch failures have three scheduled retries; blank tokens never fall back to guest authentication. Token endpoint authorization failures and server-initiated session disconnection request a session check. Unmount cancels retries and invalidates pending token callbacks.
- Reconcile the conversation list and selected contact's latest history after connecting, and when a visible tab resumes through focus/online/visibility events. Resume events are throttled. Selected contact and composition state are not cleared by background reconciliation.
- Version history requests so responses for an old contact, superseded request, or closed conversation cannot replace the current view. Buffer concurrent message updates and replay them against the returned snapshot. Deduplicate by message ID and sort timestamp ties by ID.
- Keep events scoped to their actual sender/receiver pair. Edit/delete events update loaded messages rather than inserting an unloaded older record into the visible page. Pending history reconciliation can still apply an edit to a record returned in that snapshot.
- Apply successful send/edit/delete HTTP responses locally, independently of a socket broadcast. Clear the outgoing draft/attachment after success, not before sending.

Background recovery intentionally reloads the latest 50-message page with a fresh older-history cursor. Previously loaded older pages are not retained across that refresh; the user can load them again. This is not a claim that every historical page is retained offline.

## Automated and controlled local evidence

`node --test scripts/messenger-sync.test.mjs` passes **12 cases** against the actual production utility, transpiled with the project's installed TypeScript. They cover merge/order/conversation isolation; loaded-only edits/deletions; superseded/cancelled history; concurrent updates and stale snapshots; exclusion of ancient edits from a latest page; malformed rows; fresh tokens and reconciliation; bounded temporary retries without guest fallback; authorization/session failures; cleanup; out-of-order token responses; and blank-token/recovery handling. The frontend CI job now runs this suite.

Frontend ESLint, TypeScript, and production-build checks are executed for this batch. Their final outcomes and release CI are recorded below after completion. The scoped Impeccable detector reported no findings. Its result is a limited static check, not proof that every device or interaction is correct.

A temporary loopback-only HTTP/Socket.IO fixture stores labeled test users/messages in memory. No real database, passwords, Gmail, Cloudinary, or public conversations are involved. Its source and dummy cookie/token values remain outside Git. The first fixture launch needed a Windows ESM file-URL correction. The preview startup initially encountered an execution-policy rejection; the user's requested retry started it successfully.

An actual Node Socket.IO client using the production connection helper passed a forced transport-close test. Authentication was accepted at fixture epochs 1 and 2, with two history reconciliations, no authorization failures, and no captured connection errors. A Beta event stayed outside Alpha's active history. This is wire/helper evidence, not a browser-page result.

The production-built page then passed these controlled browser checks:

1. Opening Alpha displayed its history. A forced transport restart changed the server's token epoch and an existing message without broadcasting its edit. The browser fetched a fresh token, reconnected, displayed the revised history automatically, and retained an unsent draft.
2. A Beta message updated Beta's sidebar entry but did not appear in Alpha's active conversation.
3. An Alpha history response was held while the browser selected Beta. Releasing the older Alpha response left Beta selected with only Beta messages.
4. An edit arrived while Alpha's old HTTP snapshot was held. Releasing that snapshot retained the edited content rather than restoring the older value.
5. With send and edit broadcasts deliberately absent, a multipart text send displayed its returned message, cleared the successful draft, and an HTTP edit displayed the new content and edited marker.
6. Desktop 1366 × 768 and narrow 320 × 740 views showed the existing conversation controls without document-level horizontal overflow. The narrow Back button returned to the conversation list. This is browser emulation, not physical-device evidence.

The first edit visibility assertion matched both a hidden sidebar preview and the visible bubble. Scoping the locator to the Conversation region confirmed the rendered edit; this was a test-selector ambiguity, not an observed application failure. During review, a separate unloaded-old-edit insertion edge case was repaired and added to the regression suite. Final rebuilt-browser confirmation is recorded below.

## Boundaries and follow-up

- The controlled fixture does not implement real PostgreSQL pagination, production authorization, image storage, or email flows. It cannot close their live acceptance gates.
- Tab-resume handlers exist and are covered by source review; a genuine human tab switch is distinct from focus emulation and is not counted as observed here.
- Live native-confirm deletion of the earlier QA message was previously blocked by Chrome automation. Do not count that check as passed or delete other messages to work around it.
- Failed-send draft retention follows the changed success-only clearing path, but a failed-send browser interaction was not executed in this batch.
- Previous-password rejection, actual live community last-page deletion, and participant UAT remain separate evidence gaps recorded in the release gate documents. The user's earlier physical-phone inspection is user-reported, not a signed UAT result.
- Local test previews must be stopped after testing; loopback fixture URLs and dummy identities must never be used in production environment variables or deployment builds.

## Release results

- Final frontend ESLint, `tsc --noEmit`, and production build passed after the loaded-only edit guard. All twelve utility regressions passed; whitespace validation passed. No local PostgreSQL suite was run because PostgreSQL/Docker are unavailable.
- The final rebuilt browser confirmed successful HTTP-only sending/editing and automatic history reconciliation after another transport restart. A synthetic edited record outside the loaded page did not appear in the conversation. Its final screenshot is stored outside Git as `herbalai-messenger-recovery-20261001.png` in the local temporary directory.
- The local preview and memory fixture are stopped, and the temporary viewport override is reset. No test credentials or loopback configuration files are included in the release.

- Repair commit `572a605e386ab8e068bb39c929991a8a75016b0a` passed temporary-branch CI `36800754633`: **444 backend tests across 61 files** and **12 frontend Messenger recovery cases**, plus frontend/backend lint, typechecking, and production builds. Backend database tests use isolated CI PostgreSQL, not the live or demo database.
- After ancestry checks, the same reviewed six-file commit was fast-forwarded to `main` and `codex/readability-accessibility`. Their CI runs `36800920743` and `36800920131` passed. Vercel and `herbal-ai-staging - HerbalAiCapstoneProject` reported successful deployment for that exact commit.
- Live frontend Messenger, frontend-proxied health, herb listing, and the actual `/api/forum/threads?limit=1` listing returned 200. An initial smoke request used nonexistent `/api/forum?limit=1` and returned 404; inspecting the router and correcting the test URL confirmed the real listing. No application route was changed to hide that test-input mistake.
- Reloading Gina Chrome restored the Admin Admin session. The existing Herbal QA conversation loaded. One clearly labeled, non-medical test message to that existing QA account was sent and edited; the bubble and sidebar updated. A fresh Mercado Chrome tab restored Herbal QA and displayed that admin message's edited history.
- In that agent-created receiver tab only, Chrome network emulation was temporarily set offline. The administrator edited the same QA message while the receiver retained the previous content. Restoring networking brought the missed edit into the receiver's conversation and sidebar automatically, **without reloading or selecting the conversation again**. Offline WebSocket errors were expected during the deliberate interruption. A first wait raced the changing DOM; the subsequent accessibility observation directly confirmed the recovered text. Network emulation was restored, capture disabled, and the test tab closed afterward. The production service was not restarted or taken offline for this check.
- Live proof is saved outside Git as `herbalai-live-messenger-recovery-20261001.png` in the local temporary directory. The labeled administrator QA message remains in the live test conversation. No personal message or other record was deleted in this batch.
- The older QA message now renders as deleted on a fresh history load, but the original native-confirm interaction was not observed to completion. This is evidence of its current rendered state, not a newly executed deletion test. The old Mercado user-owned tab still hit the previously recorded focus-emulation blocker; a fresh same-profile tab was usable. A genuine human tab-resume check and old-password rejection remain separate unobserved checks.
