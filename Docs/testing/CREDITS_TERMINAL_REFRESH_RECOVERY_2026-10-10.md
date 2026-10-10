# Credit checkout terminal-status refresh recovery

Date: 10 October 2026, Asia/Manila.

## Scope and reproduced issue

The deployed baseline is `39a364341765eb4d8e5dccaa336494a654ebad3f`. This continuation audits checkout return/status recovery without creating any hosted checkout, modifying production data or consuming AI credits.

One new frontend failure was reproduced: after an owner-facing status check confirms a purchase as PAID or EXPIRED, cleanup previously waited for the subsequent GET wallet response. If that GET fails, the old purchase request key and checkout links remain. A deliberate new purchase then reuses a terminal order's key instead of generating a new one. The server still prevents duplicate grants; this is a client recovery defect, not evidence of stolen or duplicated credits.

The new regression initially failed with `true !== false` because the terminal checkout key remained in the map. Evidence outside Git: `wallet-terminal-refresh-before-20261010.log`.

## Focused local repair

- Only a successful, schema-valid, matching purchase ID with server-confirmed PAID/EXPIRED releases its owner's tracked checkout key.
- Remove the matching Continue link immediately, and update only that purchase's cached status so an obsolete Resume link cannot survive a failed refresh.
- Preserve unrelated package/owner keys. Unconfirmed PENDING/UNCERTAIN/CREATING, malformed responses, failed requests, former-account responses and unmounted components do not release keys.
- Do not fabricate a new balance, ledger entry or payment; those still require wallet retrieval from the backend. The refresh error stays visible for retry.
- Existing styling, payment disclosures, safe external URLs and backend protections remain unchanged.

Changed production source: `herbalaifrontend/components/CreditsWallet.tsx`. Regression source: `scripts/credits.test.mjs`.

## Observed validation

- **102/102 Node regression cases passed** across credits, Dr. Ai streaming and session refresh, with zero failures/skips. New checks exercise both terminal states followed by failed GET, immediate link/status cleanup, fresh UUID creation, unchanged cached balance, other-package/account isolation, unresolved-state retention and unmounted-response protection.
- Focused frontend ESLint and `tsc --noEmit` passed.
- The final optimized constrained build passed, including the purchase-status update. Constrained builds run TypeScript separately after a passing `tsc --noEmit`; local API targeting is explicitly loopback, never Neon or the hosted backend. Evidence outside Git: `wallet-terminal-refresh-build-final-20261010.log`.
- `git diff --check` passed.

## Browser limitation and cleanup

A credential-free local API fixture started on `127.0.0.1:5000`, but the environment explicitly blocked launching the Next preview on port 4610. No alternative launch was attempted to bypass that restriction. The owned fixture was stopped afterward. No browser UI acceptance or screenshot is claimed for this new patch; the earlier live release checks do not certify unpublished code.

Fixture, build output and logs stay outside the release bundle. No migration, hosted variable, admin session/password, QA balance, checkout, provider payment, Git commit or push changed during this continuation. Unrelated pending documents remain preserved.

## Next gate

Review this two-code/test-file patch, run exact-SHA CI if publication is authorized, then deploy and verify normal status recovery. The intentionally failed wallet GET must be tested only in an isolated local/staging fixture; do not manufacture a production outage. Genuine provider expiry/unknown-creation recovery, real-money merchant readiness and physical-device/participant acceptance remain separately bounded work.

## Release-validation continuation

The user authorized proceeding with browser validation, CI and a gated release. Fresh remote refs still showed `39a3643` for both live and CI branches, with `main` unchanged. The focused 102-case selection passed again without failures/skips. Only the two reviewed code/test files, this report, the preceding live-release receipt and the root review are included in the candidate. Four unrelated pending toolbar/language/PWA/checkout documents remain unstaged; local fixtures and build output are excluded.

The blocked preview launch was not bypassed. The user was asked to start the existing loopback-only build using the ordinary frontend command. Exact-SHA CI can proceed meanwhile, but production publication remains gated on observed browser validation. No new production payment, checkout, credit grant, AI prompt or credential change is authorized or needed for that isolated failure test.
