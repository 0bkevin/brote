import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Link2,
  RefreshCw,
  ShieldCheck,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  explorerAccount,
  transactionExplorer,
  useSolana,
  type ChainReceipt,
} from "../solana";
import type { Wallet } from "../types";
import { LatestRequest } from "../solana-connection";

type Props = {
  wallets: Wallet[];
  selectedWalletId?: string;
  notify: (message: string) => void;
};

function sol(lamports: number | null): string {
  if (lamports === null) return "—";
  const magnitude = BigInt(Math.abs(lamports));
  const whole = new Intl.NumberFormat("es-VE").format(
    Number(magnitude / 1_000_000_000n),
  );
  const fraction = (magnitude % 1_000_000_000n)
    .toString()
    .padStart(9, "0")
    .replace(/0+$/, "");
  return `${lamports < 0 ? "−" : ""}${whole}${fraction ? `,${fraction}` : ""}`;
}

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export default function SolanaPanel({
  wallets,
  selectedWalletId,
  notify,
}: Props) {
  const chain = useSolana();
  const [profileId, setProfileId] = useState(
    selectedWalletId ?? wallets[0]?.id ?? "",
  );
  const [watchInput, setWatchInput] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [receipt, setReceipt] = useState<
    | (ChainReceipt & { profileId: string; observedAddress: string | null })
    | null
  >(null);
  const [actionMessage, setActionMessage] = useState<{
    text: string;
    profileId: string;
    guardian: string | null;
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const refreshRequests = useRef(new LatestRequest());
  const profileIds = wallets.map((wallet) => wallet.id).join("|");

  useEffect(() => () => chain.invalidateSigningSession(), [chain.invalidateSigningSession]);

  useEffect(() => {
    if (
      selectedWalletId &&
      wallets.some((wallet) => wallet.id === selectedWalletId)
    )
      setProfileId(selectedWalletId);
    else if (!wallets.some((wallet) => wallet.id === profileId))
      setProfileId(wallets[0]?.id ?? "");
  }, [selectedWalletId, profileIds]);

  useEffect(() => {
    if (!chain.observedAddress) {
      refreshRequests.current.cancel();
      setLoading(false);
      return;
    }
    const request = refreshRequests.current.begin();
    setLoading(true);
    void chain
      .refresh(wallets)
      .catch((error) => {
        if (refreshRequests.current.isCurrent(request))
          setMessage(error instanceof Error ? error.message : String(error));
      })
      .finally(() => {
        if (refreshRequests.current.isCurrent(request)) setLoading(false);
      });
    return () => refreshRequests.current.cancel();
  }, [chain.observedAddress, profileIds]);

  useEffect(() => {
    setDestination(chain.connectedAddress ?? "");
  }, [chain.connectedAddress]);

  const wallet = wallets.find((item) => item.id === profileId);
  const account = wallet && Object.hasOwn(chain.accounts, wallet.id)
    ? chain.accounts[wallet.id] : undefined;
  const pending = chain.operations.filter((item) => item.state === "pending");
  const visibleOperations = chain.operations.filter(
    (item) => item.profileId === profileId && item.guardian === chain.observedAddress,
  );

  async function act(action: () => Promise<ChainReceipt>, success: string) {
    const activeProfileId = profileId;
    const activeObservedAddress = chain.observedAddress;
    setMessage(null);
    setActionMessage(null);
    try {
      const next = await action();
      setReceipt({
        ...next,
        profileId: activeProfileId,
        observedAddress: activeObservedAddress,
      });
      notify(`${success} Perfil: ${wallets.find((item) => item.id === activeProfileId)?.name ?? activeProfileId}.`);
      try {
        await chain.refresh(wallets);
      } catch (error) {
        setActionMessage({
          text: `Transacción confirmada; no se pudo actualizar el saldo: ${error instanceof Error ? error.message : String(error)}`,
          profileId: activeProfileId,
          guardian: activeObservedAddress,
        });
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : String(error);
      setActionMessage({ text, profileId: activeProfileId, guardian: activeObservedAddress });
      if (text !== "Operación cancelada.") notify(`Perfil ${wallets.find((item) => item.id === activeProfileId)?.name ?? activeProfileId}: ${text}`);
    }
  }

  async function watch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await chain.observeAddress(watchInput);
    } catch {
      setMessage("Introduce una dirección pública de Solana válida.");
    }
  }

  return (
    <section className="solana-panel card" aria-labelledby="solana-heading">
      <header className="solana-panel__head">
        <div>
          <span className="eyebrow">Dinero real</span>
          <h2 id="solana-heading">Cuentas en Solana</h2>
          <p className="muted">
            Cada perfil tiene una dirección propia. La billetera del
            representante controla los movimientos.
          </p>
        </div>
        <span className="solana-network">
          <span className="solana-network__dot" /> Solana mainnet
        </span>
      </header>

      <div className="solana-status" aria-live="polite">
        <div className="solana-status__icon">
          <WalletIcon size={20} aria-hidden="true" />
        </div>
        <div className="solana-status__body">
          <strong>
            {chain.connectedAddress
              ? `${chain.walletName} conectada`
              : chain.observedAddress
                ? "Consulta de solo lectura"
                : "Conecta tu billetera"}
          </strong>
          <span>
            {chain.observedAddress
              ? short(chain.observedAddress)
              : "Phantom o Solflare del representante"}
          </span>
          {chain.observedAddress && (
            <span>
              Saldo de la dirección consultada:{" "}
              {sol(chain.observedBalanceLamports)} SOL
            </span>
          )}
        </div>
        {chain.connectedAddress && (
          <button
            type="button"
            className="button button-ghost"
            onClick={() =>
              void chain
                .disconnect()
                .catch((error) => setMessage(String(error)))
            }
          >
            Desconectar
          </button>
        )}
      </div>

      {!chain.connectedAddress && (
        <div className="solana-connect">
          <div className="solana-connect__buttons">
            {chain.availableWallets.map((name) => (
              <button
                key={name}
                type="button"
                className="button button-primary"
                onClick={() =>
                  void chain
                    .connect(name)
                    .catch((error) =>
                      setMessage(
                        error instanceof Error ? error.message : String(error),
                      ),
                    )
                }
              >
                <Link2 size={18} aria-hidden="true" /> Conectar {name}
              </button>
            ))}
          </div>
          {chain.availableWallets.length === 0 && (
            <p className="muted">
              No encontramos una extensión compatible. Instala{" "}
              <a
                href="https://phantom.com/download"
                target="_blank"
                rel="noreferrer"
              >
                Phantom
              </a>{" "}
              o{" "}
              <a
                href="https://www.solflare.com/download"
                target="_blank"
                rel="noreferrer"
              >
                Solflare
              </a>
              , abre esta página en ese navegador y vuelve a cargar. También
              puedes consultar cuentas sin conectar una billetera.
            </p>
          )}
          <form className="solana-watch" onSubmit={watch}>
            <label htmlFor="solana-watch-address">
              Consultar con dirección pública del representante
            </label>
            <div>
              <input
                id="solana-watch-address"
                value={watchInput}
                onChange={(event) => setWatchInput(event.target.value)}
                placeholder="Dirección pública de Solana"
                autoComplete="off"
                required
              />
              <button type="submit" className="button button-secondary">
                Consultar
              </button>
            </div>
          </form>
        </div>
      )}

      {chain.rpcNotice && (
        <p className="solana-note" role="status">
          {chain.rpcNotice}
        </p>
      )}
      {chain.rpcError && (
        <p className="solana-error" role="alert">
          {chain.rpcError}
        </p>
      )}
      {message && (
        <p className="solana-error" role="alert">
          {message}
        </p>
      )}
      {actionMessage && actionMessage.profileId === profileId &&
        actionMessage.guardian === chain.observedAddress && (
          <p className="solana-error" role="alert">{actionMessage.text}</p>
        )}
      {chain.operationError && <p className="solana-error" role="alert">{chain.operationError}</p>}
      {pending.length > 0 && (
        <div className="solana-note" role="status">
          <strong>Operaciones pendientes de verificación</strong>
          <p>Se bloquearon nuevas firmas hasta conocer el resultado. El registro permanece al cambiar de perfil o recargar.</p>
          {pending.map((item) => (
            <div className="solana-operation" key={item.signature}>
              <span>{wallets.find((entry) => entry.id === item.profileId)?.name ?? item.profileId} · representante {short(item.guardian)} · {item.kind === "withdraw" ? "retiro" : item.kind === "deposit" ? "depósito" : "creación"}</span>
              <a href={transactionExplorer(item.signature)} target="_blank" rel="noreferrer">Ver firma {short(item.signature)}</a>
              {item.detail && <span>{item.detail}</span>}
              <button type="button" className="button button-ghost" disabled={chain.busy}
                onClick={() => void chain.reconcile(item.signature).catch((error) =>
                  setActionMessage({ text: String(error), profileId: item.profileId, guardian: item.guardian }))}>
                Verificar estado
              </button>
              {chain.connectedAddress === item.guardian && (
                <button type="button" className="button button-ghost" disabled={chain.busy}
                  onClick={() => void chain.retrySigned(item.signature).catch((error) =>
                    setActionMessage({ text: String(error), profileId: item.profileId, guardian: item.guardian }))}>
                  Reenviar misma firma
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {chain.observedAddress && (
        <>
          <div className="solana-profilebar">
            <label htmlFor="solana-profile">Perfil</label>
            <select
              id="solana-profile"
              value={profileId}
              onChange={(event) => {
                setProfileId(event.target.value);
              }}
            >
              {wallets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {item.relationship}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="button button-ghost"
              onClick={() => {
                const request = refreshRequests.current.begin();
                setLoading(true);
                void chain
                  .refresh(wallets)
                  .catch((error) => {
                    if (refreshRequests.current.isCurrent(request)) setMessage(String(error));
                  })
                  .finally(() => {
                    if (refreshRequests.current.isCurrent(request)) setLoading(false);
                  });
              }}
              disabled={loading || chain.busy}
            >
              <RefreshCw size={18} aria-hidden="true" /> Actualizar
            </button>
          </div>

          {wallet && (
            <div className="solana-account">
              <div className="solana-account__balance">
                <span className="muted">Saldo verificado de {wallet.name}</span>
                <strong>
                  {account ? sol(account.balanceLamports) : "—"}{" "}
                  <small>SOL</small>
                </strong>
                <span className="solana-account__state">
                  {loading && !account
                    ? "Consultando RPC…"
                    : account?.error
                      ? account.exists === true
                        ? "Cuenta incompatible para operaciones"
                        : "Estado no disponible"
                    : account?.exists === true
                      ? "Cuenta activa en mainnet"
                      : account?.exists === false
                        ? "Cuenta aún no creada"
                        : account
                          ? "Estado no disponible"
                          : "Esperando datos de mainnet"}
                </span>
              </div>
              {account && (
                <div className="solana-account__address">
                  <span className="muted">Dirección del perfil</span>
                  <code>{account.address}</code>
                  <a
                    href={explorerAccount(account.address)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver en Solana Explorer{" "}
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          )}

          {account?.error && (
            <p className="solana-note" role="status">
              {account.error}
            </p>
          )}
          {account?.historyError && (
            <p className="solana-note" role="status">
              {account.historyError}
            </p>
          )}

          {wallet &&
            account &&
            chain.connectedAddress === chain.observedAddress &&
            account.exists !== null &&
            !account.error && (
              <div className="solana-actions">
                {account.exists === false ? (
                  <div className="solana-action">
                    <div className="solana-action__title">
                      <ShieldCheck size={19} aria-hidden="true" />
                      <h3>Crear cuenta</h3>
                    </div>
                    <p>
                      Se cobra desde la billetera del representante el mínimo de
                      red para una cuenta de sistema sin datos, más comisión.
                      Verás el monto exacto antes de firmar.
                    </p>
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={chain.busy || pending.length > 0 || !!chain.operationError}
                      onClick={() =>
                        void act(
                          () => chain.createProfile(wallet),
                          "Cuenta creada y confirmada en mainnet.",
                        )
                      }
                    >
                      Crear cuenta de {wallet.name}
                    </button>
                  </div>
                ) : (
                  <>
                    <form
                      className="solana-action"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void act(
                          () => chain.deposit(wallet, depositAmount),
                          "Depósito confirmado en mainnet.",
                        );
                      }}
                    >
                      <div className="solana-action__title">
                        <ArrowDownLeft size={19} aria-hidden="true" />
                        <h3>Depositar</h3>
                      </div>
                      <label htmlFor="solana-deposit">Monto en SOL</label>
                      <input
                        id="solana-deposit"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.01"
                        value={depositAmount}
                        onChange={(event) =>
                          setDepositAmount(event.target.value.replace(",", "."))
                        }
                        required
                      />
                      <p>
                        Desde {short(chain.connectedAddress)} hacia{" "}
                        {short(account.address)}.
                      </p>
                      <button
                        type="submit"
                        className="button button-primary"
                        disabled={chain.busy || pending.length > 0 || !!chain.operationError}
                      >
                        Revisar y depositar
                      </button>
                    </form>
                    <form
                      className="solana-action"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void act(
                          () =>
                            chain.withdraw(wallet, withdrawAmount, destination),
                          "Retiro confirmado en mainnet.",
                        );
                      }}
                    >
                      <div className="solana-action__title">
                        <ArrowUpRight size={19} aria-hidden="true" />
                        <h3>Retirar</h3>
                      </div>
                      <label htmlFor="solana-withdraw">Monto en SOL</label>
                      <input
                        id="solana-withdraw"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.01"
                        value={withdrawAmount}
                        onChange={(event) =>
                          setWithdrawAmount(
                            event.target.value.replace(",", "."),
                          )
                        }
                        required
                      />
                      <label htmlFor="solana-destination">
                        Dirección de destino
                      </label>
                      <input
                        id="solana-destination"
                        type="text"
                        value={destination}
                        onChange={(event) => setDestination(event.target.value)}
                        required
                        autoComplete="off"
                      />
                      <p>
                        Solo el representante puede firmar este retiro.
                        Comprueba la dirección antes de continuar.
                      </p>
                      <button
                        type="submit"
                        className="button button-secondary"
                        disabled={chain.busy || pending.length > 0 || !!chain.operationError}
                      >
                        Revisar y retirar
                      </button>
                    </form>
                  </>
                )}
              </div>
            )}

          {receipt &&
            receipt.profileId === profileId &&
            receipt.observedAddress === chain.observedAddress && (
              <p className="solana-success" role="status">
                Transacción confirmada.{" "}
                <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
                  Ver recibo en Solana Explorer{" "}
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </p>
            )}
          {visibleOperations.filter((item) => item.state !== "pending" && item.signature !== receipt?.signature).map((item) => (
            <p className={item.state === "confirmed" ? "solana-success" : "solana-error"} key={item.signature} role="status">
              {item.state === "confirmed" ? "Transacción confirmada" : "Transacción fallida"}.{" "}
              <a href={transactionExplorer(item.signature)} target="_blank" rel="noreferrer">Ver firma {short(item.signature)}</a>
            </p>
          ))}

          {account && (
            <div className="solana-history">
              <div className="solana-history__heading">
                <h3>Actividad en mainnet</h3>
                <span className="muted">
                  Últimas 8 firmas que incluyen esta dirección
                </span>
              </div>
              {account.activity.length === 0 ? (
                <p className="muted">
                  {account.historyError || account.error
                    ? "No se pudo cargar el historial."
                    : "No hay movimientos confirmados para esta dirección."}
                </p>
              ) : (
                <ul>
                  {account.activity.map((entry) => (
                    <li key={entry.signature}>
                      <span className="solana-history__mark" aria-hidden="true">
                        {entry.changeLamports === null
                          ? "•"
                          : entry.changeLamports >= 0
                            ? "+"
                            : "−"}
                      </span>
                      <span>
                        <strong>
                          {entry.status === "failed"
                            ? "Transacción fallida"
                            : entry.changeLamports === null
                              ? "Movimiento en cadena"
                              : entry.changeLamports > 0
                                ? "Entrada"
                                : entry.changeLamports < 0
                                  ? "Salida"
                                  : "Sin cambio de saldo"}
                        </strong>
                        <small>
                          {entry.blockTime
                            ? new Date(entry.blockTime * 1000).toLocaleString(
                                "es-VE",
                              )
                            : "Hora no disponible"}{" "}
                          ·{" "}
                          {entry.status === "failed"
                            ? "fallida"
                            : entry.status === "finalized"
                              ? "finalizada"
                              : "confirmada"}
                        </small>
                      </span>
                      {entry.changeLamports !== null && (
                        <strong>
                          {entry.changeLamports > 0 ? "+" : ""}
                          {sol(entry.changeLamports)} SOL
                        </strong>
                      )}
                      <a
                        href={transactionExplorer(entry.signature)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Ver transacción ${entry.signature} en Solana Explorer`}
                      >
                        <ExternalLink size={17} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <p className="solana-footnote">
        Los perfiles son cuentas de sistema controladas técnicamente por la
        billetera del representante. Consultar no reserva fondos; cada operación
        real necesita su firma y puede pagar comisión de red. Las actividades de
        práctica de Brote son independientes de SOL.
      </p>
    </section>
  );
}
