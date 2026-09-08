# Local capstone presentation runbook

No VPS or domain is required for this rehearsal. Online deployment remains deferred, not accepted. Local hosting is not fully offline: the configured remote database, Gemini, Google OAuth and live email can still require internet access.

## Before presenting

1. Run `powershell -ExecutionPolicy Bypass -File scripts/defense-preflight.ps1`. It checks the deck, PDF fallback, formal documents, environment-file presence, local build artifacts, PowerPoint compatibility and port state without displaying secrets. Use `-RunAutomatedChecks` for a full test/build pass and `-RunBrowserChecks` only after both local services are running.
2. Open `Herbal_AI_Capstone_Defense_v1.pptx` in Microsoft PowerPoint and confirm that it contains 15 slides. Presenter notes contain the short speaking cues. Keep `output/pdf/Herbal_AI_Capstone_Defense_v1.pdf` as the offline fallback.
3. Use dedicated demo accounts. Keep terminals showing secrets, dotenv files and personal inboxes off screen.
4. Keep ports 3000 and 5000 available. Do not stop an unrelated application without checking what owns the port.
5. From the project root, run `powershell -ExecutionPolicy Bypass -File scripts/start-demo.ps1`. It builds and starts the local production app. Use `-SkipBuild` only when the current code has already been built successfully.
6. Confirm `http://localhost:3000` shows Herbal AI and the library retrieves the intended demo herbs. A health endpoint alone does not prove database access.
7. Run `node scripts/run-local-rehearsal.mjs` for read-only mobile/desktop checks. The script requires installed frontend dependencies and Chrome. It does not submit AI prompts, credentials or email forms.

## Suggested demonstration order

1. Follow slides 1 to 4 for the problem, scope and architecture.
2. On slide 5, demonstrate the library search for Lagundi and open its details.
3. On slide 6, ask Dr. AI to clarify a stored preparation guide and point out the source and disclaimer.
4. On slides 7 and 8, use separate contributor and administrator sessions for a labelled test suggestion, moderation, notifications, community and Messenger.
5. On slides 9 to 13, explain security, current verification, local performance, contribution allocation and remaining acceptance gates.
6. Use slide 14 as the live-demo checklist, then logout and verify a protected page cannot be reopened without signing in.

## Failure fallback and cleanup

- Prepare dated screenshots or recordings in advance for network-dependent features. Label recorded demonstrations as recordings; do not imply they are live.
- Keep the PowerPoint open locally so the defense can continue even if the browser, database, Gemini, Google OAuth or email service is temporarily unavailable.
- The launcher defaults email delivery to log mode unless the shell already overrides EMAIL_DELIVERY_MODE. Do not claim receipt in a real inbox when testing in log mode.
- Remove only test records created during the rehearsal. Never bulk-delete existing data or build files needed for the demo.
- Stop the services started by the launcher with `powershell -ExecutionPolicy Bypass -File scripts/stop-demo.ps1`.
- UAT with at least five real participants, authenticated mobile checks, and remaining write workflows still require separate evidence.
