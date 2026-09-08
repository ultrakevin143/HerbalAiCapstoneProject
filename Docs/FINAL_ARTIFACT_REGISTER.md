# Herbal AI Final Artifact Register

## Completed local artifacts

| Artifact | Location | Status |
|---|---|---|
| Revised SRS | `Herbal_AI_SRS_v3.docx` | Complete locally; revision 3.0 evidence addendum included |
| Revised SPMP | `Herbal_AI_SPMP_v3.docx` | Complete locally; revision 3.0 status addendum included |
| System Design Document | `Herbal_AI_SDD_v2.docx` and `Docs/SYSTEM_DESIGN_DOCUMENT.md` | Complete; Version 2 follows the SRS/SPMP-style front matter and is in the project root |
| Software Test Document | `Herbal_AI_STD_v2.docx` | Complete; Version 2 follows the SRS/SPMP-style front matter and is in the project root |
| Requirements Traceability Matrix | `Docs/REQUIREMENTS_TRACEABILITY_MATRIX.md` | Complete structure; evidence collection continues |
| V&V Report and test log | `Docs/VERIFICATION_VALIDATION_REPORT.md`, `Docs/TEST_EXECUTION_LOG.md` | Complete structure; manual evidence continues |
| Performance plan and results | `Docs/PERFORMANCE_TEST_PLAN.md`, `Docs/PERFORMANCE_FOLLOWUP_2026-09-07.md` | Executed locally; PR-001 has a provisional local pass, while PR-004 and PR-005 remain unaccepted without staging |
| UAT package | `Docs/UAT_TEST_SCRIPT.md`, `Docs/UAT_RESULT_FORM.md`, `Docs/UAT_SUMMARY.md` | Ready; 0/5 real participants recorded |
| Privacy, backup, maintenance | `Docs/PRIVACY_BACKUP_MAINTENANCE_PLAN.md` | Complete |
| User manual | `Docs/USER_MANUAL.md` | Complete |
| Release checklist | `Docs/RELEASE_READINESS_CHECKLIST.md` | Complete structure; external gates pending |
| Capstone defense presentation | `Herbal_AI_Capstone_Defense_v1.pptx` | Complete locally; 15 slides, presenter notes, three editable native charts, structural validation and PowerPoint visual QA passed |
| Offline defense deck fallback | `output/pdf/Herbal_AI_Capstone_Defense_v1.pdf` | Complete; 15 pages exported by Microsoft PowerPoint and visually inspected after Poppler rendering |
| Defense script and runbook | `DEFENSE_DEMO_SCRIPT.md`, `Docs/LOCAL_PRESENTATION_RUNBOOK.md` | Aligned to the 15-slide deck and current 83-test/performance evidence |
| Defense preflight | `scripts/defense-preflight.ps1` | Checks presentation artifacts, application compatibility, build outputs, local port health and optional automated/browser verification without printing secrets |
| Final capstone rehearsal | `Docs/FINAL_CAPSTONE_REHEARSAL_2026-09-08.md` | Passed recorded local scope; includes the repaired homepage image dependency, full workflow results, cleanup and remaining external gates |

## Required external evidence before final acceptance

1. Docker-enabled staging/production deployment with a configured root `.env`.
2. HTTPS, health-check, logging, rollback, and backup/restore proof.
3. At least five UAT participant records and resolution of Critical/High findings.
4. Staging performance acceptance for PR-004 and PR-005; PR-001 has a provisional local pass only.
5. Final reviewer/adviser sign-off.

## Document QA note

The four formal DOCX files passed structural and page-by-page visual verification through Microsoft Word export on 7 September 2026. The 36-page SRS and 43-page SPMP passed with their revision-3 addenda intact. The SDD and STD were expanded from four-page drafts to ten-page controlled documents with matching institutional front matter, headers, footers, numbered sections, contribution records, and current evidence boundaries. See `Docs/FORMAL_DOCUMENT_VISUAL_QA_2026-09-07.md`.
