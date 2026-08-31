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
| Performance plan | `Docs/PERFORMANCE_TEST_PLAN.md` | Complete; execution pending |
| Privacy, backup, maintenance | `Docs/PRIVACY_BACKUP_MAINTENANCE_PLAN.md` | Complete |
| User manual | `Docs/USER_MANUAL.md` | Complete |
| Release checklist | `Docs/RELEASE_READINESS_CHECKLIST.md` | Complete structure; external gates pending |

## Required external evidence before final acceptance

1. Docker-enabled staging/production deployment with a configured root `.env`.
2. HTTPS, health-check, logging, rollback, and backup/restore proof.
3. End-to-end notification, audit-log mutation, real-time message, email verification/reset, and Google OAuth proof.
4. At least five UAT participant records.
5. Performance results for PR-001 to PR-005.

## Document QA note

The four formal DOCX files passed structural verification. Automated visual rendering could not be performed in this environment because the renderer dependency `pdf2image` is unavailable. Open each DOCX in Microsoft Word or LibreOffice and confirm page/table layout before submission.
