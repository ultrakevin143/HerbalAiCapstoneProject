# Forum ID range validation — 1 October 2026

## Finding and reproduction

Thread and ThreadComment IDs are Prisma `Int` fields. Forum validation checked JavaScript safe integers but did not cap them at the database's positive signed 32-bit limit, 2147483647. Out-of-range thread/comment route parameters and numeric/string parent-comment IDs therefore reached repository operations instead of being rejected as invalid input. This creates an avoidable database-error path; no deliberate overflow query was sent to the live database before repair.

A controlled HTTP-router regression covering eight ID-bearing endpoints reproduced **28 failed and three passed cases** before repair. Repository methods were mocked: these results establish missing validation and repository calls, not an observed live PostgreSQL failure. Valid ID controls included the maximum supported thread ID and numeric/string parent IDs.

## Repair

The existing shared forum parser now caps both accepted input types at 2147483647. Existing positive-integer syntax and rejection of malformed/unsafe values remain intact. Every controller already uses this parser, so only two production lines changed. Valid missing thread IDs still return 404; out-of-range IDs return 400. Normal replies, author/admin permissions, reactions, deletion, and auditing are unchanged. No frontend file, schema migration, dependency, database connection, or credential was changed.

## Local validation

- **57 tests across five focused files passed**, including all 31 new boundary cases and existing detail, moderation, notification, and deletion regressions.
- Backend source lint, targeted test lint, production TypeScript build, and whitespace checks run before publishing the reviewed files.
- The additional real-database workflow case exercises all eight routes, both parent-ID input types, and maximum valid missing-ID handling through authenticated requests. It checks that fixture thread/comment/audit counts, views, likes, and deletion state remain unchanged by invalid requests.
- That case uses the existing guarded loopback `herbalai_test` fixture and generated test users with cleanup. No local PostgreSQL/Docker service is available, so database results must come from isolated CI before production deployment.

## Scope and pending work

Messenger's stale pre-deployment tab needs separate reconnect/history reconciliation work. It requires a frontend behavior change; the tester has been asked whether that narrowly scoped logic change is allowed under the earlier backend-only constraint. No Messenger frontend edit is bundled here. The native confirmation for the earlier disposable Messenger deletion is still awaiting the tester's click; it is not counted as a successful live deletion.

Full CI, deployment, and live read-only smoke outcomes will be recorded after execution. Formal participant UAT and historical manual evidence gaps are not replaced by this targeted validation batch.

## Executed release and live results

- Repair commit `5d356c9a1931be2851fe9f9d2221bc4cfd8573e3` passed isolated CI run `36796895656`: **444 backend tests across 61 files**, including all 31 boundary HTTP cases and all five real-database community workflow cases. Frontend lint/typecheck/build also passed without frontend source edits. This confirms authenticated invalid-ID handling and unchanged fixture state against PostgreSQL, not merely mocked repository responses.
- Remote ancestry was checked before fast-forward pushes to `main` and `codex/readability-accessibility`. Their CI runs `36797101985` and `36797101841` passed. Both `Vercel` and `herbal-ai-staging - HerbalAiCapstoneProject` reported successful deployment for the exact repair commit.
- Six live read-only checks passed through the public frontend API proxy: health 200; a one-record public forum listing 200; each of the three oversized thread IDs (`2147483648`, `9007199254740991`, `999999999999`) returned 400 with `Invalid thread ID.`; the maximum valid missing ID (`2147483647`) returned 404 with `Discussion thread not found.`. Invalid-ID checks were sent only after the repaired backend was deployed.
- No live forum record was created, liked, moderated, or deleted for this parser change. Live authenticated mutation checks are not inferred from the public smoke results; the isolated database suite covers those invalid requests. No production credential or database setting changed, and the unrelated primary checkout remains untouched.
- The Messenger frontend scope question remains unanswered at this observation. Reconnection recovery and the earlier native deletion-confirmation evidence gap remain open; they are not counted as repaired by the forum change.
