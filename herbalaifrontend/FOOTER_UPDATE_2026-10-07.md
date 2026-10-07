# Footer update — 7 October 2026

Scope: frontend presentation and frontend tests only. No backend files, database records, credentials or production deployments changed.

## Changes

- Reuses the existing BrandMark SVG, editorial typography and light/dark color tokens.
- Adds quick links to Home, Library, Dr. Ai, Community, Suggest a herb and About. Protected destinations retain their existing sign-in behavior.
- Adds text-based PITAHC, TKDL, Kew and StuartXchange reference links, not institutional logos or endorsement badges. External links identify new-tab behavior and use noopener/noreferrer.
- Keeps Sources & methodology, adds Privacy policy, and retains educational/non-endorsement notices and conditional Mount Isarog photo attribution.
- Uses semantic navigation, visible focus styling, 44-pixel minimum link targets and no new image downloads or animations. Footer Next links disable prefetch to avoid eagerly fetching every destination.

## Observed validation

- `node --test scripts/footer.test.mjs ../scripts/sources-methodology.test.mjs ../scripts/library-accessibility.test.mjs`: 11 passing checks.
- `npx eslint components/Footer.tsx scripts/footer.test.mjs`: passed after fixing a test-loader variable naming rule.
- `npx tsc --noEmit`: passed.
- `npm run build`: passed, including TypeScript and all 23 generated pages.
- Whitespace diff check: passed.
- Actual production-build browser preview at desktop 1280 x 900, mobile 390 x 844 and narrow mobile 320 x 844. Document/footer widths stayed within the viewport; all inspected footer links were at least 44 pixels high.
- Light footer background: rgb(255, 255, 255); dark footer background: rgb(36, 43, 38). Theme was changed through the existing sign-in theme toggle, then restored to light; temporary viewport overrides were reset.
- PITAHC, Kew and StuartXchange source pages were accessible through web verification. TKDL's external fetch could not be verified with that tool; its existing project reference URL is retained, not claimed as a passed external availability check.

The existing root `scripts/sources-methodology.test.mjs` was minimally updated to mock the reused BrandMark and remove Next-only prefetch props from its mock anchor. It is a frontend test helper, not backend code.

## Preview and evidence

Local preview: http://127.0.0.1:4396/about — scroll to the footer. The loopback Next production server was left running for review. Its configured local backend is not running; the About page's unavailable-data/session notices are outside this footer change and were not modified or counted as successful API tests.

Screenshots in git-ignored `tmp/`:
- `footer-desktop-2026-10-07.jpg`
- `footer-mobile-2026-10-07.jpg`
- `footer-dark-2026-10-07.jpg`

This footer is not live yet. Review only the footer component, footer tests and related frontend-test helper before any selective release. Preserve the unrelated working-tree edits.

## Selective live-branch release preparation

The final user-selected target is `codex/readability-accessibility`. Leave `main` unchanged. Include the previously uncommitted `/sources` page so the footer does not link to a missing route.

- The isolated candidate passed all 315 selected frontend regression tests, full frontend lint, TypeScript checking and a production build with all 23 generated pages.
- The wider regression run initially detected that CI did not schedule the new sources test. A focused addition to the frontend CI job now runs the footer and sources tests; the corrected combined suite passed. Existing unrelated local workflow edits are excluded.
- The frontend and workflow at the reviewed `main` base and live-branch base were identical before applying this footer bundle. The final commit is based on the live branch and includes only six reviewed frontend/documentation/test files, including that frontend CI step. No backend changes are included.
- No production environment files, credentials, local fixtures, generated screenshots or unrelated herb changes are included.

These are local validation results before publication. Provider deployment and live smoke-check outcomes must be confirmed separately; a successful Git push alone does not prove deployment.
