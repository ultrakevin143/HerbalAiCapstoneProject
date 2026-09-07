# Local capstone presentation runbook

No VPS or domain is required for this rehearsal. Online deployment remains deferred, not accepted. Local hosting is not fully offline: the configured remote database, Gemini, Google OAuth and live email can still require internet access.

## Before presenting

1. Use dedicated demo accounts. Keep terminals showing secrets, dotenv files and personal inboxes off screen.
2. Keep ports 3000 and 5000 available. Do not stop an unrelated application without checking what owns the port.
3. From the project root, run `powershell -ExecutionPolicy Bypass -File scripts/start-demo.ps1`. It builds and starts the local production app. Use `-SkipBuild` only when the current code has already been built successfully.
4. Confirm `http://localhost:3000` shows Herbal AI and the library retrieves the intended demo herbs. A health endpoint alone does not prove database access.
5. Run `node scripts/run-local-rehearsal.mjs` for read-only mobile/desktop checks. The script requires installed frontend dependencies and Chrome. It does not submit AI prompts, credentials or email forms.

## Suggested demonstration order

1. Homepage, mobile navigation, library search for Lagundi, herb details.
2. Sign in with a dedicated contributor account; explain verified versus community-submitted information.
3. Dr. AI: ask for a clearer restatement of a database herb; inspect source relevance and safety wording. Record the actual answer, not just the initial source acknowledgement.
4. Demonstrate a clearly labelled test suggestion and moderation using a separate staff session. This workflow still needs a recorded full rehearsal.
5. Community, notifications and two-session messaging. Record any remaining steps as pending rather than assuming prior partial tests cover them.
6. Logout and verify protected pages cannot be reopened without signing in.

## Failure fallback and cleanup

- Prepare dated screenshots or recordings in advance for network-dependent features. Label recorded demonstrations as recordings; do not imply they are live.
- The launcher defaults email delivery to log mode unless the shell already overrides EMAIL_DELIVERY_MODE. Do not claim receipt in a real inbox when testing in log mode.
- Remove only test records created during the rehearsal. Never bulk-delete existing data or build files needed for the demo.
- Stop the services started by the launcher with `powershell -ExecutionPolicy Bypass -File scripts/stop-demo.ps1`.
- UAT with at least five real participants, authenticated mobile checks, and remaining write workflows still require separate evidence.
