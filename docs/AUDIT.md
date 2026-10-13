# Independent feature audit

Reviewed October 12, 2026, starting from `3aafb4c`. Independent GPT-6 and Luna agents examined individual features; the parent reproduced findings, integrated fixes and checked the browser flows. Follow-up rounds reviewed the corrected implementation. No private key was used, no real wallet was connected and no transaction was submitted to mainnet.

## Coverage by functionality

| Function | Independent checks | Result / evidence |
|---|---|---|
| Profile creation | Names, relationship, kind, avatars, adult consent | Identity changes clear consent; browser creation and consent retry verified. |
| Practice funding | Positive amounts, precision, paused profiles, current balances | Exact decimal cents, immutable state and durable storage tests. |
| Purchase requests | Limits, insufficient funds, pending vs immediate deduction | Existing and new domain tests; browser request keeps balance unchanged. |
| Purchase review | Repeated approval, changed limits/balance, pause, rejection | Rechecks current state; records resolution date; replay rejected. |
| Goal creation and saving | Target bounds, balance, pause, final cent | 1.99/2 remains open; final 0.01 completes it in tests and Chrome. |
| Shopping mission | Empty basket, needs, budget, changes after review | Independent review and browser invalid/valid basket flows. |
| Scam quiz | Missing/wrong answers, simple steps, feedback, speech | Incomplete review disabled; incorrect result retries; narration cleanup tested. |
| Emergency mission | Total, allocation minima, steppers, reviewed-plan changes | Independent review and browser 10/6/4 rejected, 8/8/4 accepted. |
| Rewards and progression | Pause, duplicate claim, XP and balance | Once-only domain guard; all three rewards survive reload in Chrome. |
| Activity | Learner scope, profile/status filters, approval controls | Guardian-only prompts; activity uses review date, preserving request date. |
| CSV | Filtered rows, quotes, Unicode, formula-like text | Formula markers after whitespace/control characters escaped as literals. |
| Persistence | Same-tab updates, competing tabs, quota, corrupt JSON | One writer lease; reads synchronize; failures do not report success. |
| Recovery | Guardian bases, large copies, signed records, cancellation | Validate and merge records; preserve raw damage and pending profile IDs. |
| Wallet connection | Overlapping providers, old events, disconnect | Generation guards and mocked opposite completion orders. |
| Mainnet reads | Genesis, default fallback, custom endpoint, partial results | Bounded verified fallback; complementary successful fields retained. |
| Account display | Reserved profile IDs, incompatible accounts, unknown balance | Own-key lookup; incompatible writes hidden; unknown balances stay unknown. |
| Signed writes | Preparation/signing account switches, durable IDs, storage failure | Captured signer session checked before signing and broadcast. |
| Uncertain outcomes | Lost send response, confirmation error, reload, retry | Persist signed bytes first; fresh writes blocked; retry reuses identical bytes. |
| Reconciliation | Out-of-order checks, expiry, tab handoff | Terminal states monotonic; expiry alone never proves absence. |
| Landing and routes | Sections, `/app`, `/app/`, query CTAs | Direct routes and learning/Solana links inspected in browser. |
| Dialogs and accessibility | Background, focus, Escape, selected controls | Portal plus inert background; Tab wraps and opener regains focus. |
| Mobile navigation | Shared handlers, roles, modes, simple/help, focus, resize | Independent review plus browser transitions; full-height right sheet with 34px controls. |
| Responsive web | Cards, compact navigation, forms, games, landing | Mobile screenshots and dimensions recorded in VERIFICATION.md. |

## Findings and corrections

| Finding | Correction |
|---|---|
| A stale tab could overwrite another tab's profile IDs and ledger. | Exclusive Web Locks writer, storage events and stale snapshot checks. |
| Failed writes appeared successful until reload. | Persist before exposing a mutation; leave memory unchanged on error. |
| Damaged persisted data was replaced by demo seeds on opening. | Retain original bytes; explicit download/recovery before replacement. |
| Backups used the currently watched guardian and discarded it on restore. | Persist verified guardian bases per profile; retain older hints separately. |
| Pretty exports could exceed their own import size limit. | Compact JSON with one 50 MB export/import bound. |
| Large numbers and fractional-cent tolerance could corrupt currency. | Parse decimal units exactly and reject non-round-tripping results. |
| Invalid pending topups or zero-amount movements passed validation. | Positive movements and purchase-only pending/rejected states. |
| Approving an old request omitted today's actual expense. | Store `resolvedAt`; reporting uses resolution date with legacy fallback. |
| Unknown transaction outcome allowed a fresh signature and duplicate send. | Durable operation journal and byte-identical rebroadcast. |
| Switching accounts during a wallet prompt could broadcast the old session. | Provider, key and generation checks throughout asynchronous signing. |
| Navigation cleared uncertain signature links or misplaced receipts. | Guardian/profile-scoped durable records and receipts. |
| Quiz audio continued after dismissal or changing learners. | Cancel narration and detach callbacks on context changes and unmount. |
| Adult consent remained checked after changing identity. | Clear consent on name, relationship or person-kind edits. |
| Rounded goal progress disabled the last cent of saving. | Compare exact saved/target cents; incomplete progress never displays 100%. |
| CSV formula protection missed leading whitespace. | Prefix formula-like cells as literals before quoting. |
| Dialogs exposed background controls to assistive technology. | Portal outside app content and restore inert/aria-hidden state on close. |
| Learners saw guardian-directed approval cues. | Guardian-only badge/nudge; learner bell opens personal activity. |
| Selected modes and learning profiles were only visually indicated. | Named groups and `aria-pressed` states. |
| Overlapping connects could activate the older wallet. | Only the newest connection request and its provider events are accepted. |
| Restored `__proto__`/`constructor` IDs could crash account display. | Read account maps through own-property lookup. |
| RPC fallback ran only during initial connection. | Retry default failed reads once through a freshly verified fallback. |
| Fallback selection could lose successful primary reads. | Merge known account, history and balance fields without inventing values. |
| An incompatible account was described as active. | Error status takes precedence; write controls remain hidden. |
| Old refresh completion cleared a newer loading indicator. | Latest-request generation for both automatic and manual refresh. |
| Writer handoff did not expose another tab's pending signature. | Reload the journal on acquisition and journal storage events. |
| A slow reconciliation could downgrade confirmed to pending. | Immutable record identity and monotonic terminal states. |
| Cross-browser recovery omitted unresolved signed operations. | Include validated signed bytes in current backups and merge conservatively. |
| Restore could delete pending profile identity or finish after dismissal. | Require matching pending profiles/bases and a current restore request. |
| Reset plus a changed guardian blocked later exports. | Include relevant terminal records by both profile and guardian; never drop pending records. |

## Practical limits

The app is still a browser-local hackathon prototype. Demo roles are not authentication. Practice limits are not an on-chain spending program. A user-led Phantom/Solflare connection and confirmed create/deposit/withdrawal remain untested. Mocked signing tests validate construction and lifecycle behavior; they do not prove a live extension or RPC transfer works. Expired signatures with no definitive historical result remain blocked deliberately. A backup made before a signature cannot know about that later operation. Physical-device and physical screen-reader testing, as well as usability sessions across the intended ages, remain future validation.

## Localization and Solana follow-up

Independent Luna localization reviews covered source catalogs, runtime errors, accessibility copy, preserved IDs, and live language changes. Root browser checks and fixes are recorded in [LOCALIZATION.md](LOCALIZATION.md).

Solana rounds 7–12 found and corrected:

- Imported JSON claimed terminal transaction states without chain evidence. Imported signatures now remain pending until reconciliation.
- Profile withdrawals could leave a nonzero account below its rent-exempt minimum. Such withdrawals are rejected.
- Fixed fee buffers could misclassify available funds. Fees now come from the RPC's exact prepared message, including the final signing blockhash.
- A second blockhash could change the fee after the earlier preflight. The final before-sign check quotes that exact message, re-reads funds, and rejects message or session changes.
- Guardian fee/debit remainders could violate rent transitions. Both the post-fee and post-instruction balances are checked against the current RPC minimum, including withdrawals credited to the guardian.
- Decimal comma inputs could fail in Spanish or Portuguese. Exact lamport parsing accepts one comma or point and rejects mixed separators.

The final independent review reported no additional actionable findings. The expanded suite passes **73 tests**, including unknown fees, blockhash changes, guardian rent boundaries, session changes during RPC checks, imported signatures, and localized dynamic labels. These checks do not replace funded extension and network execution tests.

A read-only mainnet RPC check at **2026-10-12 23:41:06 UTC** verified the mainnet genesis hash and quoted a zero-data `CreateAccountWithSeed` message: rent minimum **650,240 lamports**, fee **5,000 lamports**, one required signature. The payer was an ephemeral unfunded public key; no signature or broadcast occurred. These are observed values, not constants embedded in the app.

## Live testnet verification

The subsequent user-authorized testnet run confirmed actual creation, deposits, seeded withdrawals, recovery, and identical-byte rebroadcast. It exposed and corrected testnet backup isolation, BigInt handling in the local QA wallet, destination rent requirements, and invalid destination messages. The final suite passes 87 tests. See [TESTNET_QA.md](TESTNET_QA.md) for signatures and browser evidence. Mainnet funding and external extension UI remain untested.
