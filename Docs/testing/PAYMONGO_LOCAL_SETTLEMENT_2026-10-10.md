# PayMongo receipt-to-wallet settlement — 10 October 2026

## Scope and safety

This follow-up validates the actual compiled PayMongo adapter, webhook controller and credit repository against real sandbox receipts and an isolated PostgreSQL schema. It is not genuine provider webhook delivery, hosted checkout acceptance or a production wallet top-up.

Only the previously authorized TEST secret in ignored local backend configuration was used. It was not printed, uploaded to Railway or added to Git. The probe issued seven bounded GET requests to PayMongo for the two existing, previously simulated paid/failed TEST sessions; all returned HTTP 200. No new checkout, authorization, real payment, merchant setting or production write occurred. No Dr. Ai generation was requested and the live administrator's nine credits were untouched.

The database connection was explicitly fixed to loopback `127.0.0.1:55438`, database `herbalai_test`. Actual server address, port, database and `test_user` role were verified before creating a uniquely named private schema. The application connection's actual current schema was independently verified before wallet writes. Only two synthetic local users and pending orders matching the existing provider reference numbers were created. The application credit migration supplied the four wallet/order tables. Cleanup removed only this run's newly created private schema; existing databases and schemas were not modified.

Signed event bodies were locally constructed with a random ephemeral signing secret, which was neither persisted nor registered with PayMongo. Consequently these checks do **not** prove an authentic provider signature, webhook registration/delivery, or end-to-end purchase creation. Every accepted fulfillment independently re-fetched the genuine provider session; event contents alone could not grant credits.

## Observed results

Run captured at 09:14:52 Manila on 10 October 2026. Seven acceptance assertions passed:

| Check | Observed outcome |
| --- | --- |
| Genuine paid/failed receipt retrieval | Both existing sessions independently returned non-live state, the expected order references, PHP 10000 minor units and their previously simulated paid/failed status. |
| Invalid signature | HTTP 400 before any provider retrieval or wallet change. |
| Live-mode event | HTTP 400 before provider retrieval, despite an otherwise valid local signature. |
| Failed checkout | A locally signed paid-event wrapper around the actual failed session returned HTTP 400. The wallet stayed at ten; the provider session was authoritative. |
| Wrong local order amount | Actual paid receipt against an intentionally mismatched local amount returned HTTP 400. Wallet stayed at ten and the order stayed Pending. |
| Concurrent duplicate delivery | Two simultaneous valid local deliveries both returned HTTP 200: one credited, one duplicate. The ten-credit test package increased the owner's balance from ten to twenty exactly once. |
| Later replay and isolation | A later delivery remained a duplicate; repeated reads stayed at twenty. Exactly one Trial and one Top-up ledger entry summed to twenty. The second local user's wallet stayed at ten. |

No application defect was reproduced by this selection, so no speculative production code change was made. Provider/session reads and actual SQL-backed HTTP settlement are distinguished from earlier mocked-provider regression cases.

## Reproduction and evidence

Outside-Git probe: `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/paymongo-local-settlement-20261010.mjs`.

Sanitized outcome: `C:/Users/Hp/Documents/Codex/2026-10-07/what-can-you-proposed-fix-for/paymongo-local-settlement-results-20261010.json`.

The probe requires the existing authorized ignored TEST key, local PostgreSQL and the backend build. It refuses remote/provider-write requests. Do not deploy this probe or its synthetic orders. Local artifacts are not a reason to alter the production database.

## Remaining hosted gate

A genuine registered PayMongo TEST webhook and its private signing secret, hosted test packages and provider TEST key are still absent from Railway. Installing that key on a new destination or registering/modifying a borrowed merchant webhook needs specific authorization. After approval, verify the TEST checkout and genuine signed delivery, exactly-once persistent hosted settlement, duplicate delivery, failed-payment non-crediting and the Back path without entering real GCash credentials. Returning from checkout must not grant credits by itself. Real-money activation remains prohibited; the current public allowance works without enabling checkout.
