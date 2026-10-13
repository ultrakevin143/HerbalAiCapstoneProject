# Exact preview-origin access

This backend-only support is separate from the frontend architecture refactor.
It lets an operator explicitly trust an additional frontend without replacing
`FRONTEND_URL` or granting blanket Vercel access.

## Configuration

`FRONTEND_ADDITIONAL_ORIGINS` defaults to empty. A nonempty value contains up to
eight comma-separated exact HTTPS origins. Credentials, paths, queries,
fragments, wildcard hosts, non-HTTPS URLs and ambiguous URL spellings fail
startup. A trailing root slash is permitted and removed. Requests still
require an exact match; suffixes and arbitrary preview deployments do not match.

The authorized origin for this task is:

```text
https://herbal-ai-staging-git-ed2888-kevinmercado987-gmailcoms-projects.vercel.app
```

Use the stable branch alias when reviewing Login/Admin. Immutable per-build
URLs are not automatically trusted. Trusting this alias means trusting future
code deployed from that branch; restrict repository/deployment access accordingly.

## Boundaries preserved

- The primary frontend remains trusted, with its existing account/email/Google
  redirect configuration unchanged.
- CORS reflects only an exactly configured origin with credentials enabled.
- Cookie mutations retain the Origin guard and missing-Origin cross-site rejection.
- Socket polling and direct upgrades use the same explicit frontend allowlist.
- Session validation, account bans, administrator roles and ownership checks
  remain mandatory after an origin matches.
- Existing loopback HTTP request allowances remain; no new loopback socket
  origins are implicitly added.
- No frontend markup, CSS, credentials, schema, migrations or data changes.

Google OAuth and verification/reset links still redirect through the primary
frontend configuration. This patch is not a preview-specific Google/email flow.
The preview shares real backend data: do not create/delete records casually.

## Local acceptance

173 tests across five suites passed using mocked persistence/providers and
loopback-only socket servers. Source and strict fixture TypeScript checks and
lint passed. The tests cover exact origin configuration, API and socket
boundaries, default production access, untrusted sites, anonymous/admin
permissions and Google destination protections. No Neon target was selected.

New suites:

- `herbalaibackend/tests/frontend-origins.test.ts`
- `herbalaibackend/tests/preview-origin-access.test.ts`

Full exact-candidate remote CI must pass before releasing support and applying
the operator-approved Railway variable. Enabling the variable requires a
backend restart. This document alone is not proof of deployment or completed
authenticated live acceptance; keep the actual CI/deployment receipts separately.

## Rollback

Remove the additional-origin value and restart the backend to withdraw preview
trust, while retaining primary-site access. Do not erase users, weaken guards,
rewrite cookies, replace `FRONTEND_URL` or permit `*.vercel.app` to achieve this.
