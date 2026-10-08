# Focused release/error audit — 8 October 2026

Scope: current GitHub release/CI, safe live public reads and isolated administrator herb-edit probes. Requested work was to find and report defects, not to modify production content or add translation. No live write, credential change, application repair, commit or push was performed.

**Subsequent local-repair update, 8 October:** the historical audit below is preserved. Its four findings now have focused local repairs in the uncommitted candidate; two additional wallet defects and a lint warning were repaired in the later pass. See the root `ERROR_REPAIR_SUMMARY_2026-10-08.md` for current status, reproduced regressions, 2,026 selected backend passes, 26 isolated wallet database passes, 393 frontend passes and precise outstanding gates. The original failed remote CI was not re-run here, and mock admin-edit checks do not close real pgvector acceptance. No new production release is implied by this update.

## Current release facts

All three remote branches (`main`, `codex/readability-accessibility`, `codex/mvp-acceptance-ci`) were observed at **245c4286bbc190b9cb1904807983afbd2f3f7e0d**. This supersedes the older ban-release-only branch status. The local checkout was clean when this audit began. Railway and Vercel reported successful deployments for this commit; failing GitHub CI does not, in this configuration, mean the running providers are offline.

Frontend lint/typecheck/regressions/build passed in job 113253596018. The PostgreSQL preparation gate passed (run 37759930934). The general CI runs on all three branches failed. Main run [37759930938](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37759930938) passed 2,124 tests and 140 files, but one suite failed to initialize. Expected error logs from provider-failure/rollback tests were not mislabeled as new defects.

## Confirmed issues

### 1. High release-gate priority: full backend CI is red

- Location: `.github/workflows/ci.yml:67`; `herbalaibackend/tests/herb-expansion-educational-release-database.test.ts:12`.
- The suite reads `HERBALAI_TEST_DATABASE_URL`, defaulting to an empty string, then validates it at line 13. The general Vitest CI step supplies `DATABASE_URL`, but not this dedicated test variable. Its existing URL uses `localhost`; this new suite deliberately requires `127.0.0.1` and `/herbalai_test`.
- Actual GitHub failure: **Invalid database connection configuration**, before this suite's tests start. This is a CI configuration defect, not evidence that Neon is down.
- Proposed repair: supply the dedicated loopback-only test URL in that CI step and retain the production-target refusal. Do not fall back to production credentials or remove the safety check. Re-run full isolated PostgreSQL CI on the reviewed correction before publication.

### 2. Medium functional priority: ordinary admin herb edits retain obsolete AI vectors

- Location: `herbalaibackend/src/controllers/herb.controller.ts:313`, especially its update data at line 326; frontend caller `herbalaifrontend/app/admin/page.tsx:475`.
- A preparation edit updates the public text and invalidates the response cache, but does not generate/update or invalidate its stored embedding. The existing source rows are also not revised by this operation.
- Isolated HTTP reproduction used the actual controller and audited-mutation helper, with mocked database boundaries. The edit returned **200**, changed the preparation, and retained the exact old vector. The desired-behavior probe failed as expected.
- Impact: semantic retrieval can continue ranking the herb by pre-edit content. This is not proof that every current vector is stale, nor proof that named lookups already return the wrong preparation. The two earlier source corrections used their own guarded, atomic vector refresh and are unaffected by this finding.
- Proposed repair: centralize reviewed herb editing with field validation, source attribution and a targeted current-input embedding update; ensure failures cannot leave a partially published change. Add transaction/provider-failure regressions.

### 3. Medium data-integrity priority: admin editing does not check scientific-identity collisions

- Location: `herbalaibackend/src/controllers/herb.controller.ts:303` and line 323.
- The collision check covers a changed local name only. Changing only `scientificName` bypasses that lookup.
- An isolated HTTP probe modeled another herb with the target scientific identity. The controller returned **200** rather than rejecting the duplicate. This proves the controller's missing identity guard; no duplicate was created in the live database.
- Proposed repair: use the existing canonical botanical-identity rules on edits, exclude the edited record and enforce the check transactionally. Do not assume every shared vernacular name represents the same species.

### 4. Low robustness priority: malformed admin name input becomes a server error

- Location: `herbalaibackend/src/controllers/herb.controller.ts:300` and line 301.
- Sending `{ "localName": 42 }` calls `.trim()` on a number. The actual controller reaches its error path; the isolated production-style handler returns **500**, not a client validation response.
- Normal form inputs are strings, so this is an API validation edge case, not evidence that ordinary login or Library viewing fails.
- Proposed repair: validate a bounded partial edit schema before database access, return **400** for invalid types/blank required text, and reject incompatible fields. Apply the same schema to frontend feedback without exposing internal errors.

## Executed safe checks and limits

- Live health: **200**.
- Live paginated catalog: **200**, **88** herbs.
- Indian Mallow, Holy Basil and Luplupit searches: **200**, exactly one result each.
- Repeated `search` parameters: **400**; nonexistent herb: **404**; anonymous `/api/auth/me`: **401**.
- Non-numeric page input defaulted safely to the first page (**200**), consistent with the current pagination policy; it was not reported as an invented defect.
- Three local desired-behavior probes failed, independently reproducing issues 2–4. These intentional audit diagnostics are outside the Git checkout; they are not production code or newly committed failing tests.
- The exported controller used by those probes was compared with the current checkout and was identical. The mocked boundaries do not claim a real PostgreSQL execution or an authenticated live write.
- No new frontend runtime failure was reproduced in this bounded pass. Its current CI passed; that is not a claim that every interactive feature/device is bug-free. No password handoff, new email, participant result or physical-device result was invented.

Diagnostic test and log:

`C:\Users\Hp\Documents\Codex\2026-10-07\what-can-you-proposed-fix-for\ban-release-5fff94ce6d394d8b8532832eac5327de\checkout\herbalaibackend\tests\release-audit-diagnostics.test.ts`

`C:\Users\Hp\Documents\Codex\2026-10-07\what-can-you-proposed-fix-for\ban-release-5fff94ce6d394d8b8532832eac5327de\mvp-audit-diagnostics.log`

Recommended repair order: fix the full CI configuration first; then address the shared administrator-edit path (current vectors, identity collisions and request validation) with new regressions and isolated PostgreSQL verification. This report is not a completed full-MVP acceptance certificate.

## Translation proposal requested during audit

Google Cloud Translation supports Filipino (`fil`/`tl`): https://docs.cloud.google.com/translate/docs/languages . Billing is required: https://docs.cloud.google.com/translate/docs/setup . Standard NMT pricing includes a monthly allowance/credit for the first 500,000 characters: https://cloud.google.com/products/translate/pricing?hl=en . This is not unlimited free translation or a quota guarantee for every translation product.

Proposed implementation, not performed: reviewed static Filipino UI labels; backend-authenticated translation of selected public content; locale/content-hash caching and English fallback; unchanged scientific names, URLs and IDs; human review of preparation, dosage and safety wording before displaying translations as reviewed content. Do not send credentials or private messages through the translation API, expose API credentials in frontend code, or enable billing without the owner's action. Finish confirmed defects before expanding the release scope.
