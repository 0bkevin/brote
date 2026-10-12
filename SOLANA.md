# Brote · Solana mainnet integration

This integration uses **real SOL on Solana mainnet**. Brote's practice balances and purchases remain separate and must never be shown as on-chain funds.

## Dependency and parent integration

The integration uses `@solana/web3.js` **1.x** and the injected Phantom and Solflare providers’ legacy `Transaction` signing interface. It requires no wallet adapter, keypair storage, token library, or backend. Migration to a newer SDK remains a separate compatibility review.

In the parent app:

```tsx
import { SolanaProvider } from './solana';
import SolanaPanel from './components/SolanaPanel';
import './solana.css';

<SolanaProvider>
  <App />
</SolanaProvider>

// Inside App, in the real-SOL view:
<SolanaPanel wallets={store.state.wallets} selectedWalletId={selectedWalletId} notify={notify} />
```

`SolanaProvider` requires only `children`. `useSolana()` exposes:

| Field or method                                      | Meaning                                                                                                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `network`                                            | Literal `Solana mainnet`.                                                                                                                                |
| `rpcUrl`, `rpcNotice`, `rpcError`                    | Verified endpoint and visible fallback/error state.                                                                                                      |
| `availableWallets`, `walletName`, `connectedAddress` | Installed Phantom/Solflare detection and connected guardian.                                                                                             |
| `observedAddress`, `observeAddress(address)`         | Connected guardian or read-only public address; the latter never grants signing.                                                                         |
| `observedBalanceLamports`, `accounts[wallet.id]`     | RPC balance of `observedAddress` and profile metadata, including recent on-chain activity. Values are lamports; `null` means the read has not succeeded. |
| `connect(name)`, `disconnect()`                      | Extension connection controls.                                                                                                                           |
| `refresh(wallets)`                                   | Re-derive each supplied profile address and fetch balances and recent transactions.                                                                      |
| `createProfile(wallet)`                              | User-confirmed `createAccountWithSeed` with the RPC rent-exempt minimum for zero-byte system accounts.                                                   |
| `deposit(wallet, amountSol)`                         | User-confirmed guardian-signed SOL transfer to the derived account.                                                                                      |
| `withdraw(wallet, amountSol, destination)`           | User-confirmed `TransferWithSeed`, authorized by the guardian base key.                                                                                  |
| `busy`                                               | A signing operation is under way.                                                                                                                        |
| `operations`, `operationError`                       | Locally persisted signed operations, scoped by guardian and profile; storage errors block new writes.                                                   |
| `reconcile(signature)`, `retrySigned(signature)`     | Read the transaction's chain status, or rebroadcast the exact stored signed bytes while the blockhash is valid. Neither method asks for a new signature. |
| `invalidateSigningSession()`                         | Invalidates in-flight signing when the Solana panel unmounts.                                                                                             |

The three write methods return `{ signature, explorerUrl, address }` after RPC confirmation. They throw on rejection or network error. Before broadcast, the app stores the signed bytes, signature, blockhash, expiry height, guardian, and profile in local storage. If storage fails, it does not broadcast. If sending or confirming becomes uncertain, the panel retains the pending record across profile navigation and reloads and blocks every fresh write. The user can verify the signature's status and, while valid, explicitly rebroadcast **the same signed bytes**. A subsequent balance refresh failure does not change a confirmed receipt into a failed transaction. `SolanaPanel` refreshes after success. `explorerAccount` and `transactionExplorer` are exported for other views.

An expired blockhash alone does not prove the original transaction was absent: a delayed RPC history response may still reveal it. Reconciliation uses historical signature status and profile account history; if neither gives a definitive result, the operation remains pending and no new money transfer is signed. This conservative state may require independent investigation using the displayed signature and a reliable mainnet RPC. Removing browser storage would also remove this safety record; preserve it until the outcome is known. A Web Locks lease coordinates profile and Solana journal writes: secondary tabs stay read-only and reload pending operations when they become the writer. Confirmed and failed outcomes cannot be downgraded by a slower reconciliation. Current backups carry validated signed operations and merge them conservatively on restore; an older backup cannot know about signatures created after its export.

## Address and custody model

Each profile uses `PublicKey.createWithSeed(guardian, seed, SystemProgram.programId)`. The deterministic seed is `brote1-` plus 12 bytes (24 lowercase hexadecimal characters) from SHA-256 of `brote:profile:v1:${wallet.id}`: **31 ASCII bytes**, under the 32-byte limit. It does not include a child's private key. A profile ID must remain stable; changing it changes the derived address. The guardian public key also determines all addresses; switching guardian wallets produces a different set. Preserve both when migrating data.

Creation allocates zero data bytes and assigns the System Program as owner. The guardian pays the minimum balance returned by `getMinimumBalanceForRentExemption(0)`, plus transaction fees. Sending SOL to a derived address before the explicit creation step can cause a system account to appear there; the panel treats an existing, zero-data System Program account as active and does not try to recreate it. A drained zero-byte account may disappear from RPC and can then be recreated.

The guardian's wallet is the signing authority for both creation and `TransferWithSeed` withdrawals. Children and senior profiles do not hold independent on-chain keys. A learner may propose a movement in a broader product flow, but the guardian executes it here. Brote's local settings and practice approval flags are not enforced by the chain. This MVP does not claim adult consent verification or infer merchant identity from a destination address; users enter and review destinations themselves.

No seed phrases, private keys, or wallet session secrets are stored. Signed transaction bytes and public transaction metadata are stored locally for safe retry. The profile seed is public deterministic address data, not a secret. The app asks the extension to sign a prepared legacy transaction, verifies that the signed message matches the reviewed transaction, checks that the same provider, public key, and session generation are still active, submits it to the verified mainnet RPC, waits for `confirmed` status, and links to Solana Explorer. Account changes, disconnects, reconnects, and unmounts invalidate an in-flight signing session. A failed confirmation is not recorded as a successful payment. Recent activity comes from `getSignaturesForAddress` and transaction metadata, limited to the latest eight signatures. An RPC that lacks historical transaction details may show a confirmed signature without an amount.

Read-only observation shows the RPC balance for the observed public address separately from the connected signing wallet. A failed balance or account read displays an unknown value; profile writes are hidden until that account's state is known. Partial history keeps the signatures that were retrieved and labels missing transaction details. The RPC balance and history can change after any refresh.

If two extension approvals overlap, only the newest connection request can become active. Disconnecting cancels pending approvals, and late events from an older provider cannot replace the current wallet. Automatic and manual refreshes likewise display results and loading state only for the newest request. An existing account with an incompatible owner or data is labeled incompatible and its write controls remain hidden.

## Fee, rent, and restored-operation checks

Before wallet signing, Brote quotes `getFeeForMessage` for the final message, including the blockhash that will actually be signed, and reads the guardian's confirmed balance again. Creation and deposits require their funding amount plus that fee; withdrawals require the guardian's fee balance. The final guard also checks the guardian's balance after fee collection and after the instruction: each remainder must be zero or meet the RPC's current zero-data rent-exempt minimum. A withdrawal to the guardian includes its incoming credit in the final check. The profile account's withdrawal remainder must likewise be zero or rent-exempt.

The checked message cannot change before signing. Null or invalid fee/rent responses, insufficient funds, or a changed signing session stop the operation before the extension prompt. These are point-in-time checks; the network still determines the execution outcome if account balances change afterward.

Imported backups cannot establish transaction success. Every imported signed record starts pending until RPC reconciliation, even if the JSON claims it is confirmed, failed, or expired. Existing local evidence merges conservatively and unresolved signatures continue to block fresh writes.

SOL inputs accept a single decimal point or comma with up to nine decimal places. Parsing uses integer lamports; mixed separators and fractional lamports are rejected. Display formatting and native review prompts follow the selected interface language without changing addresses or signed bytes.

## RPC configuration

`VITE_SOLANA_RPC_URL` may specify a dedicated **HTTPS Solana mainnet** RPC endpoint. The app calls `getGenesisHash` and accepts only mainnet's genesis hash before using it. If no override is set, it starts with `https://api.mainnet.solana.com` (Solana's documented public mainnet endpoint); if that public endpoint fails, it tries `https://solana-rpc.publicnode.com` (PublicNode's documented Solana mainnet endpoint), verifies the same genesis hash, and displays the fallback. RPC HTTP calls have a 15-second timeout. A failed configured endpoint is surfaced as an error. The app never falls back to devnet or testnet. For a deployed product, provide a dedicated mainnet RPC with adequate rate limits and browser CORS support.

If the official public endpoint passes its initial handshake but later balance, account, or history reads fail, a refresh verifies PublicNode's genesis again and retries those reads once. The app switches to PublicNode only when that retry reduces read failures. If verification or the retry fails, already known values remain known and failed fields remain unknown or marked incomplete. A configured RPC is never silently replaced. This read fallback does not retry signing, sending, or any other write operation.

The public Solana endpoint can return 403 or 429 and may not support a busy UI reliably. The fallback is still public and subject to its own limits. Wallet extensions might be configured for another cluster; this implementation uses their **sign-only** method and sends the signed bytes through the verified mainnet RPC, so a wallet network setting cannot redirect submission to another cluster. The extension may still refuse to sign if its network setting disagrees.

## References

- [Solana System Program instructions](https://solana.com/docs/core/programs/builtin-programs) (`CreateAccountWithSeed`, `TransferWithSeed`)
- [Solana mainnet RPC and commitment levels](https://solana.com/docs/rpc)
- [Solana web3.js 1.x `CreateAccountWithSeedParams`](https://solana-foundation.github.io/solana-web3.js/v1.x/types/CreateAccountWithSeedParams.html)
- [Solana web3.js 1.x `TransferWithSeedParams`](https://solana-foundation.github.io/solana-web3.js/v1.x/types/TransferWithSeedParams.html)
- [Phantom injected provider transaction signing](https://docs.phantom.com/solana/sending-a-transaction)
- [Solflare wallet SDK signing examples](https://docs.solflare.com/solflare/technical/integrate-solflare/solflare-wallet-sdk)
- [Solana mainnet genesis hash in Solana Labs source](https://github.com/solana-labs/solana/blob/master/sdk/src/genesis_config.rs)
