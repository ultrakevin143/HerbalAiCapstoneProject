# Dr. AI model and fallback repair — 6 September 2026

The previous default attempted a retired model first and could wait indefinitely for each provider attempt. Defaults now use `gemini-3.5-flash-lite`, `gemini-3.6-flash`, then `gemini-2.5-flash-lite`. All three were present in the model list returned for the configured API key. Google documents Gemini 2.0 Flash as shut down: https://ai.google.dev/gemini-api/docs/models/gemini-2.0-flash?hl=en . Current model reference: https://ai.google.dev/gemini-api/docs/models?hl=en .

`DR_AI_CHAT_MODELS` controls the ordered list; `DR_AI_MODEL_TIMEOUT_MS` defaults to 7000, clamped to 1000–20000 ms. Each chat attempt passes the timeout to the existing SDK, which aborts its HTTP request. The previous fixed 500 ms delay between different fallback models was removed. Compose and the root environment template use the same defaults. The local backend dotenv had no model override, so the updated default takes effect without changing secrets.

Streaming can fall back before model text is emitted. If a model has already emitted text and fails, the stream reports failure rather than combining answers. Its concurrently aggregated response promise now has an immediate rejection handler, preventing an unhandled rejection when iteration fails. Existing grounding instructions, history limit and safety settings remain in use.

These are per-attempt chat timeouts, not a whole-endpoint deadline. With three configured models, generation can take roughly 21 seconds plus retrieval, embedding, transport and scheduling. Embedding calls and database queries have separate behavior. A passing local run does not guarantee provider availability or prove staging latency targets.

## Verification

- Five tests using the real SDK with mocked HTTP transport passed: fallback on provider error, abort on timeout, exhaustion, fallback before stream text, and timeout after partial text without another model call. No live provider requests occur in these five checks.
- Added a live authenticated SSE regression that requires generated chunks beyond the initial source acknowledgement, Lagundi-only sources, a final done event, and returned history matching assembled chunks.
- Final full backend suite: **53/53 tests, nine files, passed in 24.37 seconds** on 6 September 2026. This supersedes the historical 45/47 result. It includes the live grounded-answer, multi-turn and SSE checks.
- Backend TypeScript build, ESLint and git whitespace checks passed. No long-running demo services were started for this repair.

The live checks use authorized test JWTs as in the existing backend suite and perform repository reads and model inference. No accounts or herb records were created. Further browser/UAT and staging performance work remain in the roadmap.
