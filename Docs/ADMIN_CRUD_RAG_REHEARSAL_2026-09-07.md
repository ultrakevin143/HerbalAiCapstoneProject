# Admin herb CRUD and knowledge-base RAG rehearsal — 7 September 2026

## Result

**Pass.** TC-ADMIN-03, TC-ADMIN-07, and TC-CHAT-05 passed against the local production build. Two isolated accounts, one temporary herb suggestion/herb, and one temporary knowledge-base record were used. Exact cleanup assertions passed.

## Herb catalog workflow — TC-ADMIN-03

1. An administrator completed the Add Herb form with every required field and optional metadata.
2. The resulting pending suggestion was approved through the admin console and promoted into the verified public herb catalog.
3. Public Library search displayed the exact temporary herb.
4. The administrator edited its name, medicinal use, and preparation text through the herb editor.
5. Database values and the public Library detail view both displayed the updated values.
6. A contributor received HTTP 403 for direct update and delete attempts.
7. The administrator deleted the herb through the UI and database absence was confirmed.

## Knowledge-base workflow — TC-ADMIN-07

1. An administrator created a uniquely named KB fact through the admin editor.
2. The record appeared in the KB table with its answer, category, tags, and Active status.
3. The administrator edited its question, answer, category, and tags; persisted database/table state was confirmed.
4. The Active control was toggled to Inactive and back to Active, with database state confirmed after both actions.
5. A contributor received HTTP 403 for create, update, and delete attempts.
6. The administrator deleted the record through the UI and database absence was confirmed.

Knowledge-base create/update/delete now emit `CREATE_KNOWLEDGE_BASE`, `UPDATE_KNOWLEDGE_BASE`, and `DELETE_KNOWLEDGE_BASE` audit entries. All three were confirmed for the exact temporary target.

## Live Dr. Ai retrieval — TC-CHAT-05

The browser asked the exact updated KB question while the record was active. This was a real, non-intercepted Dr. Ai stream:

- the response returned the updated KB question as its cited source;
- the generated explanation included the record's unique `green-nine` fact;
- the safety notice remained present;
- the record was deleted only after retrieval completed.

This verifies that an admin-managed record can enter the active RAG index and ground a relevant browser response. It does not establish medical correctness for arbitrary content; administrators remain responsible for verifying knowledge before publication.

## Repairs completed during this task

- Added dialog semantics, accessible names, and explicit field labels to both admin editors.
- Made both editors height-bounded and internally scrollable on small screens.
- Changed the KB two-column metadata layout to one column on phones.
- Added durable audit records for all three KB mutation types.
- Changed KB creation to return the generated record ID, enabling exact response and audit linkage.

## Verification evidence

- Browser script: `scripts/rehearse-admin-crud-and-rag.mjs`
- Screenshots: `.demo-logs/admin-crud-rag/herb-editor-320.png`, `.demo-logs/admin-crud-rag/knowledge-editor-320.png`, and `.demo-logs/admin-crud-rag/knowledge-retrieval.png`
- Browser result: both complete workflows passed with no page errors.
- Backend regression: **82/82 tests passed across 14 files** after the changes.
- Backend TypeScript build and ESLint: passed.
- Frontend standalone TypeScript, ESLint, and 18-route constrained production build: passed.
- Cleanup: exact temporary herb, suggestion, KB record, accounts, notifications, tokens, and account-owned audit records were removed; absence assertions passed.

## Evidence boundary

This is local Chrome production-build evidence with 320px emulation, a remote development database, and the configured live Gemini provider. It is not participant UAT, physical-device acceptance, staging capacity, production deployment, or adviser sign-off.
