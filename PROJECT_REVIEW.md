# Herbal-Ai project review

Updated: 8 October 2026, Asia/Manila. This root file consolidates the latest reviewed release, live checks, limitations and next work. Historical outcomes remain in their dated reports; this is not a certificate of complete MVP acceptance or signed UAT.

## Current recorded production status

The latest code release verified in the ban work is `dbb725e0e6afe4f57566b948054f64105c900ea4`; the exact CI, Vercel, Railway and live ban-test receipts are in [USER_BAN_REVIEW.md](USER_BAN_REVIEW.md). The subsequent two-herb preparation/source correction is live data maintenance, recorded below; it did not push code, change hosting branches or modify main. Do not mistake the earlier Library release table for the latest ban release.

## Earlier Library-to-AI production release

| Item | Verified receipt |
| --- | --- |
| Release commit | `f922b9eeb37af7bee14c7e722988e4de039d0d6b` |
| Live deployment branch | `codex/readability-accessibility` |
| CI branch | `codex/mvp-acceptance-ci`, tested at the same release commit |
| Main branch | Left at `88260d93b869b1d39ffa232837ec27254f2b19ca` by this selective release |
| Frontend/backend | Vercel Production and Railway deployment receipts verified at 10:02:59 Manila on 8 October |
| Changes | Six reviewed files only; no unrelated dirty changes, fixtures, credentials, content imports or migrations included |

The release incorporated the existing canonical common-name registry/repository correction, added backend search regressions, preserved the Dr. Ai plant question through sign-in, extended callback regressions, and included the pre-release report. No force push or hosting configuration change was made. Do not attribute other tools' branch changes without a verified receipt.

## Reproduced failures repaired and retested

| Earlier failure | Observed post-release result |
| --- | --- |
| Holy Basil returned no Library result | HTTP 200, one correct Balanay / Ocimum tenuiflorum record |
| Indian Mallow returned no Library result | HTTP 200, one correct Abutilon indicum record |
| Portia Tree returned no Library result | HTTP 200, one correct Thespesia populnea record |
| Sponge Gourd returned no Library result | HTTP 200, one correct Luffa aegyptiaca record |
| Library → Ask Dr. Ai lost the question at sign-in | Callback regression tests passed; user explicitly reported “Question retained after login” |

Actual live Library UI checks independently found the correct Holy Basil and Sponge Gourd results after search debounce settled. A signed-in Luffa detail → Ask Dr. Ai exchange retained/submitted the question, completed an answer with recorded food/medicinal limits, and opened the correct Luffa record through its citation. The anonymous login roundtrip is a **user-reported manual pass**, not an agent-observed password submission.

## Current indexing and live retrieval review

Read-only live database snapshot: 10:35:52 Manila on 8 October. Public catalog IDs independently matched.

- 88 Herb rows; all 88 published and verified; public catalog total 88.
- All 88 published records have 768-dimensional vectors, including all 50 added herbs.
- Zero missing published vectors, wrong-dimension published vectors or database/public ID mismatches.
- All ten vectors compared against the older saved first-ten generation receipt now have different float32 values.
- The historical forty-missing/ten-unchanged-vector findings are **not reproduced now**. No repeat indexing job or herb import was performed.
- Coverage and changed values do not prove exact current-input freshness. No complete content-hash/generation receipt for all 88 vectors was found in the narrowly inspected handoff artifacts.

One provider batch generated three query embeddings without retries. Each intended record ranked first in actual live pgvector retrieval:

| Query subject | Intended record | Rank |
| --- | --- | --- |
| Unnamed tender young fruit, peeling/slicing, soups/steaming and safety limits | Luffa aegyptiaca | 1 |
| Holy basil leaves and recorded limits | Balanay / Ocimum tenuiflorum | 1 |
| Indian mallow, external-use reports versus laboratory evidence | Abutilon indicum | 1 |

One additional authenticated live chat asked the unnamed young-fruit question. The answer completed, cited Luffa and Bottle gourd, retained their recorded food-only/medicinal limitations and did not add a medicinal dose. Both records are relevant to the intentionally unnamed query. The Bottle gourd citation opened the correct `builtin-expansion-03-pardo-108` Library details.

These are bounded retrieval/UI results, not independent medical/source certification or proof that every possible question works. This indexing review made no direct database writes and changed no herb text, vector, image, administrator setting or authentication credential. The normal live chat may persist its conversation through the application.

## Automated validation and release gates

- Clean selective candidate: committed lockfile installs, Prisma generation, backend/frontend lint and TypeScript checks, and a frontend production build with 23 generated pages passed.
- Pre-release local suite: **1,321 non-database backend tests across 78 files** and **346 native frontend regressions** passed.
- Local database-dependent suites initially could not connect to loopback PostgreSQL; Docker/psql were absent. Those were not recorded as production failures or silently counted as local passes.
- Full isolated PostgreSQL CI passed before advancing the live branch, including migrations and backend tests. The preparation rollback/concurrency gate passed as well.
- Current focused clean-release RAG, safety, preparation and fallback suite: **106 tests across four files passed** at 10:41 Manila on 8 October. Mocked boundaries do not prove live clinical correctness.

CI receipts: [pre-release full CI](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37715131466), [PostgreSQL preparation gate](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37715131433), [live-branch full CI](https://github.com/ultrakevin143/HerbalAiCapstoneProject/actions/runs/37715711372).

## Remaining issues and evidence limits

1. **Preparation/source consistency:** the confirmed Abutilon/Lokoloko source-link and unsupported-method findings were corrected live at 17:01 Manila on 8 October, with source attribution, backups, two targeted vector refreshes and bounded checks. See the detailed correction report below. This is not clinical certification or a fresh source review of all 88 records; do not invent missing quantities or beginner steps.
2. **Vector generation provenance:** current coverage is complete, but complete generation-input freshness is not certified for every vector. After any legitimate content correction, use a backed-up targeted refresh and record the actual input hashes.
3. **Other historical findings:** regional-name display, individual image licensing/identity and review provenance are not closed by this focused indexing review. Lokoloko's occurrence field is now populated, but locality text presence alone is not verification.
4. **Acceptance boundaries:** this is not a new full-MVP, physical-device or participant UAT certification. No participant results or signatures were invented. The earlier phone inspection remains user-reported.
5. **Tool/environment limitations:** a protected Vercel preview and a timed-out Chrome automation connection were not treated as application defects. Production UI checks used the working in-app browser.

## Detailed reports, study aid and evidence

- [Release and Library-to-AI checks](Docs/testing/LIBRARY_TO_AI_RELEASE_CHECK.md): six-file scope, provider receipts, live aliases, signed-in flow and manual login confirmation.
- [Current indexing/retrieval check](Docs/testing/HERB_INDEX_COVERAGE_2026-10-08.md): fresh counts, query ranks, live chat, 106-test result and exact evidence paths.
- [Live preparation/source corrections](Docs/testing/PREPARATION_SOURCE_CONSISTENCY_2026-10-08.md): two scoped corrections, sources, audit IDs, current-input hashes, 92-test result and actual live UI/AI checks.
- [Historical herb audit with current-status update](Docs/research/HERB_POST_HANDOFF_LIVE_AUDIT_2026-10-07.md): preserved original observations and unresolved content/provenance findings.
- [Defense implementation study brief](Docs/study/DEFENSE_IMPLEMENTATION_BRIEF_2026-10-08.md): architecture, workflows, factual evidence, panel questions and limitations.
- [Reserved original defense questions](Docs/study/DEFENSE_SAMPLE_QUESTIONS_2026-10-06.md): user-supplied reference questions and screenshots, unchanged.
- [Older root issues/tests handoff](PROJECT_ISSUES_TESTS_HANDOFF_2026-09-27.md): earlier engineering history, not the current deployment or backlog count.

Raw vector snapshots, generated receipts, test logs and screenshots remain in local ignored validation directories; their paths are recorded in the detailed reports. They contain no reason to publish credentials or full vector payloads. Do not commit private environment files, reset URLs or authentication tokens. This root review and the final detailed receipts are saved locally; they have not triggered another commit/push or documentation-only deployment.

## Next focused work

Custom temporary/indefinite user bans were subsequently requested and implemented locally. Their separate root review is [USER_BAN_REVIEW.md](USER_BAN_REVIEW.md), with custom administrator-entered duration, reason, transactional revocation/audit, expiry semantics and executed checks. Production publication/testing remains governed by that report's actual release receipts; do not infer it from this earlier herb-release summary.

**8 October ban release update:** the additive migration and reviewed ban feature are live. Custom one-minute expiry, indefinite banning, manual unban and audit recording were exercised on the explicitly authorized locked `banqa_20261008` record; no real user was banned. Testing reproduced a stale audit expiry after an expired temporary ban, repaired it in `dbb725e0e6afe4f57566b948054f64105c900ea4`, passed isolated PostgreSQL CI and verified NULL indefinite audit expiry live. The QA account is restored Active with NULL reason/end and remains unable to sign in. Both deployment providers and live-branch CI passed. See the root ban review for exact times, evidence, preserved historical audit defect and the distinction between locked-record live tests and isolated real-token tests. Final receipts are saved locally; no documentation-only deployment was triggered.

**8 October preparation/source update:** Abutilon's broken `Gling.html` reference was replaced with the retrieved `Malbas.html` page and its wash description restricted to the documented leaves. Lokoloko's unsupported crushing/5–10 minute instruction was replaced with an explicitly limited historical preparation description. Existing sources 358/242 were corrected, both current-input vectors refreshed, and audit entries 262/263 committed in the same guarded transaction. The catalog still has 88 herbs and 301 sources; all other herb/source records remained unchanged. Both public pages and one real Lokoloko Library-to-AI exchange passed; 92 focused tests passed, including nine new retrieval regressions. No medical dosing or unsupported recipe was invented. Exact receipts and validation-tool limitations are in the linked report. New tests and documents remain local; no additional code was pushed.

Next, review the remaining recorded image/review provenance and regional-name presentation gates, then assemble only reviewed code/test/documentation changes for a separate release if requested. Complete catalog-wide vector generation provenance remains uncertified beyond the targeted receipts. Keep unrelated working-tree changes intact and study from the implementation brief with its explicit evidence limits.
