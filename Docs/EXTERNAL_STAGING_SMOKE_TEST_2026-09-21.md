# Herbal AI External Staging Smoke Test

Date: 21 September 2026  
Frontend: `https://herbal-ai-staging.vercel.app`  
Backend: Railway staging service  
Browser: Google Chrome, Mercado profile

## Result

Public staging smoke test: **Passed**.  
Authenticated contributor and administrator staging tests: **Passed**.

## HTTP and API checks

| Check | Result | Observation |
|---|---|---|
| Homepage | Pass | HTTP 200 |
| Library | Pass | HTTP 200 |
| About | Pass | HTTP 200 |
| Sign in | Pass | HTTP 200 |
| Sign up | Pass | HTTP 200 |
| Unknown route | Pass | HTTP 404 with the custom Herbal-AI page |
| Backend health | Pass | HTTP 200; staging origin allowed |
| Public herb API | Pass | HTTP 200; 86,222-byte response in this run |
| Unauthenticated `/api/auth/me` | Pass | HTTP 401 as required |
| CORS preflight | Pass | HTTP 204; exact Vercel origin, credentials and supported methods returned |
| Timing instrumentation | Pass | `Server-Timing` was present on backend responses |

Observed single-request timings from the test workstation are diagnostic only, not performance acceptance evidence: public frontend routes were approximately 268–831 ms, backend health was 730 ms, and the herb API was 973 ms end to end with approximately 516 ms reported by the application.

## Real Chrome interaction checks

| Workflow | Result | Observation |
|---|---|---|
| Homepage rendering | Pass | Navigation, hero, Dr. AI preview, featured herbs and footer rendered |
| Library data loading | Pass | 37 herbs loaded; pagination and category controls rendered |
| Herb search | Pass | Searching `Lagundi` reduced the result to one matching herb |
| Herb details | Pass | Lagundi use, preparation, dosage, region, warnings and source control rendered |
| Herb modal close | Pass | Close button dismissed the details view |
| Protected Dr. AI route | Pass | Signed-out `/chat` redirected to `/signin?callbackUrl=%2Fchat` |
| Custom 404 | Pass | Dr. AI artwork, explanation, Home and Library recovery links rendered |

## Authenticated contributor checks

| Workflow | Result | Observation |
|---|---|---|
| Existing authenticated session | Pass | Homepage rendered contributor navigation and account identity |
| Dr. AI route retention | Pass | Opening Dr. AI did not return the authenticated user to sign-in |
| Known-herb grounding | Pass | Lagundi answer used the Lagundi herb and FAQ records and included safety language |
| Unknown-herb refusal | Pass after repair | `moonflower xyz` returned an insufficient-evidence refusal, withheld dosage/preparation guidance, and displayed no source cards or unrelated citations after Railway activated commit `1500240` |
| Messenger access | Pass | Conversation list, existing history, attachment control and composer rendered |
| Community access | Pass | Categories, guidelines, search and discussion list rendered |
| Notification center | Pass | All, Community and Messages categories rendered with working destination links |
| Suggest-herb access | Pass | Complete contributor form and validation-labelled required fields rendered |
| Contributor admin protection | Pass | `/admin` displayed Access Denied with the current contributor identity |
| Logout | Pass | Returned to sign-in with the original callback URL |
| Post-logout protection | Pass | A fresh `/chat` request redirected to sign-in |

## Authenticated administrator checks

| Workflow | Result | Observation |
|---|---|---|
| Existing administrator session | Pass | Admin console rendered the `alias bb` administrator identity |
| Dashboard and backend health | Pass | Dashboard loaded current staging statistics and health state |
| Pending suggestions | Pass | Moderation queue loaded with zero pending records |
| Herb administration | Pass | All Herbs loaded 37 records |
| User administration | Pass | Users loaded 7 records |
| Knowledge-base administration | Pass | Knowledge Base loaded 33 facts |
| Audit trail | Pass | Immutable audit entries rendered with actor, timestamp, action and target |
| Contributor RBAC | Pass | Contributor access to `/admin` remained denied |

## Two-account real-time checks

| Workflow | Result | Observation |
|---|---|---|
| Messenger admin-to-contributor | Pass | Edge received the admin message and unread badge without reload |
| Messenger contributor-to-admin | Pass | Chrome received the contributor reply in the open conversation without reload |
| Message notification category | Pass | Notification center placed the event under Messages with a direct conversation link |
| Community live reply | Pass | Chrome displayed the contributor comment and updated reply count without reload |
| Community notification category | Pass | Notification center placed the event under Community with `/community/14#comment-17` deep-link targeting |

Temporary records used `[TEST 20260921]` prefixes. Browser confirmation-dialog automation stalled during cleanup, so the temporary conversation and discussion must be deleted manually from staging before final evidence capture. Google sign-in callback was not repeated because both accounts began from authenticated staging sessions.

No credentials, tokens, personal health information or environment-variable values were captured in this report.
