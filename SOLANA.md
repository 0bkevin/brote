# Brote · Solana mainnet integration

This integration uses **real SOL on Solana mainnet**. Brote's practice balances and purchases remain separate and must never be shown as on-chain funds.

## Dependency and parent integration

Add exactly one runtime dependency to `package.json`: `@solana/web3.js` **1.x** (for example `^1.98.4`). It is the stable class-based API used by the injected Phantom and Solflare transaction providers here. No wallet adapter, keypair storage, token library, or backend is required. The Solana Foundation now recommends web3.js 3 for new code, but its async transaction and signer API is a different integration from these wallets' documented legacy `Transaction` interface; this module intentionally uses the maintained 1.x API for compatible browser wallet signing.

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

The three write methods return `{ signature, explorerUrl, address }` after RPC confirmation. They throw on rejection or network error. If an RPC send or confirmation fails after signing, the panel shows the signed transaction's explorer link as an **uncertain outcome**, so the user can check it before retrying. A subsequent balance refresh failure does not change a confirmed receipt into a failed transaction. `SolanaPanel` refreshes after success. `explorerAccount` and `transactionExplorer` are exported for other views.

## Address and custody model

Each profile uses `PublicKey.createWithSeed(guardian, seed, SystemProgram.programId)`. The deterministic seed is `brote1-` plus 12 bytes (24 lowercase hexadecimal characters) from SHA-256 of `brote:profile:v1:${wallet.id}`: **31 ASCII bytes**, under the 32-byte limit. It does not include a child's private key. A profile ID must remain stable; changing it changes the derived address. The guardian public key also determines all addresses; switching guardian wallets produces a different set. Preserve both when migrating data.

Creation allocates zero data bytes and assigns the System Program as owner. The guardian pays the minimum balance returned by `getMinimumBalanceForRentExemption(0)`, plus transaction fees. Sending SOL to a derived address before the explicit creation step can cause a system account to appear there; the panel treats an existing, zero-data System Program account as active and does not try to recreate it. A drained zero-byte account may disappear from RPC and can then be recreated.

The guardian's wallet is the signing authority for both creation and `TransferWithSeed` withdrawals. Children and senior profiles do not hold independent on-chain keys. A learner may propose a movement in a broader product flow, but the guardian executes it here. Brote's local settings and practice approval flags are not enforced by the chain. This MVP does not claim adult consent verification or infer merchant identity from a destination address; users enter and review destinations themselves.

No seed phrases, private keys, or wallet session secrets are stored. The profile seed is public deterministic address data, not a secret. The app asks the extension to sign a prepared legacy transaction, verifies that the signed message matches the reviewed transaction, submits it to the verified mainnet RPC, waits for `confirmed` status, and links to Solana Explorer. A failed confirmation is not recorded as a successful payment. Recent activity comes from `getSignaturesForAddress` and transaction metadata, limited to the latest eight signatures. An RPC that lacks historical transaction details may show a confirmed signature without an amount.

Read-only observation shows the RPC balance for the observed public address separately from the connected signing wallet. A failed balance or account read displays an unknown value; profile writes are hidden until that account's state is known. Partial history keeps the signatures that were retrieved and labels missing transaction details. The RPC balance and history can change after any refresh.

## RPC configuration

`VITE_SOLANA_RPC_URL` may specify a dedicated **HTTPS Solana mainnet** RPC endpoint. The app calls `getGenesisHash` and accepts only mainnet's genesis hash before using it. If no override is set, it starts with `https://api.mainnet.solana.com` (Solana's documented public mainnet endpoint); if that public endpoint fails, it tries `https://solana-rpc.publicnode.com` (PublicNode's documented Solana mainnet endpoint), verifies the same genesis hash, and displays the fallback. RPC HTTP calls have a 15-second timeout. A failed configured endpoint is surfaced as an error. The app never falls back to devnet or testnet. For a deployed product, provide a dedicated mainnet RPC with adequate rate limits and browser CORS support.

The public Solana endpoint can return 403 or 429 and may not support a busy UI reliably. The fallback is still public and subject to its own limits. Wallet extensions might be configured for another cluster; this implementation uses their **sign-only** method and sends the signed bytes through the verified mainnet RPC, so a wallet network setting cannot redirect submission to another cluster. The extension may still refuse to sign if its network setting disagrees.

## References

- [Solana System Program instructions](https://solana.com/docs/core/programs/builtin-programs) (`CreateAccountWithSeed`, `TransferWithSeed`)
- [Solana mainnet RPC and commitment levels](https://solana.com/docs/rpc)
- [Solana web3.js 1.x `CreateAccountWithSeedParams`](https://solana-foundation.github.io/solana-web3.js/v1.x/types/CreateAccountWithSeedParams.html)
- [Solana web3.js 1.x `TransferWithSeedParams`](https://solana-foundation.github.io/solana-web3.js/v1.x/types/TransferWithSeedParams.html)
- [Phantom injected provider transaction signing](https://docs.phantom.com/solana/sending-a-transaction)
- [Solflare wallet SDK signing examples](https://docs.solflare.com/solflare/technical/integrate-solflare/solflare-wallet-sdk)
- [Solana mainnet genesis hash in Solana Labs source](https://github.com/solana-labs/solana/blob/master/sdk/src/genesis_config.rs)
