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
