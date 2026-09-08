# Final capstone rehearsal - 8 September 2026

## Result

**Pass for the recorded local presentation scope.** The production-mode application built and started successfully, the complete automated and browser rehearsal suite passed, the one presentation-visible defect found during log review was repaired, and the application was stopped after verification.

This result supports a controlled local defense. It does not replace real participant UAT, physical-device acceptance, staging performance, production deployment, recovery proof, or adviser/panel approval.

## Verification baseline

| Check | Result |
|---|---|
| Backend production build | Pass |
| Frontend production build and TypeScript | Pass; 18 routes generated |
| Backend automated tests | Pass; 83/83 tests across 14 files |
| Backend ESLint | Pass |
| Frontend ESLint | Pass |
| Production health and application identity | Pass |
| Final homepage paint after repair | Pass; 2,448 ms LCP in the verification run |
| Temporary data and uploaded-asset cleanup | Pass in every mutating rehearsal script |
| Service shutdown | Pass; the local production processes were stopped |

## Functional workflows exercised

### Public and responsive behavior

- Homepage, library, About, sign-in, sign-up, and forgot-password pages loaded at 390 by 844 and 1440 by 900.
- Lagundi search, herb-detail opening and modal closing passed at both widths.
- Mobile navigation passed.
- Signed-out access to Dr. AI, Suggest Herb, Admin and Messenger redirected to sign-in.
- No tested page produced uncaught browser errors or horizontal overflow.

### Accounts, profile and recovery

- Profile updates persisted for allowed fields; validation and protected-field rejection passed.
- Browser sign-up, unverified-login rejection, email verification, verified login, password reset, changed-password login, mismatch validation and single-use token behavior passed using isolated local test flows.
- Recovery pages passed 15 viewport checks.
- Actual Gmail delivery was not repeated in this rehearsal because it had already been confirmed separately; this run verified the application workflow without making a new inbox claim.

### Dr. AI

- Three quick prompts rendered and submitted exactly as selected.
- Streaming output rendered successfully.
- Source attribution and the medical disclaimer remained visible.
- Live administrator-managed knowledge-base retrieval included the exact active source.
- Contributor authorization denial, active-status behavior and cleanup passed.

### Suggestion and moderation

- Contributor submission, administrator approval, public catalog visibility, audit logging and live notification passed.
- Rejection, duplicate-action prevention, mark-all-read persistence and account isolation passed.
- Empty-form, invalid-format and oversized-image validation passed.
- Valid image preview, removal, reselection, upload, persisted URL and displayed image passed.
- Temporary Cloudinary assets and database records were removed.

### Administration

- Full herb create, approval, public visibility, edit, detail update and delete lifecycle passed.
- Full knowledge-base create, edit, active toggle, grounded retrieval and delete lifecycle passed.
- Contributor denial for administrator operations passed.
- Audit history was verified.
- Ban/unban persistence, immediate cached-session blocking, self-ban protection and contributor denial passed across the six mobile administration tabs.

### Community and Messenger

- Topic creation, replies, likes/unlikes, reload persistence and owner-only deletion passed.
- Initial 50-message page and 55-message duplicate-free ordered pagination passed.
- Text send, edit and delete passed with live receiver updates and reload persistence.
- Image preview, replacement, upload, live delivery, opening, persistence and deletion passed.
- Mobile back, contact, send and touch-edit controls passed.

### Session termination

- Mobile logout cleared both authentication cookies.
- The login-issued refresh token was revoked.
- Four protected routes remained inaccessible after logout.

## Defect found and repaired

The homepage contribution section referenced an external Unsplash image that returned HTTP 404. The section still displayed its fallback, but the failed request was visible in the production log and depended on an unstable external resource.

The component now uses the repository-owned `/images/lagundi.png` asset with descriptive alternative text. Frontend lint, the 18-route production build, homepage paint, and the public responsive rehearsal passed after the change. The final frontend error log contained no repeat of the failed image request.

## Remaining concerns

1. The PostgreSQL driver warns that `sslmode=require`-style modes will change semantics in the next major driver release. Before that upgrade, the database connection configuration should explicitly use `sslmode=verify-full` when supported by the provider. This is a maintenance warning, not a current rehearsal failure.
2. Several remote-database workflows took approximately one to five seconds and were logged as slow requests. PR-004 and PR-005 therefore remain staging acceptance gates.
3. Five real UAT participants, physical-device acceptance, production/TLS/recovery evidence and academic signatures remain external requirements.

## Presentation decision

The project remains **88/100 internally ready** and is suitable for a controlled local capstone presentation with disclosed limitations. No evidence from this rehearsal supports claiming 100% final or production acceptance.
