# Herbal AI User Acceptance Test Script

Version: 1.0
Prepared: 7 September 2026
Target: at least five participants

## Purpose

This script records whether intended users can complete the system's core workflows. Automated tests support UAT but do not replace participant judgment. Do not mark a scenario Accepted unless the participant actually performs it and the reviewer records the result.

## Participant setup

Assign IDs `UAT-01` through `UAT-05`; do not place passwords in this document. Obtain consent before recording names, photos, audio, or screen captures. Use temporary contributor accounts where possible. One authorized project administrator performs administrator-only scenarios; ordinary participants must not receive administrator credentials.

Record device/browser, date, role and facilitator in `UAT_RESULT_FORM.md`. Explain that Herbal AI provides educational information and is not a substitute for professional medical advice. Participants may stop at any time.

## Common scenarios

| ID | Participant task | Acceptance evidence |
|---|---|---|
| UAT-01 | Open Home and explain what Herbal AI does | Purpose and safety boundary are understandable without facilitator correction |
| UAT-02 | Open Library, search for Lagundi and view its details | Correct herb is found; details, preparation and warnings are readable |
| UAT-03 | Ask Dr. Ai about a herb that exists in the library | Answer uses repository facts, improves clarity, cites relevant Herbal AI sources and shows the medical disclaimer |
| UAT-04 | Ask Dr. Ai about an unknown herb or request unsafe certainty | Assistant does not invent a repository answer and maintains the safety boundary |
| UAT-05 | Sign up, open the delivered verification email and sign in | Verification succeeds and unverified access is denied beforehand |
| UAT-06 | Use Forgot Password and sign in with the replacement password | Reset link works once; old password no longer works |
| UAT-07 | Submit a valid herb suggestion with an image | Required validation is clear and submission reaches pending review |
| UAT-08 | Create a Community post/comment, reply and like/unlike | Changes appear correctly and persist after reload |
| UAT-09 | Send and edit a Messenger text; send an image if available | Recipient sees the content; edit/image state persists |
| UAT-10 | Open notifications and then sign out | Notification controls are understandable; protected pages require sign-in afterward |

## Administrator scenarios

| ID | Administrator task | Acceptance evidence |
|---|---|---|
| UAT-A1 | Review, approve or reject the temporary suggestion | Status and contributor notification match the selected decision |
| UAT-A2 | Add/edit a temporary herb record and inspect Library | Published data match the saved record; temporary record is then removed or clearly retained for the demo |
| UAT-A3 | Ban and restore a temporary contributor | Banned user is blocked immediately; restored user can authenticate again |
| UAT-A4 | Review users, discussions, suggestions, herbs, knowledge base and audit log tabs | All six mobile/desktop tabs are reachable and labels/data are understandable |

## Facilitator rules

- Give the task wording, not click-by-click instructions. Record assistance when needed.
- Use only prepared temporary records and accounts. Never ask participants to disclose passwords.
- Mark `Pass`, `Fail`, `Blocked`, or `Not Run`. A blocked external service is not a pass.
- Record the exact step, expected result, actual result, severity and reproducibility for each defect.
- Clean temporary accounts/content after evidence is saved. Keep personally identifying UAT data outside the repository unless consent and retention rules permit it.

## Acceptance threshold

Recommended capstone threshold: five completed participant forms; 100% pass for authentication, authorization, password reset, medical disclaimer and destructive admin controls; at least 90% pass across remaining executed scenarios; no open Critical or High defect. The project manager/reviewer must sign the summary. This threshold is a proposed project rule and should be aligned with the adviser/panel if they require a different standard.
