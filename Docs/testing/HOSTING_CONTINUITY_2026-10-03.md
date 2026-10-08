# Hosting continuity review — 3 October 2026

## Scope and current result

Read-only inspection at approximately 10:02–10:11 PM Asia/Manila. The released code remains `58ebe66d26bde13f36fdfd5cfa3d69f231030dc1`. No billing transaction, plan change, credential change, database migration, service suspension, deletion or redeployment was performed. This review does not guarantee uptime, latency or presentation readiness.

## Observed provider evidence

- Railway showed the application Online with ACTIVE deployment `14e0c48b-3a83-49bb-966e-7669e6b7ec5c`, matching the released About follow-up.
- The workspace displayed TRIAL. Its expanded notice said 15 days or $4.27 remaining and warned that expiry occurs when time or credits run out. This inspection did not independently establish Full versus Limited Trial verification status.
- Usage showed $0.73 current accumulated usage and a $0.00 current bill. The displayed reporting interval was Sep 18–Oct 4. The trial grant shown was $5; this is not a new monthly allowance or proof that credit will last until the defense.
- The project subtotal was $0.6930: application $0.4380, pgvector $0.2550. These are accumulated costs, not daily burn rates or monthly forecasts. The separate deleted project showed $0.0339.
- The pgvector service and its volume still appeared Online. Its existence and usage do not prove that the application depends on it. The deployment guide records a prior Neon connection; current dependencies and retained data must be verified before any service retirement.
- Railway briefly displayed a networking-information-unavailable notice while showing both services Online. This was a dashboard metadata error, not observed application downtime. No configuration correction was attempted based solely on that notice.

## Official policy checked

The [trial documentation](https://docs.railway.com/pricing/free-trial) states that trial time/credit is finite and that the subsequent Free plan has a $1 monthly credit. The [plan documentation](https://docs.railway.com/pricing/plans) lists Hobby at $5/month with $5 included resource usage; excess usage costs more. Neither is an assurance that this application's measured workload fits the allowance. Consult the provider's current terms before purchasing.

These policies were retrieved on the review date. Actual workspace notices and billing state take precedence over a guessed expiry date. No exact expiry timestamp or reliable future cost was obtained, so neither is invented here.

## Owner actions before the demonstration

1. Review current Usage and the trial notice in the intended Railway workspace. Choose a funded hosting arrangement before either limit is reached; the owner must complete any subscription/payment themselves. A trial is not a durable production plan.
2. If remaining on Railway, review the final checkout amount, included usage, payment method and cost alerts/limits. Do not set a service-stopping limit below the demonstrated workload. Recheck Online status and perform the bounded smoke checks below after any hosting change.
3. Before reducing pgvector costs, verify current application/database references privately and inventory retained data, other consumers and backups. Record restoration evidence. Do not assume this service is unused, switch the application database, or delete the volume simply because older logs mention Neon.
4. If the instructor requires a VPS, confirm that requirement before spending. The existing `Docs/DEPLOYMENT_GUIDE.md` is a starting guide, not evidence of a provisioned/tested VPS. A move needs an approved host/domain, protected configuration, database backup/restore validation, HTTPS, OAuth callback updates and a separate acceptance pass. No VPS or domain was purchased or migrated during this review.
5. Freeze the demonstrated release and retain source SHA `58ebe66`; previous source release `e6b774a39d56d6116da26350f87c4483e92d8cd3` is the rollback reference. Provider image availability must be checked at rollback time; rebuilding the prior source may be necessary. Do not reset production data or change database URLs as a rollback shortcut.

## Bounded demonstration smoke checklist

- Public homepage, About and Library load canonical records; catalog currently contains 38 herbs.
- Existing contributor can open Suggestions and remain signed in after refresh.
- Existing administrator can load dashboard, published catalog, suggestions and audit records and remain signed in after refresh.
- One controlled Dr. Ai request completes with its sources and recovery controls available. Do not induce production outages, flood the API or exhaust model/email quotas.
- If email acceptance must be repeated, use an authorized disposable account and respect the existing cooldowns. The user enters new passwords privately. Do not change the administrator password for demonstration testing.
- Retain a separately tested, isolated rehearsal fallback if required; never point the public deployment at a fixture/demo database. No ready offline fallback is asserted by this review.

## Related findings and boundaries

The administrator follow-up now passes on the released version; see `PRODUCTION_MVP_RELEASE_2026-10-03.md`. One legacy approved suggestion named `awdsawd` exposed implausible preparation/dosage text and an unsupported claim in its stored details. It did not appear in the rendered 38-record published catalog. Treat it as a provenance/retention review candidate, not permission to delete it or publish it. No record was changed.

Genuine Suggestions tab-return evidence remains unresolved, five-participant UAT remains deferred, and physical-device results remain user reports. The present inspection is not full MVP re-acceptance. Hosting funding, service dependency verification and any VPS cutover remain owner/implementation gates, not completed repairs.
