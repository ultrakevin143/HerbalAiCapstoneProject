# Prisma dependency remediation — 2026-10-01

## Findings and scope

The backend audit reported four high-severity package entries: `deepmerge-ts`, `mysql2`, and their inherited `@prisma/config` and `prisma` entries. This is not evidence of four separate exploitable application routes. The PostgreSQL application uses `@prisma/adapter-pg`; no application-source import of either vulnerable package was found in the preceding source scan. Both the full audit and the production-filtered audit still included the findings, so they were not dismissed as development-only.

- `deepmerge-ts` 7.1.5 can exhaust the stack when merging recursive object graphs. A bounded local regression against the dependency actually resolved by Prisma reproduced `RangeError: Maximum call stack size exceeded`. Ordinary JSON cannot itself encode a cyclic graph. [Advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).
- Prisma's installed `mysql2` 3.15.3 is affected by an authentication-plugin downgrade advisory and a compressed-protocol decompression-limit advisory. No rogue database server or exploit payload was sent to production. [Authentication advisory](https://github.com/advisories/GHSA-3f6p-5ww8-9rcr), [compression advisory](https://github.com/advisories/GHSA-rgwj-5xj2-c3m3).

## Reviewed repair

Two exact, parent-scoped npm overrides replace `@prisma/config`'s `deepmerge-ts` with 8.0.0 and `prisma`'s `mysql2` with 3.24.5. The manifest and generated lockfile are both committed so `npm ci` reproduces the selection. No forced audit fix, Prisma 6 downgrade, Prisma 8 release candidate, schema migration, connection-string change, or frontend edit is included.

This is an application-maintained compatibility override, not an upstream Prisma endorsement. Prisma 7.10.0 remains the newest stable Prisma 7 version observed during this review and still pins the affected versions. `deepmerge-ts` 8 changes Map merging and some custom/into APIs; the installed Prisma loader uses the named `deepmerge` export for record-based configuration loading, not those renamed APIs. Tests exercise that actual loader, real schema/migration path resolution, direct-URL precedence, and database-URL fallback. [Version 8 release notes](https://github.com/RebeccaStevens/deepmerge-ts/releases/tag/v8.0.0).

The regression resolves dependencies relative to Prisma and its config module, rather than accidentally testing another installed copy. Before repair, two of its five cases failed: recursive merging and the patched-version assertion; the three existing merge/config behaviors passed. After repair, all five must pass. Version assertions intentionally match the reviewed pins; update them together with the overrides when reviewing future upgrades. Remove the overrides once a stable upstream Prisma release selects safe versions and the same CLI/database checks pass.

## Validation boundaries

`npm ci` succeeded from the edited lockfile. All 14 assertions across the dependency, Socket.IO protocol-boundary, and moderation-authorization suites passed. The five new compatibility cases all passed after reproducing the two baseline failures. Prisma schema validation and client generation, source/test-file lint, TypeScript production build, and Git whitespace validation passed. Validation/generation used explicit dummy loopback database URLs; no live database connection was attempted.

Both `npm audit` and `npm audit --omit=dev` reported zero vulnerabilities. `npm ls` confirmed Prisma, its client, adapter, and config remain at 7.10.0, with the two exact overrides resolved beneath their intended parents. The lockfile removes three now-unused MySQL driver transitive dependencies and introduces its replacement SQL escaping dependency; unrelated dependency versions were not broadly updated.

Full database tests must run against GitHub Actions' isolated PostgreSQL/pgvector service, not a live or demo database; no local PostgreSQL runtime is available here. A clean audit is a registry result, not a guarantee that the system contains no vulnerabilities.

Any release requires successful full CI before promotion to the public deployment branch. Post-release public API checks cannot substitute for authenticated administrator/contributor write checks. Chrome profile reconnection and the previously unobserved old-password rejection remain separate acceptance gates.
