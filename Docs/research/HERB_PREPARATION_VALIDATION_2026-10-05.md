# Preparation content and Dr. Ai validation — 2026-10-05

## Scope and final observed outcome

Existing twenty-record built-in batch, not the separate fifty-candidate queue. Fourteen locally cited preparation descriptions, one explicit harm-related hold, five unresolved preparation entries. All manifest records retain DRAFT/unverified/non-DOH status and review gaps. No new herb or image was inserted.

Read-only public API check: 2026-10-05 03:24:58 UTC, 38 records, twenty repeated preparation placeholders. This proves the local content is not yet reflected live; it does not validate a database import or authenticated AI response.

## Commands and results actually observed

Run from the selective-release-check worktree's herbalaibackend directory. DATABASE_URL was deliberately set to the unused loopback address `postgresql://unused:unused@127.0.0.1:1/unused?connect_timeout=1`; no production database credential was used.

| Check | Result |
| --- | --- |
| Initial new retrieval suite, before repair | 10 failed / 3 passed; reproduced naming, relevance and prompt gaps. The overly broad Mediterranean-common-name case was narrowed to an explicitly different scientific species; universal common-name disambiguation is not claimed. |
| Focused preparation, retrieval, import-helper and batch validation, final content | 81 passed in 4 files |
| Final broad non-database backend suite | 993 passed in 72 files; 125.71 seconds |
| `npm run build` | Passed |
| `npm run lint` | Passed |
| Strict standalone TypeScript: importer and preparation/RAG/helper tests | Passed |
| Changed tracked-file whitespace check | Passed; Git reported only LF-to-CRLF normalization notices |
| Live public catalog read | 38 records; 20 unchanged placeholders |

Focused command:

```text
npm test -- tests/herb-preparation-rag.test.ts tests/herb-preparation-review.test.ts tests/built-in-herb-fields.test.ts tests/herb-expansion-batch-02.test.ts --maxWorkers=2
```

Strict standalone check:

```text
node node_modules/typescript/bin/tsc --noEmit --module nodenext --target esnext --strict --esModuleInterop --skipLibCheck prisma/import-built-in-herbs.ts tests/herb-preparation-rag.test.ts tests/herb-preparation-review.test.ts tests/built-in-herb-fields.test.ts
```

Broad command: `npm test -- --maxWorkers=2` with `--exclude=tests/<name>.test.ts` for each of these seventeen database-dependent suites:

```text
account-recovery, auth, chat, audited-mutations, herb-governance,
knowledge-authenticated-flow, forum-moderation-flow, herb-catalog-remediation,
profile, review-publication-transaction, herbs, message-authenticated-flow,
password-settings-database, suggestion-validation, system-features,
session-rotation, herb-comments-database
```

No isolated PostgreSQL environment is available. The final broad pass includes unrelated pre-existing working-tree tests; it is not permission to publish those unrelated changes.

## Regression coverage

- Current preparation and linked references reach generation for all fourteen enriched entries plus the harm hold, using isolated mocked published fixtures.
- Scientific synonym and stored regional-name retrieval, including pronoun follow-up.
- Alphanumeric name boundaries: Atis is not selected from hepatitis.
- Explicitly different scientific species is not substituted with Philippine oregano.
- Preparation-only lexical relevance alongside close-vector selection.
- Draft/archived catalog records are excluded from direct named retrieval; repository publication filters remain unchanged.
- Streaming and regular retrieval use the same context; provider failure preserves recorded wording and withholds synthesized dose.
- Pediatric preparation/dose withholding remains intact.
- Incomplete entries stay incomplete rather than receiving a fabricated recipe.
- Embedding input includes current preparations, warnings, dose fields and botanical names.
- Citation access dates preserve actual newer reviews, use the legacy fallback only when needed, and reject malformed/impossible dates.

Tests do not establish clinical effectiveness, human safety, the quality of real Gemini paraphrases, or live retrieval after deployment. Search-indexed-only source coverage is explicitly disclosed in the content ledger.

## Focused files to review for a later release

```text
herbalaibackend/content/herbs/expansion-batch-02.json
herbalaibackend/prisma/import-built-in-herbs.ts
herbalaibackend/src/content/built-in-herb-fields.ts
herbalaibackend/src/config/drAiSystemPrompt.ts
herbalaibackend/src/services/ai/chat/ask-ai-service.ts
herbalaibackend/tests/built-in-herb-fields.test.ts
herbalaibackend/tests/herb-preparation-rag.test.ts
herbalaibackend/tests/herb-preparation-review.test.ts
herbalaibackend/tests/herb-expansion-batch-02.test.ts
Docs/research/HERB_PREPARATION_AUDIT_2026-10-05.md
Docs/research/HERB_PREPARATION_VALIDATION_2026-10-05.md
Docs/research/HERB_EXPANSION_CONTINUATION_PLAN_2026-10-05.md
```

No commit, push, deployment, Neon write or Cloudinary upload occurred. Existing unrelated changes remain untouched. The bootstrap imports content with --publish and can update live records despite a DRAFT manifest: a later push needs explicit content/release review, not simply passing software tests.

## Next acceptance gates

1. Resolve/review exact-part methods for Anonas, Langka, Suha, Mabolo and Mangosteen. Do not fill gaps from unrelated taxa, plant parts, pregnancy mixtures or laboratory extraction.
2. Independently review risk-sensitive descriptions and the indexed-only TKDL record; retain Makabuhay's harm hold and all unsupported-dose restrictions.
3. Confirm the intended Neon target, existing IDs and reviewed publication operation. Test the importer against isolated PostgreSQL before any production write.
4. Regenerate embeddings from accepted current fields; invalidate/restart catalog caching following the update.
5. After a reviewed release, check actual Library fields/citations and authenticated Dr. Ai responses by local and scientific names, streaming/fallback behavior, contraindication wording and absence of invented steps. Do not label mocked results as live acceptance.

Source URLs, review coverage and exclusions are in the companion preparation audit. At the user's one-percent remaining usage threshold, stop and continue from these two documents.

## Later all-published-record validation

The next continuation checked every one of the 38 live public records and resolved the remaining five generic local placeholders; see ALL_PUBLISHED_HERB_PREPARATION_AUDIT_2026-10-05.md. Five focused files passed 116 tests; the full non-database suite passed 1,028 tests in 73 files (160.07 seconds) with the same 17 exclusions. Build, lint and strict standalone importer/new-test typechecks passed. Coverage JSON references canonical content rather than duplicating it; the final focused recheck validates that ledger adjustment. No live write, embedding regeneration, authenticated AI acceptance, commit or push occurred.
