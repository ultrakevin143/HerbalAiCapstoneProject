# Dr. Ai greeting and introduction repair — 10 October 2026

## Reproduced problem

The user supplied a live screenshot in which “hey” received the no-verified-source medical warning, then clarified that greetings and “Who are you?” should introduce Dr. Ai. The backend treated every message as a repository question. A short greeting had no matching herb/FAQ, so both streaming and non-streaming requests selected the medical no-match fallback instead of conversational onboarding.

A new offline 40-case regression file reproduced this: before the repair, 26 cases failed and 14 passed. No production AI prompt, embedding or provider call was made for this reproduction.

## Focused repair

`prepareDrAiContext` now recognizes anchored, standalone greetings and self-introduction/capability questions before catalog retrieval. Examples include hi, hey?, hello, hello Dr. Ai, good morning, kumusta, Who are you?, What can you do?, Introduce yourself and What is your name?. They receive a shared friendly introduction explaining that Dr. Ai is an AI assistant for documented Philippine medicinal-plant information, can help explore uses/preparations/warnings, and is educational rather than a diagnosis or prescription.

The common prepared-context path supplies this reply to both normal and streaming responses. It uses no herb citation, embedding, repository read or model request. Existing conversation history is not deleted. Only exact standalone intents take the fast path: “Hi, how do I prepare Lagundi?”, disease/cure questions, child-dose requests and greetings combined with treatment instructions still use the existing grounded/safety flow. Dangerous-topic blocking remains in the application wrapper. Cancellation is honored before preparation and while reading the stream.

No frontend styling, provider settings, source threshold, medical preparation policy, credit reservation/refund or pricing behavior changed. Under the existing one-credit-per-completed-response policy, an introduction remains a completed response; this repair does not silently make greetings free or bypass the zero-credit guard.

## Observed validation

- Initial reproduction: 26 failed / 14 passed across 40 new cases.
- After repair: all 111 cases across the new introduction file plus herb follow-up, pediatric conversational help and RAG-context suites passed.
- Broader chat/cancellation/history/request-lifetime/safety/credit HTTP selection: 208 cases across eleven files passed, no failures.
- Backend source lint and production TypeScript build passed.
- Strict TypeScript for the new test passed after correcting its fixture's role type to the application's ChatTurn type; the fixture was added to the existing CI strict-typecheck schedule.

Outside-Git logs in the calling task workspace: `dr-ai-introduction-before-20261010.log`, `dr-ai-introduction-after-20261010.log`, `dr-ai-introduction-regression-20261010.log`. Tests mock external dependencies and explicitly assert they are not called for introductions; these are regression results, not live model observations or a full PostgreSQL CI run.

## Publication state

The repair and this receipt are local/uncommitted. Public code remains at `2c98492b426b246cacd69327f33803763672b0c4`; the hosted TEST payment configuration is unchanged. Do not tell the user the live greeting is fixed until the reviewed batch has passed remote CI, the watched backend branch is released and one bounded live introduction check succeeds. Next: reviewed selective commit to the existing CI branch, exact-SHA CI, approved live-branch release, then at most one live greeting/self-introduction check rather than repeated model calls. Main and unrelated changes must remain untouched.
