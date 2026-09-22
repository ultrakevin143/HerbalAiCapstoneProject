# Herbal-Ai Defense Readiness Completion Record

Date: 22 September 2026  
Branch: `codex/readability-accessibility`  
Staging frontend: `https://herbal-ai-staging.vercel.app`  
Staging backend: `https://herbalaicapstoneproject-staging.up.railway.app`

## Result

All machine-executable defense gates completed successfully. Remaining acceptance work requires five real UAT participants, one physical-device sign-off, and adviser/panel review. No credentials, tokens, cookie values, personal messages, database rows, or environment-variable values are included in this record.

## Automated regression and build

- Backend production build: passed.
- Backend regression: **176/176 tests passed across 31 files**.
- Frontend lint: passed.
- Frontend TypeScript and production build: passed with 20 routes.
- Defense preflight automated gate: zero failures.
- Read-only Chrome rehearsal: zero failures at 390×844 and 1440×900.
- Browser rehearsal covered public routes, responsive overflow, Lagundi search/detail open-close, mobile navigation, and signed-out protection for Dr. Ai, Suggest Herb, Admin, and Messenger.

## Staging cleanup

An exact database cleanup query checked the `[TEST 20260921]` Messenger messages, Community discussion, and related notification links. It found zero matching records, confirming the earlier browser cleanup had completed.

## Backup and isolated restore proof

Command: `node scripts/verify-database-backup-restore.mjs`

- Created an in-memory logical snapshot of every application table without writing row data to disk.
- Restored the snapshot into a uniquely named temporary schema in the configured Neon database.
- Compared source and restored row counts plus canonical content digests per table.
- Dropped the temporary schema automatically.
- Result: **17/17 tables passed, 169/169 rows verified, 786,127 serialized bytes**.

This proves application-table data serialization and isolated restoration for the current database. It does not replace the hosting provider's retention policy or a full `pg_dump` disaster-recovery rehearsal with roles, extensions, ownership, and database-level configuration.

## Security configuration review

| Control | Result | Evidence |
|---|---|---|
| HTTPS/HSTS | Pass | Vercel staging returned HSTS with subdomains and preload |
| Frontend browser headers | Pass | Deployed `nosniff`, `SAMEORIGIN`, strict-origin referrer policy, and camera/microphone/geolocation restrictions |
| Backend headers | Pass | Railway API returned content-type, frame, XSS, and referrer protections |
| CORS | Pass | Credentialed CORS returned the exact Vercel staging origin; preflight returned supported methods/headers |
| Authentication cookies | Pass by source and regression | Production cookies are HTTP-only, Secure, and SameSite=None for cross-site Vercel/Railway authentication |
| Rate limiting | Pass by source and regression | Login, signup, email-link, and Dr. Ai endpoints have bounded per-IP limits |
| Authorization | Pass | Admin routes use authentication plus role guards; live contributor `/admin` denial was previously recorded |
| JWT startup safety | Pass | Production now refuses default or shorter-than-32-character JWT secrets; regression test added |
| Repository secret audit | Pass | Only `.env.example` is tracked; no live Gemini, OAuth, JWT, Neon, Railway, Cloudinary, or private-key pattern was found |

## Post-deployment performance

Runner: `node scripts/run-staging-performance-test.mjs`  
Samples: 20 measured requests per target after one warm-up request.

| Target | p50 | p95 | Maximum | Errors |
|---|---:|---:|---:|---:|
| Vercel homepage | 82.5 ms | 277.5 ms | 380.9 ms | 0/20 |
| Railway API health | 238.8 ms | 291.7 ms | 414.7 ms | 0/20 |
| Railway/Neon public herb catalog | 257.7 ms | 355.8 ms | 463.4 ms | 0/20 |

These measurements are a low-volume defense-readiness sample from one workstation, not a production-capacity or 500-concurrent-user certification.

## Human sign-offs still required

1. Five participants must complete `Docs/UAT_RESULT_FORM.md` using `Docs/UAT_TEST_SCRIPT.md`.
2. A project member must complete `Docs/PHYSICAL_DEVICE_ACCEPTANCE_2026-09-22.md` on the actual presentation phone/tablet.
3. The project manager and adviser/reviewer must sign `Docs/UAT_SUMMARY.md` after defects are reconciled.

