# Herbal AI Before-Defense Action Plan

Status date: 21 September 2026

## Completed technical gate

- Defense preflight: passed with zero failures.
- Backend automated regression: 173/173 tests passed across 31 files.
- Backend production build: passed.
- Frontend ESLint and TypeScript checks: passed.
- Frontend production build: passed with 20 routes.
- Required presentation, SRS, SDD, SPMP, STD, PDF and demo-script artifacts: present.
- PowerPoint deck: opened successfully with 15 slides.

## Required before the defense

| Priority | Gate | Owner | Evidence required | Status |
|---|---|---|---|---|
| P0 | Five-participant UAT | Project team | Five completed `UAT_RESULT_FORM.md` copies and signed/dated `UAT_SUMMARY.md` | Not Started |
| P0 | Live staging smoke test | Project team | Public/API and contributor checks passed; admin/two-account checks and `DEF-AI-02` remain in `EXTERNAL_STAGING_SMOKE_TEST_2026-09-21.md` | In Progress |
| P0 | Backup and restore proof | Database owner | Successful backup, isolated restore, row-count checks and cleanup record | Not Run |
| P1 | Physical-device acceptance | Project team | Phone/tablet model, browser, tested workflows, screenshots and defects | Not Run |
| P1 | Security configuration review | Deployment owner | CORS, secure cookies, rate limits, secrets, OAuth redirect and role checks verified without recording secrets | Not Run |
| P1 | Staging performance run | Deployment owner | p50/p95/error-rate report close to the deployed database | Not Run |
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
