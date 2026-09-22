# Herbal AI Before-Defense Action Plan

Status date: 22 September 2026

## Completed technical gate

- Defense preflight: passed with zero failures.
- Backend automated regression: 176/176 tests passed across 31 files.
- Backend production build: passed.
- Frontend ESLint and TypeScript checks: passed.
- Frontend production build: passed with 20 routes.
- Required presentation, SRS, SDD, SPMP, STD, PDF and demo-script artifacts: present.
- PowerPoint deck: opened successfully with 15 slides.

## Required before the defense

| Priority | Gate | Owner | Evidence required | Status |
|---|---|---|---|---|
| P0 | Five-participant UAT | Project team | Five completed `UAT_RESULT_FORM.md` copies and signed/dated `UAT_SUMMARY.md` | Not Started |
| P0 | Live staging smoke test | Project team | Public/API, contributor, administrator and two-account real-time checks passed; `DEF-AI-02` closed live; exact cleanup query found no remaining `[TEST 20260921]` records | Complete |
| P0 | Backup and restore proof | Database owner | In-memory logical snapshot restored into an isolated Neon schema; 17 tables and 169 rows matched; temporary schema removed | Complete |
| P1 | Physical-device acceptance | Project team | Phone/tablet model, browser, tested workflows, screenshots and defects | Not Run |
| P1 | Security configuration review | Deployment owner | Live headers/CORS plus cookie, rate-limit, authorization, startup-secret and repository-secret controls verified without recording secrets | Complete |
| P1 | Staging performance run | Deployment owner | 20-request post-deploy sample: homepage p95 277.5 ms, health p95 291.7 ms, herb catalog p95 355.8 ms, zero errors | Complete |
| P2 | Adviser/panel review | Adviser/panel | Signed acceptance or documented revisions | Pending |

## UAT execution

1. Recruit at least five participants who did not build the system.
2. Give each participant `Docs/UAT_TEST_SCRIPT.md` without coaching them through tasks.
3. Record outcomes in a separate copy of `Docs/UAT_RESULT_FORM.md`.
4. Never include passwords, tokens, personal health information or database credentials in evidence.
5. Summarize completion rate, rating, defects and recommendations in `Docs/UAT_SUMMARY.md`.
6. Fix major defects, rerun affected tasks and retain before/after evidence.

## Defense-day final command

Run the following from the repository root after starting the local production demo:

```powershell
.\scripts\defense-preflight.ps1 -RunAutomatedChecks -RunBrowserChecks
```

Do not describe the system as medically diagnostic or fully production-certified. State that it is an educational Philippine herbal-medicine repository with grounded AI assistance and documented safety boundaries.
