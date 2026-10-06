# Preparation references and beginner guidance — combined release run

## Reviewed scope

The initial 24-file source-tag/beginner-guidance bundle was isolated from the dirty primary and selective-release checkouts. Existing unrelated mail, authentication, frontend and fifty-herb research edits were not committed. Commit `1b3a7a8` was pushed to the existing CI branch, followed by setup repair `2ef91fa`. The latter was promoted without force to the existing provider deployment branch `codex/readability-accessibility`; `main` remained at `95cf807`.

## Observed automated gates

- Clean archived-source validation: 72 files / 1,120 non-native tests, backend build, lint and strict tooling checks passed. Native/mixed database suites were explicitly excluded locally, not claimed as passed.
- General CI `37438530355` passed for `1b3a7a8`; dedicated CI `37438530396` failed because Prisma client generation was missing before enum-dependent strict typechecking. The setup-order repair added explicit generation with synthetic loopback URLs. A new regression first failed, then the focused 39 workflow/runner tests passed.
- Corrected general CI `37438905196`: both jobs passed; backend log reports **92 files / 1,329 tests passed** against isolated PostgreSQL.
- Corrected dedicated CI `37438905182` passed strict checks, **8 boundary files / 283 tests**, guarded test migrations, the existing eight preparation-update native cases and the three independent-session source-tag cases. These are native CI results, not the local exclusive PGlite fixture results.
- Deployment-branch general CI `37439307590` passed. GitHub provider statuses for `2ef91fa` reported successful Railway and Vercel deployments. Railway visibly showed the new release Active and Deployment successful.

## Database target, recovery and applied changes

Fresh connected-provider inspection confirmed Railway's pooled Neon endpoint and the matching direct endpoint on branch `pre-railway-deploy-2026-09-20` (`br-still-waterfall-aqtagztm`), database `neondb`. The connection retained certificate verification. A full read-only recovery snapshot of the two affected herbs, all their source columns and vector text was saved outside Git before mutation; credentials were neither printed nor stored in project files. The complete published catalog identities matched the independently read live API's 38 records.

Reviewed plan SHA-256: `0bfa4db4a2a370fae9b4ba94583a453c084e9231b6f29fefaf7d81a28b51b2db`.

At `2026-10-06T08:54:28.225Z`, the serializable release committed exactly three additive `preparationMethod` tags: Tanglad source IDs **19, 20** and Indian Heliotrope source ID **21**. Audit records **147, 148** matched the plan and active administrator attribution. Post-commit full snapshot reconciliation confirmed protected fields unchanged. WHO source **22** retained only `warnings`. No herb text, image, publication state or vector was changed; existing null vectors were not filled with synthetic data.

The public API initially returned its existing cached list. After the healthy backend deployment, both the direct backend and frontend proxy returned 38 records; the proxy showed **38 nonblank preparation fields and 38 field-specific preparation references**. These reference tags can support a withholding statement or research-only limitation; they do not mean all 38 plants have a safe household recipe.

In connected Mercado Chrome, the live Library detail panels showed both Tanglad study sources supporting Preparation and the Indian Heliotrope review supporting Preparation; the WHO source displayed Safety only. Existing signed-in access survived the Library reload. No new authentication credentials were entered.

## Actual live AI checks and focused repair

The deployed Centella adult beginner question generated a sourced answer identifying an incomplete documented method, keeping the recorded 0.6 g external preparation, three daily applications and maximum one-week duration, and declining to invent water volume or steeping time. This was a real browser answer, not a mock.

The next legitimate Oregano question was refused as off-topic. Its phrase `alternative methods` matched `meth` through the application's substring guard, before RAG/model generation. The same bug also affected `method`, `methodology` and `methanol` research questions. Eight new streaming/non-streaming regressions first failed; 20 dangerous-topic cases still passed.

The focused repair replaces substring matching with explicit word-bounded dangerous terms and inflections. It does not add a named-herb exemption, bypass provider safeguards or allow drug-making requests. Local post-repair validation passed **4 files / 131 tests**, covering these boundaries, request cancellation, provider errors and beginner context, followed by backend build/lint and scoped test lint.

The Oregano repair requires its own clean CI and production retest. Remaining representative live cases are food-only Gabi, study-only Tanglad, withheld Indian Heliotrope, documented Lagundi, a pediatric follow-up and an unlisted plant. Do not count these as passed until their visible answers are checked.

## Subsequent live checks and second retrieval repair

The word-boundary repair was committed as `dc52b3c`. General CI `37441320129` passed **93 files / 1,357 backend tests**, including all 28 new safety-boundary cases; frontend checks and dedicated PostgreSQL CI `37441319886` passed. After non-forced promotion to the existing deployment branch, both provider statuses reported success. The exact previously refused Oregano question then generated a referenced answer, kept juice and infusion separate, labeled both incomplete, and supplied no invented quantity, water volume, timing or dose.

Actual browser observations also passed these specific boundaries: Gabi remained food-only with no supplied cooking time; Tanglad did not become a homemade oil/tea recipe; Indian Heliotrope withheld preparation and ingestion; Lagundi retained the recorded boiling/reduction instructions and identified missing dosing/cooling/straining/storage details. The direct child question and its subsequent `Then walk me through its preparation step by step` follow-up both withheld child-specific instructions and dosage. These observed responses are not a guarantee about every future model output. The UST Oregano source was independently revisited; it describes traditional juice/infusion uses but does not supply a standardized household recipe.

The final unlisted-species check exposed a second live retrieval defect. The answer correctly refused a recipe for `Fictionalia testensis` but the UI still cited the previous Oregano record. The fallback matched pronouns anywhere in the whole new message, including `If that plant...` after an explicit unrelated question, and consequently reused the previous named herb. This was a real source-attribution failure, not evidence of a fabricated plant record or recipe.

Four new streaming/non-streaming regressions first failed; four genuine direct-follow-up controls passed. The focused repair limits history pronoun resolution to the direct question before later sentence or conditional clauses. It preserves ordinary `How is it prepared?` and `Then walk me through its preparation...` follow-ups and still permits independent semantic retrieval rather than guessing an unlisted species identity. Local post-repair validation passed **3 files / 131 tests**, backend build/lint, scoped test lint and strict test typechecking. Its clean CI and exact live Oregano-to-unlisted sequence remain required before marking the last acceptance case passed.

## Scope still held back

The fifty additional herbs are not published by this run. Their unfinished species/photo/preparation review, sourced regional names and genuine missing embeddings remain separate work. Reserved defense questions remain unchanged. No local fixture or demo credential was deployed. This focused release is not a new claim that all MVP, physical-device or participant acceptance gates passed.
