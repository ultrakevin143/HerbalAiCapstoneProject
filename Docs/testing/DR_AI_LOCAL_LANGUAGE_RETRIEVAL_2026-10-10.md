# Dr. Ai local-language fever retrieval

Date: 10 October 2026, Asia/Manila.
Status: local repair validated; not committed, pushed or deployed.

## Publication follow-up — supersedes the initial local checkpoint

The user authorized publication. Commit `c74ebd87f2d41a0a9f9c10f8b3ed1912eca936af` passed both exact-SHA workflows: main CI run `38015577530` (2,418 backend cases across 157 files; 399 frontend cases/build) and preparation gate `38015577515`. It was safely fast-forwarded to `codex/readability-accessibility`; `main` remained `245dafc`. Railway deployment `d69fcb5d-a8e8-485b-8746-c6488c2ed219` became Active/successful and Vercel Production `MY6Ag8t8dg5VaDL4WbsYrpHYALXD` became Ready at this SHA. Anonymous health/catalog/authentication smoke checks passed.

One actual live request for the exact reported wording still returned the no-source fallback, with eighteen → seventeen test credits under unchanged completed-answer billing. Therefore the initial lexical-only change did **not** fully resolve the live symptom-discovery issue. No successful live fever answer is claimed at this checkpoint. The new code's vector-first route could still omit a relevant catalog use record; the provider's raw ranking was not observed.

A focused follow-up adds a deterministic, bounded catalog lookup for a generic fever-discovery question whose meaningful tokens contain only `fever` (including the two whole-token local-language aliases). It selects at most two published, verified records that mention fever specifically in `medicinalUses`, not merely preparation or warnings. It carries their exact reviewed fields/references plus an explicit instruction to describe reported uses/limitations, not prescribe a fever treatment or invent dosage. As with an exact herb-name match, source distance zero denotes a lexical catalog match, not measured semantic similarity or clinical proof. Mixed/unknown topics stay on the existing vector path with its unchanged threshold. No new record or medical fact was imported.

Follow-up tests reproduced **8 failed / 30 passed** of the expanded 38-case fixture before repair. After repair **287 cases across twelve files** passed. The new cases cover both response modes, actual omission by the vector candidates, exclusions for drafts/unverified/warnings-only records, and mixed unrelated topics. A fresh exact-SHA CI and bounded live test are still required for this follow-up; do not confuse its local regression results with the earlier incomplete live release.

## Reported failure

The user's screenshot shows `mag suggest ka nga nang gamot para sa lagnat` answered with the medical no-source fallback after an earlier Bayabas exchange. It is a new fever question, not a request to continue the old herb's preparation.

The shared retrieval service applies both semantic-distance and lexical-overlap checks. Its lexical tokens were English-only: `lagnat` did not match `fever`, and conversational words increased the score denominator. A relevant, close English fever record could consequently be rejected even when vector retrieval returned it. This specific filter defect was reproduced in isolated tests; the actual vectors/provider logs from the user's live request were not available, so this report does not claim every cause of that live answer was traced.

Read-only public checks returned 88 catalog identities. The compact `/api/herbs/catalog` response omits medicinal-use fields and cannot establish their absence. The full `/api/herbs?limit=100` response contained three records with fever-related wording in `medicinalUses`, including traditional or historical reports. Their presence is not clinical evidence or permission to recommend a treatment. No database content was modified.

## Focused repair

- Map whole retrieval tokens `lagnat` and `hilanat` to `fever`.
- Exclude a bounded set of Filipino/Cebuano conversational words and generic recommendation/plant terms from lexical scoring.
- Preserve the original message for embedding, generation, answer-language choice and conversation history. Botanical-name matching is unchanged.
- Keep the existing semantic-distance threshold, source limits, pediatric restrictions, cancellation and source-only fallback. Do not fabricate a match when retrieval or embedding is unavailable.
- Apply the same shared scoring to normal responses, SSE streams, herb records and FAQs.
- Add the regression fixture to the existing strict CI test-file typecheck list.

This is a narrow fever-term retrieval correction, not a complete multilingual translation feature. It does not turn traditional-use records into prescriptions, introduce new preparation steps/doses, change billing, alter the frontend or bypass authentication.

## Observed validation

All new records/provider replies in the tests are explicitly isolated fixtures, not imported medical information.

- Before repair: new fixture **16 failed / 10 passed** of 26 cases.
- After repair: **193 passed** across seven test files, including all 26 new cases, introductions, RAG context, preparation retrieval, pediatric help, chat endpoints and credits/chat integration.
- Additional safety/cancellation/history/credits HTTP selection: **82 passed** across five different files.
- Combined targeted coverage: **275 passed across twelve files**; this is not a new full-suite/remote PostgreSQL CI result.
- Backend source ESLint, production TypeScript build and strict standalone new-fixture typecheck passed.
- `git diff --check` passed.

The new cases cover the screenshot wording, alternate Filipino/Cebuano wording, an English control, both response modes, fever FAQ retrieval, original history retention, no unintended Bayabas carryover, unrelated/distant source rejection, whole-token boundaries, child-use restrictions, unavailable generation and failed embedding.

No live AI prompts, payments, credential entry or live database writes were used for this repair. Provider dependencies were mocked for the regressions; public reads do not prove the new code is live.

## Release and continuation

The live branch remains on the earlier `1ddca4b` introduction release. Review and publish this focused batch through exact-SHA CI before a bounded authenticated live test of the reported fever query. Verify that any resulting answer distinguishes documented use from clinical recommendation and keeps source citations/limitations intact. Do not invent treatment advice merely to avoid the no-source reply.

Earlier hosted payment-history reconciliation and live zero-credit/refund gates remain separate and unresolved by this change. Preserve the two local post-release receipt edits that preceded this batch.
