# Suggestion validation and image rehearsal — 5 September 2026

## Defects corrected

- Suggestion schema validation accepted whitespace-only required fields. All six required strings now reject blank/whitespace-only values.
- Invalid file formats and oversized multipart uploads previously returned HTTP 500. The shared image middleware now returns a descriptive 400 for unsupported formats/invalid upload fields and 413 for files larger than 5 MiB. Unexpected errors still reach the normal error handler.

Ten regression tests were added. Before the changes, eight failed and two passed. After the changes, all ten passed. Validation tests exercise rejection before database persistence or external image upload. MIME filtering is not full file-content verification; this work does not claim malware scanning or exhaustive malformed-image protection.

## Desktop Chrome rehearsal

`scripts/rehearse-suggestion-image.mjs` used one unique temporary contributor account on the local production demo:

1. Empty form submission was blocked, with no suggestion stored.
2. A text file was rejected in the browser and selection cleared.
3. A PNG-labelled file over 5 MiB was rejected and selection cleared.
4. A valid PNG preview decoded; Remove Photo cleared preview and file input; reselection worked.
5. Valid multipart submission returned 201. The submitted image decoded in the success view and the database retained its Cloudinary URL.
6. The exact uploaded Cloudinary asset was destroyed with CDN invalidation requested. The temporary account and its suggestion were deleted, and no matching suggestion remained. CDN invalidation propagation was not independently measured.

No herb was approved or published, no AI prompt was sent by the browser rehearsal, and email remained in log mode. Fixtures used `.invalid` email addresses and explicit non-medicinal test descriptions. Browser authentication used a generated test cookie, not password login/OAuth.

## Verification caveat

Backend build and lint passed. The first full run passed 46/47 tests; the existing multi-turn AI test returned 500. A rerun of system-features plus the new validation file passed 29/29, including that AI test. This intermittent result is recorded rather than treated as proof that AI/network-dependent tests are fully stable.

Remaining scope includes authenticated mobile image handling, other valid image formats, boundary-size acceptance, exhaustive malformed-file testing, and broader contributor workflows.

The final full-suite rerun additionally logged a provider 404 stating `gemini-2.0-flash` is no longer available, followed by a temporary 503 for `gemini-2.5-flash`. This is a separate Dr. AI model-configuration/reliability concern and must be addressed before presentation; no replacement model was selected in this upload task.

Final full-suite outcome: **45/47 passed**, with two live AI tests exceeding their 25-second timeouts. All ten new validation tests passed. The backend eventually logged a successful fallback response, but that does not turn a timed-out test into a pass. Temporary demo services were stopped.
