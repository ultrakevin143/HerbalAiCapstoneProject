# Herbal AI Browser Checklist Report

Date: 2 September 2026
Environment: Local production-style frontend and backend (`localhost:3000` and `localhost:5000`)
Browser: Desktop Chrome session
Scope: User-provided Herbal AI Testing Scratchpad checklist

## Summary

**13 of 13 leaf checks passed (100%).** Homepage, Library, About, Sign In, Google OAuth, and the authenticated Dr. Ai interface rendered and operated successfully. Two additional grounding prompts verified relevant-source behavior and safe handling of an unknown herb.

No test records or user data were created during this run.

## Results

| Area | Result | Browser evidence |
|---|---|---|
| Homepage | Pass | Hero displayed “Herbal AI”; Home, Library, Dr.Ai, About, Sign In, and Sign Up navigation appeared; the Preserving Heritage, AI-Assisted, and Verified & Safe feature cards rendered. |
| Library herb cards | Pass | Lagundi, Sambong, and Bayabas cards were present. |
| Library search | Pass | Entering `Lagundi` left the Lagundi result visible. |
| Herb details | Pass | Clicking Lagundi opened its detail view with scientific name, medicinal uses, preparation, dosage, region, and warnings. |
| About | Pass | The page rendered its heritage/technology introduction, core philosophy, clinical-validation content, Dr. AI explanation, and medicinal-plant list. |
| Sign In fields | Pass | One email input and one password input were present. |
| Sign In action | Pass | The Sign In button was present. |
| Google OAuth | Pass with accessibility note | A visible `Sign in with Google` link points to `http://localhost:5000/api/auth/google`. It is implemented as a link, not a button; the checklist wording calls it a button. |
| Dr. Ai route protection | Pass | A signed-out visit to `/chat` redirected to `/signin?callbackUrl=%2Fchat`. |
| Google OAuth callback | Pass | After the user selected the Google account, the callback returned to the authenticated Herbal AI homepage and displayed the signed-in user. |
| Dr. Ai chat UI | Pass | `/chat` rendered the consultation panel, message input, Send control, Reset Chat, quick-reference guidance, online state, and medical disclaimer. |
| Known-herb grounding | Pass | The Lagundi question returned verified uses and safety cautions and displayed only the `Lagundi` source card. |
| Unknown-herb grounding | Pass | `moonflower xyz` returned no source card, stated that no sufficiently relevant verified record exists, and refused dosage/preparation instructions. |
| Browser console | Pass | No warning or error logs were recorded during the authenticated Dr. Ai checks. |

## Findings

1. **Dr. Ai Markdown formatting defect resolved.** The original run exposed heading and list markers such as `###` and `*` as raw inline text. The 4 September 2026 remediation also handled Markdown horizontal rules and closed the minor presentation defect (`DEF-UI-01`).
2. **Google OAuth semantics can be clearer.** The control works as a navigation link, but if the intended design is a button, either update the checklist wording to “Google OAuth link” or expose button-like semantics while preserving accessible keyboard behavior.
3. **The tested pages and grounding controls were operational.** The authenticated checks produced no browser warning/error logs, Lagundi remained the sole known-herb citation, and the unknown herb produced no unrelated source.

## Remediation retest — 4 September 2026

- The Dr. Ai renderer parses headings, consecutive unordered/ordered lists, and horizontal rules line-by-line without allowing raw HTML.
- An authenticated Chrome retest used `Explain the verified uses and safety warnings for Lagundi.` The visible response showed styled headings and bullets, while the accessibility tree exposed heading and list semantics.
- No raw `###`, `*`, or `---` markers appeared. `DEF-UI-01` is closed.
- Frontend lint, the separate TypeScript check, and the 18-route production build passed after the final fix. The wider regression baseline remains 33 passing backend tests.
