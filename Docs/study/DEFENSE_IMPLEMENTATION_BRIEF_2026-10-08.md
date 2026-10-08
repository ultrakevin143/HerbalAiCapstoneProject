# Herbal-Ai implementation study brief

Prepared: 8 October 2026, Asia/Manila. This is a study aid grounded in the current implementation and dated test reports, not a replacement for approved SRS, SPMP, SDD or STD documents.

## One-minute system explanation

Herbal-Ai is an educational Philippine medicinal-plant repository. Users browse plant records containing names, uses, preparation descriptions, safety limits and references. Contributors can propose records for administrator review. Dr. Ai retrieves relevant verified repository records before composing an answer and presents record citations. Community discussion and private messaging support interaction. The system is not a diagnostic tool or a prescription service; a recorded traditional use or a bibliography is not proof of clinical effectiveness.

## Architecture you should be able to draw

1. The Next.js/React frontend displays pages and makes API requests.
2. The Express/TypeScript backend validates input, authenticates requests, applies authorization and runs the business workflows.
3. Prisma/PostgreSQL store accounts, plant records, sources, suggestions, discussions, messages, sessions and audit data.
4. pgvector stores 768-dimensional embeddings for semantic retrieval.
5. Google Gemini provides embedding and answer-generation services; Cloudinary hosts uploaded media.
6. Socket.IO supports real-time features. Account email is handled by the configured mail provider; do not claim SMTP is the active live transport solely because an older design document draws SMTP.

The verified current release uses Vercel for the frontend, Railway for the backend and Neon for PostgreSQL. `codex/readability-accessibility` received release `f922b9e`; `main` was left at `88260d9` in that selective release. A future VPS design is not evidence that a VPS/Nginx deployment is already operating.

Implementation anchors: `README.md`, `herbalaibackend/src/routes/index.ts`, `herbalaibackend/prisma/schema.prisma`, `herbalaibackend/src/services/ai/chat/ask-ai-service.ts`. Read the approved design documents alongside these; flag historical architecture differences rather than memorizing them as current facts.

## Explain the Library and AI separately

- Library text search filters published, verified records and uses canonical-title mappings for reviewed common-name aliases. Its pagination/count behavior is not the same operation as vector search.
- Dr. Ai first checks for an explicitly named catalog record and relevant conversation context. This path can work even if a record has no vector.
- Otherwise, it embeds the question, retrieves nearby published/verified herb and knowledge-base records, and applies relevance filtering.
- It supplies retrieved record context to generation. Source-grounded fallback and cancellation/timeout handling are part of the implementation.
- The answer's cited herb opens that herb's Library details. A citation points to the record; it does not independently validate every claim in that record.
- Beginner-friendly wording must retain the source's meaning. Missing timing, quantities, steps or dosing must not be completed from model memory. Child-specific preparation/dosing requests have additional restrictions.

## Main workflows to demonstrate

1. **Library → Dr. Ai:** search an alias such as Sponge Gourd, open Luffa's details, inspect its limits/references, and use Ask Dr. Ai. The plant question is retained through login.
2. **Contribution → review:** a contributor submits a suggestion; an authorized administrator reviews it; approved eligible content becomes public. My Submissions and notifications reflect the status. Use existing sourced records or explicitly approved QA content, not a fabricated public medicinal claim.
3. **Account security:** email verification, sign-in, refresh/session restoration, account password settings and normal recovery. Password changes revoke prior sessions; the old password should fail. An optional Herbal-Ai password on a Google-linked account is distinct from the user's Google password.
4. **Discussion/Messenger:** demonstrate only with consenting test accounts and harmless content. Do not show private conversations, credentials or account-reset tokens to panelists.

These are implementation workflows, not a claim that all were freshly retested on 8 October. Consult the corresponding dated acceptance reports for each result.

## Evidence you can honestly state today

| Evidence | Scope and limitation |
| --- | --- |
| 88 published/verified database records; public catalog also 88 | Read-only live comparison on 8 October; no ID mismatches |
| 88 vectors at 768 dimensions, including all 50 additions | Confirms coverage, not exact generation-input freshness for every vector |
| Three semantic samples ranked the intended herb first | Actual live pgvector queries, not all possible questions |
| One unnamed live question returned Luffa/Bottle gourd with citations | Actual authenticated chat; Bottle gourd citation opened the correct record |
| Four common-name searches passed after release | Holy Basil, Indian Mallow, Portia Tree and Sponge Gourd |
| Question retained after anonymous login | Explicit user-reported manual pass, not agent-observed full login |
| 106 focused RAG/safety/preparation/fallback tests passed today | Clean release-code regressions with mocked boundaries |
| Full release CI and isolated PostgreSQL gates passed | Linked receipts in the release report, separate from live browser evidence |

Primary receipts: `Docs/testing/HERB_INDEX_COVERAGE_2026-10-08.md` and `Docs/testing/LIBRARY_TO_AI_RELEASE_CHECK.md`. Earlier content-review findings are in `Docs/research/HERB_POST_HANDOFF_LIVE_AUDIT_2026-10-07.md`; its historical missing-vector counts are superseded by the newer coverage check.

## Likely panel questions

- **What problem does the system address?** Explain organizing searchable, referenced Philippine plant information and moderating contributions. Support the research problem with your actual SRS/background evidence; do not invent survey findings.
- **What is your contribution?** Explain the integration of the referenced Library, moderated workflow and repository-grounded assistant. Do not claim that no similar website exists.
- **Why these technologies?** Tie each choice to a concrete implementation role: typed UI/API code, relational data and transactions, semantic retrieval, media delivery and real-time events. Do not claim benchmark superiority without measurements.
- **What methodology did you use?** Use the methodology actually approved in your SPMP/research document and explain the recorded process. This brief does not invent a methodology or rename it from the coding history.
- **How did you prove it works?** Distinguish automated unit/regression tests, isolated PostgreSQL integration/CI, live browser acceptance, user-reported checks and participant evaluation. Do not merge these categories into a fictional UAT result.
- **What happens when AI cannot answer?** Explain missing-source limitations, relevance filtering, source-grounded fallback and provider/timeouts. Do not promise uninterrupted third-party availability.
- **What are the limitations?** Educational scope, incomplete source certification for some methods, unverified generation provenance for every vector, network/provider dependence, and unrecorded participant UAT. A reported phone inspection is not a newly executed device acceptance matrix.

The user's ten original sample questions remain preserved in `DEFENSE_SAMPLE_QUESTIONS_2026-10-06.md`; its screenshots and wording are unchanged.

## Before presenting

Use the live site with a prepared, private test account. Keep credentials and private inboxes out of screen sharing. Choose a record with inspected references and explain food/traditional/laboratory limits rather than treating every preparation as validated treatment. Keep the dated test reports available. Rehearse the browser path once; avoid repeated AI requests or public test-record writes merely to practice narration. Record any instructor-required participant or physical-device evidence honestly instead of signing it on another person's behalf.
