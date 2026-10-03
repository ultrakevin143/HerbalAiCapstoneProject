# CI release preflight — 3 October 2026

## Scope and publication status

Continued the combined release review without staging, committing, pushing or changing provider settings. Existing application repairs, UI styling and unrelated dirty documents are preserved. This batch changes only the pending CI workflow and scripts/deployment-config.test.mjs, plus release evidence. No database, credential, schema, asset or production variable is changed.

## B23 — two native deployment regression scripts omitted from CI

Priority: medium, release-validation coverage gap. The repository contains twelve scripts/*.test.mjs files, but the frontend CI job invoked only ten. Missing scripts were deployment-config.test.mjs and deployment-flow.test.mjs. A green CI run therefore did not exercise the existing Docker/browser build-variable, dotenv exclusion, migration ordering, dirty-tree/backup, bounded health-check and guarded deployment-flow checks. This does not establish a production deployment failure.

Reproduction: added a native assertion that compares the scripts directory's regression filenames with the workflow's explicit node --test commands. Running node --test scripts/deployment-config.test.mjs failed: seven passed, one failed, and the failure named both omitted scripts.

Repair: added one frontend-job step that runs both deployment regression files. The assertion remains in deployment-config.test.mjs so a future native regression file omitted from the workflow fails the deployment-configuration check. It checks the current explicit commands; it is not a full semantic GitHub Actions analyzer.

## Executed validation

| Check | Observed result |
| --- | --- |
| Baseline coverage regression | 7 passed / 1 failed; both omitted filenames reproduced. |
| Focused deployment configuration and flow | 16 passed, zero failed/skipped. Flow cases shadow external commands; no real Docker deployment, git pull, migration or health request occurs. |
| Full native regressions | Fresh run: 312 passed across twelve scripts, zero failed/cancelled/skipped. |
| JavaScript syntax | node --check scripts/deployment-config.test.mjs passed. |
| Workflow YAML parsing | Existing installed js-yaml parsed the workflow. Both jobs remain; CI branch trigger is present, eleven native commands cover twelve scripts, and backend full-suite invocation remains npm test -- --maxWorkers=2. |
| Parser availability limitation | An initial attempt to load a package named yaml failed because it was not installed. Used existing js-yaml instead; no package installed or dependency changed. |
| Backend application validation | Prior fresh result remains 759 non-DB cases in sixty files. Not rerun in this CI-only batch and not presented as a new full combined execution. |
| PostgreSQL acceptance | OPEN: seventeen locally excluded database suites still require actual isolated CI. No Docker, psql or postgres command available on PATH. |
| CI working-directory reproduction | Both deployment scripts also passed from herbalaifrontend using the workflow's exact relative command: 16 passed, zero skipped. |
| Selective manifest | 49 unique existing changed paths, eight excluded document paths, no missing or unclassified changes; index empty. |
| Bounded sensitive-pattern scan | All 49 candidate files scanned; only the preceding intentional synthetic database-error fixture matched. No private-key/provider-token/live-reset-link match observed. This is not a complete history/privacy certification. |
| Whitespace review | Normal git diff --check passed. Whole-file scanning found 32 pre-existing trailing-space lines, with no new such lines. An auxiliary diff check with autocrlf disabled treated CRLF as errors; rerunning with the repository's normal handling passed. No unrelated line-ending or formatting rewrite performed. |

The previous native total was 311; the new coverage assertion accounts for the fresh total of 312. Do not add baseline/focused reruns to acceptance totals or claim an actual GitHub execution from local YAML parsing.

## Read-only provider and branch observations

Connected Mercado Chrome was available. Read only the Herbal-Ai Railway project/service dashboard and Vercel Herbal-Ai project overview. Did not open variable values, change settings, start a deployment, purchase a plan or inspect unrelated projects.

| Surface | Observed setting/state |
| --- | --- |
| Railway live backend | HerbalAiCapstoneProject in herbal-ai-staging / staging; public domain herbalaicapstoneproject-staging.up.railway.app. Service was Online and its active GitHub deployment was successful. |
| Railway source | ultrakevin143/HerbalAiCapstoneProject, root /herbalaibackend, watched branch codex/readability-accessibility. Auto deployments enabled. |
| Railway deployment gates | Wait for CI OFF; pre-deploy npm run deploy:migrate; health path /api/health, timeout 300 seconds; Serverless OFF. No settings changed. |
| Railway availability risk | Dashboard displayed Trial and "15 days or $4.28 left", with an upgrade notice to keep services online. This is a displayed snapshot, not a spend forecast, guarantee or diagnosed outage. Account owner must review hosting continuity before the defense. No billing action taken. |
| Vercel production | herbalaiph.vercel.app, production Ready; source branch codex/readability-accessibility and commit e51942c35c573438c09a91104a40d4951f36fa50. Overview explicitly says to push that branch to update production; repository link points to herbalaifrontend. |
| Vercel CI branch | Existing codex/mvp-acceptance-ci deployment listed as Preview, not production. A later CI-branch push may still build a preview; do not treat its runtime as an isolated database or perform unauthorised writes there. |
| Git remote refs | main, codex/readability-accessibility and codex/mvp-acceptance-ci all returned e51942c35c573438c09a91104a40d4951f36fa50. |

The provider project description mentions an isolated staging database, but descriptions are not authoritative database wiring. No database connection values were inspected or changed; do not infer live/demo/Neon database identity from that description.

The currently observed production branch differs from the CI branch, closing the bounded watched-branch inspection gate. It does not eliminate every deployment integration, preview credential or concurrent-settings risk. Recheck these settings immediately before an approved push. Railway Wait for CI is off, so the proposed manual rule remains essential: full GitHub CI must pass before any update to the production-watched branch. Enabling the provider's CI gate is a separate proposed setting change, not performed here.

## Updated candidate and next action

COMBINED_RELEASE_REVIEW_2026-10-03.md now lists forty-nine paths: eighteen application source, seventeen regression files, one CI workflow and thirteen evidence/proposal files. The two additions to the preceding forty-seven-path proposal are scripts/deployment-config.test.mjs and this report. All eight unrelated evidence diffs and Desktop/local/private/generated material remain excluded.

Next requires exact selective commit/push authorization for only codex/mvp-acceptance-ci. Wait for both real GitHub jobs, including all isolated PostgreSQL suites, then propose production publication separately. Do not update main or codex/readability-accessibility, copy .next artifacts, point production at fixture databases or bypass required tests. No newly deployed application or live write-flow acceptance is claimed by this preflight.

## Subsequent CI-only authorization

The user approved the exact forty-nine-file commit/push to codex/mvp-acceptance-ci. Immediately before execution, local HEAD and remote main, codex/readability-accessibility and codex/mvp-acceptance-ci were rechecked at e51942c35c573438c09a91104a40d4951f36fa50, and the index was empty. Production remains outside this authorization. Actual push and CI results must be recorded separately; approval itself is not a test pass.
