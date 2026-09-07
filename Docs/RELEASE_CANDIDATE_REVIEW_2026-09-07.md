# Release Candidate Review — 7 September 2026

## Decision

The current working tree is suitable to preserve as a single capstone release-candidate commit after one human review of the staged file list. It is not suitable for a final production tag because UAT, staging performance acceptance, deployment/recovery execution, and reviewer signatures remain pending.

## Repository state reviewed

- Branch: `main`
- Current commit: `05f2017` (`NEw changes`), one local commit ahead of `origin/main`
- Working tree: 72 modified tracked files and 65 untracked release-candidate files; nothing staged
- Existing release tags: none
- Patch integrity: `git diff --check` passed
- Candidate file types: Markdown evidence, TypeScript/TSX source and tests, JavaScript rehearsal/audit scripts, PowerShell demo controls, one SQL migration, configuration, and two DOCX revisions
- Large-file check: no candidate file exceeds 5 MB
- Runtime state: no listeners on ports 3000 or 5000 after verification

## Security and hygiene review

- Real backend/frontend environment files, build output, dependencies, remote attachments, and `.demo-logs` are ignored.
- No high-confidence Google API key, OAuth client secret, private key, JWT, or real credential-bearing database URL was found in tracked/untracked release candidates.
- Database URLs detected in CI and documentation use test/example values only.
- Do not stage `.env`, `.env.local`, `.demo-logs`, database dumps, screenshots containing accounts, or temporary recovery links.
- Windows LF-to-CRLF notices are non-blocking. Avoid a repository-wide line-ending rewrite in this release because it would add unrelated diff noise.

## Verification of this exact tree

| Check | Result |
|---|---|
| Backend tests | Passed — 82/82 across 14 files |
| Backend TypeScript build | Passed |
| Frontend lint | Passed |
| Frontend TypeScript check | Passed |
| Frontend production build | Passed — 18 routes generated |
| DOCX visual QA | Passed — 99 pages reviewed across SRS, SPMP, SDD and STD |
| Secret-pattern / large-file scan | Passed, with only documented example/test URLs |
| `git diff --check` | Passed |

## Recommended commit strategy

Use one release-candidate commit. The current changes were developed and verified as an interdependent whole; splitting the accumulated working tree now would create partially verified intermediate commits and increase the chance of omitting tests, migrations, scripts, or documentation.

Suggested sequence, to run only after the staged file list is reviewed:

```powershell
git switch -c codex/capstone-release-candidate
git add -A
git status --short
git diff --cached --check
git diff --cached --stat
git commit -m "release: prepare Herbal AI capstone candidate"
```

After the commit, rerun the backend suite and both production builds. If the commit remains clean and the team wants a rehearsal marker, create an annotated pre-release tag:

```powershell
git tag -a v1.0.0-rc.1 -m "Herbal AI capstone rehearsal candidate"
```

Push the branch/tag only after confirming the remote destination and reviewing the commit. Do not label it `v1.0.0` until the external release gates are complete.

## Remaining external release gates

1. Five real UAT participant records and correction/sign-off summary.
2. Staging remediation and acceptance for PR-001, PR-004, and PR-005.
3. Production deployment, TLS, health/logging evidence, backup, restore, and rollback execution.
4. Physical-device/full WCAG review beyond browser emulation.
5. Adviser/panel review and signatures on the controlled documents.
