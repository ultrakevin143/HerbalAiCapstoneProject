# Preparation coverage and beginner guidance — 6 October 2026

## Actual live observation

Two ordinary, read-only public catalog requests returned HTTP 200 and 38 records. The saved second response was captured at `2026-10-06T07:14:25.639Z` (3:14 PM Manila). Its selected public fields are retained in `Docs/research/HERB_BEGINNER_GUIDE_PUBLIC_SNAPSHOT_2026-10-06.json`.

- Every one of the 38 public records has nonblank preparation text.
- 36 records have at least one reference whose recorded `supports` includes `preparationMethod`.
- Indian Heliotrope and Tanglad lack that field-specific reference tag. This is an unresolved metadata/evidence-review gate, not permission to attach an unrelated citation or invent directions.
- Preparation text is not equivalent to a complete household recipe. The observed records include food-only descriptions, traditional-use reports, standardized study formulations and explicit withholding. For example, Makabuhay and Anonas withhold oral instructions; Indian Heliotrope does not recommend preparation or consumption. Those limitations must remain visible.

This request did not insert herbs, alter public content, change source tags, regenerate embeddings, modify credentials or query the database directly. It checked public API data, not every rendered mobile modal or every possible generated answer. Source texts were not individually re-reviewed in this batch.

## Important expansion boundary

The requested fifty-candidate expansion is still unpublished. Its separate audit, `Docs/research/HERB_FIFTY_LIVE_RELEASE_AUDIT_2026-10-06.md`, records 10 content research drafts, 40 candidates without equivalent full drafts, 37 selected uploaded covers and four unresolved exact-species preparation methods. These are held research records, not fifty new live herbs or fifty cleared medicinal recipes.

The first-ten planner retains sourced food/traditional descriptions and gaps; it does not authorize publication or turn them into treatments. This batch did not re-review those fifty source ledgers or clear their publication gates. The separate twenty-existing-herb update is already live, as recorded in `Docs/testing/HERB_PREPARATION_LIVE_RELEASE_2026-10-06.md`; do not rerun that database update to deploy this code.

## Reproduced problems and focused local fixes

1. **Beginner wording omitted existing amount/frequency context.** Requests such as “Walk me through Centella asiatica step by step,” “Give a beginner guide” and the tested Tagalog/Cebuano preparation phrases omitted the recorded dosage/frequency field. Introduced a shared preparation-intent predicate for these phrases and the existing preparation wording. Both streaming and non-streaming paths now receive the actual sanitized field. Ingredient quantities remain distinct from finished doses. Unrelated botanical beginner questions still exclude dosage context.
2. **Child-related beginner follow-up did not preserve withholding.** The tested step-by-step follow-up after a child-specific question reached generation rather than the pediatric guard. Preparation intent now also participates in that follow-up guard. An explicitly adult new question remains supported; a directly child-specific question still takes precedence. No pediatric preparation or dosing permission was added.
3. **Field-specific citation coverage was not explicit in generation context.** Preparation requests now carry `preparationReferenceCoverage`: recorded field-specific reference metadata or its absence. A source title, URL or tag is not evidence of clinical approval or a complete safe recipe. No stored tags were changed.
4. **Beginner formatting needed a more explicit evidence contract.** Both system and shared transport prompts require each numbered action to be traceable to retrieved preparation text. Clarification may simplify wording but must not invent washing, equipment, water amounts, timings, substitutions, intermediate processing or storage. Alternative preparations stay separate. Descriptive/incomplete methods must be labeled “Incomplete documented method”; withheld methods must not become recipes. Food-only, external-only, traditional-report and study-formulation limitations remain intact.

The safety boundary is intentional: evidence and safety vary between herbal products, and supplements can interact with medication. General background: [NCCIH, Using Dietary Supplements Wisely](https://www.nccih.nih.gov/health/using-dietary-supplements-wisely). That background does not supply species-specific preparation steps.

## Observed validation

- Targeted pre-repair run: 9 failures, 1 pass and 77 skipped. Six failures reproduced omitted frequency context, one reproduced the child-related follow-up gap, and two established the new metadata/prompt expectations. These were mocked-provider regressions, not manufactured live outages.
- Initial post-repair beginner suite: 87/87 passed.
- Expanded beginner suite: 95 cases covering every saved public record, local/scientific-name retrieval, streaming retrieval, warnings, source delivery, withholding fallback, child follow-ups, explicit adult scope, unrelated botanical questions and unpublished-record exclusion.
- Two transport tests confirm the actual serialized streaming/non-streaming Gemini requests carry the beginner restrictions. Their responses are mocked; they do not certify real model compliance.
- Final combined run: **12 files, 349 tests passed**, duration **10.78 seconds**. Backend lint and TypeScript build also passed. The scoped tracked-file diff check passed; Git's index stayed empty.
- Tests used an intentionally unreachable loopback database URL, an empty real Gemini key and mocked provider requests. No live database suite, actual generation after deployment, physical-device check or participant UAT was represented as passed.

One added unpublished-fixture test initially asserted against an absent provider call; corrected it to assert that generation is not invoked, sources are empty and withheld content is not returned. That was a test-assertion correction, not an additional production defect.

Final command, run from `herbalaibackend` with loopback-only test settings:

```text
node node_modules/vitest/vitest.mjs run tests/herb-beginner-guide.test.ts tests/herb-preparation-rag.test.ts tests/rag-response-context.test.ts tests/dr-ai-system-prompt.test.ts tests/gemini-fallback.test.ts tests/herb-preparation-update.test.ts tests/herb-preparation-review.test.ts tests/herb-preparation-release.test.ts tests/herb-preparation-public-review.test.ts tests/built-in-herb-fields.test.ts tests/herb-expansion-batch-02.test.ts tests/herb-preparation-source-follow-up.test.ts --maxWorkers=2 --silent
npm run lint
npm run build
```

## Release state and next work

**The beginner guidance changes are local, uncommitted and not deployed.** No automatic Git commit/push occurred. No frontend styling or unrelated dirty files were changed. Preserve the previous local Centella context repair already present in `ask-ai-service.ts`.

1. Review and selectively release the three AI code files, the new beginner tests, the two transport regressions and these public evidence documents; exclude unrelated auth/mail/UI/expansion files and private recovery artifacts.
2. After deployment, submit actual beginner questions for complete recorded guidance, Centella frequency, Oregano's incomplete alternatives, food-only preparation, withheld oral methods and pediatric follow-ups. Inspect each generated action against the retrieved text; prompt delivery tests cannot guarantee every model response.
3. The later source review is recorded in `Docs/testing/HERB_PREPARATION_SOURCE_TAG_REPAIR_2026-10-06.md`: three additive tag corrections are now locally planned for the two gaps. They remain unapplied live and require database-safe release validation; do not claim a bibliography establishes a recipe.
4. Finish each held expansion candidate's sourced content, identity, preparation/safety limitations and individually cleared image before publication. Never fill missing medicinal steps from model memory merely to meet the requested count.
5. Resume the separate sourced regional-name feature afterward. It was not implemented or deployed by this preparation-focused batch.
