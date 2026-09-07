# Mobile accessibility follow-up — 6 September 2026

## Scope

Two workstreams were selected for this round: actual emailed recovery links and mobile/accessibility acceptance. No deployment purchase or unrelated performance work was undertaken.

The delivered-link test passed: Kevin received the actual verification/reset templates at a unique authorized Gmail plus-alias and successfully used both links on the laptop. Database state independently confirmed account activation and consumed tokens. The temporary alias account and cascading tokens were deleted. See `ACCOUNT_RECOVERY_REHEARSAL_2026-09-06.md`.

## Accessibility findings and changes

Runner: `scripts/audit-accessibility.mjs`, installed axe-core 4.12.0 and headless Chrome. Thirteen routes at widths 320 and 390: Home, Library, About, Sign In, Sign Up, Forgot Password, Reset Password, Verify Email, Dr. Ai, Community, Messenger, Suggest Herb and Admin. Authenticated routes use temporary contributor/admin accounts, deleted after the run.

The initial 26 page/width scans found no document overflow, but reported color contrast and scrollable-region keyboard-access findings. Changes:

- Darker white-text herb badges on Home/Library/About.
- Darker authentication links, recovery error text, Dr. Ai status/help text and Messenger empty-state text.
- More opaque Admin Console text on its dark background.
- Keyboard focusability and descriptive region names for the homepage conversation preview, admin category counts and console log scrollers.
- Explicit focus-visible outline, plus a darker primary-button gradient for white text.

An intermediate production build still emitted the old error color despite the updated source. A clean generated build corrected that discrepancy. Old generated builds were moved into `.demo-logs/accessibility/` rather than deleted. These are recoverable local artifacts, not source backups or release deliverables.

## Evidence and limits

Final clean-production run: **26/26 page-width scans completed with zero reported axe violations and zero document overflow**. All three region keyboard checks passed. Frontend lint, separate `tsc --noEmit`, and the final 18-route production build passed. Home, Sign In and Admin screenshots were inspected; the darker primary button and focus outlines rendered. Temporary automation accounts were cleaned. This result is limited to the selected rules and rendered states, not a blanket accessibility or visual-perfection claim.

The initial result is saved in `.demo-logs/accessibility/before.json`. The latest complete scan overwrites `results.json`; inspect its results rather than treating the existence of the file as a pass. Screenshots for Home, Sign In and Admin are saved alongside it. Keyboard checks explicitly use Tab to reach all three repaired scrollers, check their focus outlines and use End to scroll when content overflows.

Automated scans do not establish full WCAG compliance. Axe reports incomplete color-contrast checks for some gradient/image surfaces, requiring manual review. Hidden dialogs, populated Messenger conversation states, all admin editors, screen-reader output and exhaustive keyboard traversal remain outside this scan.

## Physical-phone acceptance

Kevin has a Samsung A73 5G. Physical-device results are pending. The laptop Wi-Fi address observed was `192.168.1.29`; it may change. The laptop successfully fetched `http://192.168.1.29:3000/signin` (HTTP 200); this does not establish reachability from the phone. Kevin was asked to open it in Chrome on the same Wi-Fi and test fields/scrolling without submitting credentials. The current frontend API address is baked as localhost, so directly opening the LAN frontend is suitable only for public layout/form-keyboard checks, not authenticated/API acceptance. Windows reports the Wi-Fi profile as Public; no firewall rule or network-profile change was made. Do not expose the database, backend or admin endpoints by weakening firewall or cookie protections just to claim a phone pass. The demo remains running with email delivery suppressed for the requested phone check.

Suggested public checks once the page is reachable: portrait/landscape Home and About, large-text readability, navigation open/close, Sign In email keyboard, password field visibility with keyboard open, scrolling to buttons and no horizontal overflow. Do not submit personal credentials during this limited LAN check.
