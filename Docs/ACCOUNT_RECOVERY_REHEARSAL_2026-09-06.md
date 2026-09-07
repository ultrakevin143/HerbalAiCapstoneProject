# Account recovery regression

Date: 6 September 2026. Tester: Codex API/database regression tests.

## Scope

`herbalaibackend/tests/account-recovery.test.ts` exercises Express endpoints against the configured PostgreSQL database with unique temporary accounts. The mail module is intercepted inside Vitest: no messages are delivered, and assertions check that generated verification/reset email bodies contain the correct links. This is not a browser or inbox-delivery test.

Six regression scenarios cover:

1. Signup creates an unverified account, login is denied until verification, resend replaces the prior link, unknown-email resend gives the same message, and sequential reuse is rejected.
2. Expired verification links cannot activate an account.
3. Reset requests return the same message for known/unknown addresses; short passwords are rejected; a valid reset changes the password once, rejects the old password and revokes the earlier refresh session.
4. Replaced, expired, wrong-purpose and malformed reset tokens leave the password unchanged.
5. Concurrent redemption of one password-reset token accepts one request and rejects the other; only the successful request's password is stored.
6. Concurrent redemption of one verification token accepts one request and rejects the other.

## Defect and repair

**REC-01: overlapping account-link redemption.** Both endpoints checked whether a token was active and then performed separate account/token updates. A deterministic test held both requests after their initial lookups, reproducing two HTTP 200 results for one single-use link. Ordinary unsynchronized concurrent requests did not consistently reproduce this timing window.

The repository now conditionally claims a still-active, correctly typed, unexpired token inside a transaction. Account activation or password update occurs in that same transaction. Password reset also revokes existing refresh tokens before commit. A losing request receives the existing invalid/expired-token response. Failed transactions roll back their writes, and the cached user record is invalidated after success.

The initial concurrency regressions failed before the repair and the six-scenario targeted run passed afterward. No schema migration or frontend change was required. Three newly unused standalone update/revocation helpers were removed after checking repository references.

Final regression: **61/61 backend tests passed across 11 files in 69.21 seconds**. Backend production build and lint passed. Temporary-account cleanup assertions passed.

## Reproduction and safety

```powershell
cd herbalaibackend
npx vitest run tests/account-recovery.test.ts
npm test
npm run build
npm run lint
```

Tests delete only the unique email addresses registered by that run. Related tokens are removed through the existing database cascade. Passwords and account-link tokens are not intentionally logged; failure output should still be treated as test-only diagnostic material. No personal account was reset, verified or deleted.

## Production browser follow-up and delivery probe

Executed `node scripts/rehearse-browser-recovery.mjs` against the local production demo with server-side `EMAIL_DELIVERY_MODE=log`. A unique temporary account was registered through the phone-sized UI. Verification/reset tokens were read only for that account from the database, not from a delivered email.

Passed: signup, unverified login rejection, verification, reused verification rejection, verified login, forgot-password request, password mismatch validation, reset and sign-in redirect, old-password rejection, new-password login, reused reset rejection, and missing-token messages. Five account pages at 320/390/1280 pixels passed 15 document-overflow checks. No uncaught page errors occurred. This is geometry/functional evidence, not visual-perfect or physical-phone certification. Temporary accounts and their cascading tokens were deleted after each attempt.

**REC-02 fixed:** the production global error handler masked intentional 4xx messages as “Internal Server Error,” preventing users from understanding unverified login or invalid links. It now preserves client-error messages, hides 5xx details and stacks in production, and normalizes invalid status codes to 500. Eleven new regression cases passed. Full backend suite: **72/72 across 12 files, 75.49 seconds**; backend build/lint passed. Two test selector issues (Next route-announcer ambiguity and a warning icon affecting exact text matching) were corrected in the rehearsal harness.

A separate, explicitly authorized delivery-check email was sent through the configured mailer to Kevin's selected Gmail address with a process-local recipient allowlist. SMTP accepted one recipient and rejected zero; Kevin confirmed receipt in this conversation. Inbox versus Spam placement was not specified. The message contained no recovery token; no existing personal account or password was changed. No persistent mail configuration was changed.

## Limits and next checks

### Delivered-link acceptance follow-up

On 6 September, an explicitly authorized unique Gmail plus-alias was registered as a separate test account through the production API. Process-local email allowlisting restricted delivery to that alias. The application generated its actual verification and password-reset templates and links. Kevin opened both emails on the local laptop, verified the account and chose a temporary reset password; he reported “both are success.” Read-only database evidence confirmed `emailVerified` set and both link tokens consumed. The temporary account and cascading tokens were then deleted by exact alias plus test-name ownership check. The base Gmail/admin account was not modified. No password or token was requested from Kevin or recorded in this report.

Delivered verification/reset links are therefore **Verified for this local laptop/Gmail run**. Spam placement, other email providers and physical-phone link behavior are not inferred. Reusable preparation/status/cleanup helper: `scripts/rehearse-delivered-recovery.mjs`; it refuses to overwrite an existing alias.

- SMTP probe receipt and actual verification/reset template receipt and use on the laptop are verified. Spam-folder placement and clicking delivered links on a physical phone remain unverified.
- Existing stateless access tokens retain their normal expiry (up to 15 minutes). This change revokes refresh tokens, not every already-issued access JWT immediately.
- Concurrent issuance of different links, concurrent login versus reset, and provider outage handling were not part of these six scenarios.
- Browser happy paths and selected negative states passed as detailed above; exhaustive form combinations, real-device keyboard testing and stakeholder UAT remain separate acceptance work.
