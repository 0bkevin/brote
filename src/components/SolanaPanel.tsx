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
import { useI18n, getIntlLocale } from "../i18n";
import { LatestRequest } from "../solana-connection";
import NetworkSelector from "./NetworkSelector";

type Props = {
  wallets: Wallet[];
  selectedWalletId?: string;
  notify: (message: string) => void;
};

function sol(lamports: number | null): string {
  if (lamports === null) return "—";
  const magnitude = BigInt(Math.abs(lamports));
  const whole = new Intl.NumberFormat(getIntlLocale()).format(
    Number(magnitude / 1_000_000_000n),
  );
  const fraction = (magnitude % 1_000_000_000n)
    .toString()
    .padStart(9, "0")
    .replace(/0+$/, "");
  return `${lamports < 0 ? "−" : ""}${whole}${fraction ? `${new Intl.NumberFormat(getIntlLocale()).formatToParts(1.1).find(part => part.type === "decimal")?.value ?? "."}${fraction}` : ""}`;
}

function short(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export default function SolanaPanel({
  wallets,
  selectedWalletId,
  notify,
}: Props) {
  const { t, locale } = useI18n();
  const chain = useSolana();
  const testnet = chain.network === "Solana testnet";
  const solUnit = testnet ? t("SOL de prueba") : "SOL";
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
      notify(t("{success} Perfil: {name}.", { success, name: wallets.find((item) => item.id === activeProfileId)?.name ?? activeProfileId }));
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
      if (text !== "Operación cancelada.") notify(t("Perfil {name}: {error}", { name: wallets.find((item) => item.id === activeProfileId)?.name ?? activeProfileId, error: text }));
    }
  }

  async function watch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await chain.observeAddress(watchInput);
    } catch {
      setMessage(t("Introduce una dirección pública de Solana válida."));
    }
  }

  return (
    <section className="solana-panel card" aria-labelledby="solana-heading">
      <header className="solana-panel__head">
        <div>
          <span className="eyebrow">{testnet ? t("Pruebas · sin valor monetario") : t("Dinero real")}</span>
          <h2 id="solana-heading">{t("Cuentas en Solana")}</h2>
          <p className="muted">
            {t("Cada perfil tiene una dirección propia. La billetera del representante controla los movimientos.")} </p>
        </div>
        <div className="solana-panel__network">
          <span className="solana-network">
            <span className="solana-network__dot" /> {t(chain.network)}
          </span>
          <NetworkSelector busy={chain.busy} />
        </div>
      </header>
      {testnet && <p className="solana-note" role="status">{t("Red de prueba: el SOL de prueba no tiene valor monetario.")}</p>}

      <div className="solana-status" aria-live="polite" data-brote-tour="solana">
        <div className="solana-status__icon">
          <WalletIcon size={20} aria-hidden="true" />
        </div>
        <div className="solana-status__body">
          <strong>
            {chain.connectedAddress
              ? t("{wallet} conectada", { wallet: chain.walletName ?? "" })
              : chain.observedAddress
                ? t("Consulta de solo lectura")
                : t("Conecta tu billetera")}
          </strong>
          <span>
            {chain.observedAddress
              ? short(chain.observedAddress)
              : t("Phantom o Solflare del representante")}
          </span>
          {chain.observedAddress && (
            <span>
              {t("Saldo de la dirección consultada:")}{" "}
              {sol(chain.observedBalanceLamports)} {solUnit}
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
            {t("Desconectar")} </button>
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
                <Link2 size={18} aria-hidden="true" /> {t("Conectar")} {name}
              </button>
            ))}
          </div>
          {chain.availableWallets.length === 0 && (
            <p className="muted">
              {t("No encontramos una extensión compatible. Instala")}{" "}
              <a
                href="https://phantom.com/download"
                target="_blank"
                rel="noreferrer"
              >
                {t("Phantom")}</a>{" "}
              {t("o")}{" "}
              <a
                href="https://www.solflare.com/download"
                target="_blank"
                rel="noreferrer"
              >
                {t("Solflare")}</a>
              {t(", abre esta página en ese navegador y vuelve a cargar. También puedes consultar cuentas sin conectar una billetera.")} </p>
          )}
          <form className="solana-watch" onSubmit={watch}>
            <label htmlFor="solana-watch-address">
              {t("Consultar con dirección pública del representante")} </label>
            <div>
              <input
                id="solana-watch-address"
                value={watchInput}
                onChange={(event) => setWatchInput(event.target.value)}
                placeholder={t("Dirección pública de Solana")}
                autoComplete="off"
                required
              />
              <button type="submit" className="button button-secondary">
                {t("Consultar")} </button>
            </div>
          </form>
        </div>
      )}

      {chain.rpcNotice && (
        <p className="solana-note" role="status">
          {t(chain.rpcNotice)}
        </p>
      )}
      {chain.rpcError && (
        <p className="solana-error" role="alert">
          {t(chain.rpcError)}
        </p>
      )}
      {message && (
        <p className="solana-error" role="alert">
          {t(message)}
        </p>
      )}
      {actionMessage && actionMessage.profileId === profileId &&
        actionMessage.guardian === chain.observedAddress && (
          <p className="solana-error" role="alert">{t(actionMessage.text)}</p>
        )}
      {chain.operationError && <p className="solana-error" role="alert">{t(chain.operationError)}</p>}
      {pending.length > 0 && (
        <div className="solana-note" role="status">
          <strong>{t("Operaciones pendientes de verificación")}</strong>
          <p>{t("Se bloquearon nuevas firmas hasta conocer el resultado. El registro permanece al cambiar de perfil o recargar.")}</p>
          {pending.map((item) => (
            <div className="solana-operation" key={item.signature}>
              <span>{wallets.find((entry) => entry.id === item.profileId)?.name ?? item.profileId} {t("· representante")} {short(item.guardian)} · {item.kind === "withdraw" ? t("retiro") : item.kind === "deposit" ? t("depósito") : t("creación")}</span>
              <a href={transactionExplorer(item.signature)} target="_blank" rel="noreferrer">{t("Ver firma")} {short(item.signature)}</a>
              {item.detail && <span>{t(item.detail)}</span>}
              <button type="button" className="button button-ghost" disabled={chain.busy}
                onClick={() => void chain.reconcile(item.signature).catch((error) =>
                  setActionMessage({ text: String(error), profileId: item.profileId, guardian: item.guardian }))}>
                {t("Verificar estado")} </button>
              {chain.connectedAddress === item.guardian && (
                <button type="button" className="button button-ghost" disabled={chain.busy}
                  onClick={() => void chain.retrySigned(item.signature).catch((error) =>
                    setActionMessage({ text: String(error), profileId: item.profileId, guardian: item.guardian }))}>
                  {t("Reenviar misma firma")} </button>
              )}
            </div>
          ))}
        </div>
      )}

      {chain.observedAddress && (
        <>
          <div className="solana-profilebar">
            <label htmlFor="solana-profile">{t("Perfil")}</label>
            <select
              id="solana-profile"
              value={profileId}
              onChange={(event) => {
                setProfileId(event.target.value);
              }}
            >
              {wallets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} · {t(item.relationship)}
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
              <RefreshCw size={18} aria-hidden="true" /> {t("Actualizar")} </button>
          </div>

          {wallet && (
            <div className="solana-account">
              <div className="solana-account__balance">
                <span className="muted">{t("Saldo verificado de")} {wallet.name}</span>
                <strong>
                  {account ? sol(account.balanceLamports) : "—"}{" "}
                  <small>{solUnit}</small>
                </strong>
                <span className="solana-account__state">
                  {loading && !account
                    ? t("Consultando RPC…")
                    : account?.error
                      ? account.exists === true
                        ? t("Cuenta incompatible para operaciones")
                        : t("Estado no disponible")
                    : account?.exists === true
                      ? t(testnet ? "Cuenta activa en testnet" : "Cuenta activa en mainnet")
                      : account?.exists === false
                        ? t("Cuenta aún no creada")
                        : account
                          ? t("Estado no disponible")
                          : t(testnet ? "Esperando datos de testnet" : "Esperando datos de mainnet")}
                </span>
              </div>
              {account && (
                <div className="solana-account__address">
                  <span className="muted">{t("Dirección del perfil")}</span>
                  <code>{account.address}</code>
                  <a
                    href={explorerAccount(account.address)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("Ver en Solana Explorer")}{" "}
                    <ExternalLink size={15} aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          )}

          {account?.error && (
            <p className="solana-note" role="status">
              {t(account.error)}
            </p>
          )}
          {account?.historyError && (
            <p className="solana-note" role="status">
              {t(account.historyError)}
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
                      <h3>{t("Crear cuenta")}</h3>
                    </div>
                    <p>
                      {t("Se cobra desde la billetera del representante el mínimo de red para una cuenta de sistema sin datos, más comisión. Verás el monto exacto antes de firmar.")} </p>
                    <button
                      type="button"
                      className="button button-primary"
                      disabled={chain.busy || pending.length > 0 || !!chain.operationError}
                      onClick={() =>
                        void act(
                          () => chain.createProfile(wallet),
                          t(testnet ? "Cuenta creada y confirmada en testnet." : "Cuenta creada y confirmada en mainnet."),
                        )
                      }
                    >
                      {t("Crear cuenta de")} {wallet.name}
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
                          t(testnet ? "Depósito confirmado en testnet." : "Depósito confirmado en mainnet."),
                        );
                      }}
                    >
                      <div className="solana-action__title">
                        <ArrowDownLeft size={19} aria-hidden="true" />
                        <h3>{t("Depositar")}</h3>
                      </div>
                      <label htmlFor="solana-deposit">{t(testnet ? "Monto en SOL de prueba" : "Monto en SOL")}</label>
                      <input
                        id="solana-deposit"
                        type="text"
                        inputMode="decimal"
                        placeholder={new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(0.01)}
                        value={depositAmount}
                        onChange={(event) =>
                          setDepositAmount(event.target.value)
                        }
                        required
                      />
                      <p>
                        {t("Desde")} {short(chain.connectedAddress)} {t("hacia")}{" "}
                        {short(account.address)}.
                      </p>
                      <button
                        type="submit"
                        className="button button-primary"
                        disabled={chain.busy || pending.length > 0 || !!chain.operationError}
                      >
                        {t("Revisar y depositar")} </button>
                    </form>
                    <form
                      className="solana-action"
                      onSubmit={(event) => {
                        event.preventDefault();
                        void act(
                          () =>
                            chain.withdraw(wallet, withdrawAmount, destination),
                          t(testnet ? "Retiro confirmado en testnet." : "Retiro confirmado en mainnet."),
                        );
                      }}
                    >
                      <div className="solana-action__title">
                        <ArrowUpRight size={19} aria-hidden="true" />
                        <h3>{t("Retirar")}</h3>
                      </div>
                      <label htmlFor="solana-withdraw">{t(testnet ? "Monto en SOL de prueba" : "Monto en SOL")}</label>
                      <input
                        id="solana-withdraw"
                        type="text"
                        inputMode="decimal"
                        placeholder={new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(0.01)}
                        value={withdrawAmount}
                        onChange={(event) =>
                          setWithdrawAmount(event.target.value)
                        }
                        required
                      />
                      <label htmlFor="solana-destination">
                        {t("Dirección de destino")} </label>
                      <input
                        id="solana-destination"
                        type="text"
                        value={destination}
                        onChange={(event) => setDestination(event.target.value)}
                        required
                        autoComplete="off"
                      />
                      <p>
                        {t("Solo el representante puede firmar este retiro. Comprueba la dirección antes de continuar.")} </p>
                      <button
                        type="submit"
                        className="button button-secondary"
                        disabled={chain.busy || pending.length > 0 || !!chain.operationError}
                      >
                        {t("Revisar y retirar")} </button>
                    </form>
                  </>
                )}
              </div>
            )}

          {receipt &&
            receipt.profileId === profileId &&
            receipt.observedAddress === chain.observedAddress && (
              <p className="solana-success" role="status">
                {t("Transacción confirmada.")}{" "}
                <a href={receipt.explorerUrl} target="_blank" rel="noreferrer">
                  {t("Ver recibo en Solana Explorer")}{" "}
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </p>
            )}
          {visibleOperations.filter((item) => item.state !== "pending" && item.signature !== receipt?.signature).map((item) => (
            <p className={item.state === "confirmed" ? "solana-success" : "solana-error"} key={item.signature} role="status">
              {item.state === "confirmed" ? t("Transacción confirmada") : t("Transacción fallida")}.{" "}
              <a href={transactionExplorer(item.signature)} target="_blank" rel="noreferrer">{t("Ver firma")} {short(item.signature)}</a>
            </p>
          ))}

          {account && (
            <div className="solana-history">
              <div className="solana-history__heading">
                <h3>{t(testnet ? "Actividad en testnet" : "Actividad en mainnet")}</h3>
                <span className="muted">
                  {t("Últimas 8 firmas que incluyen esta dirección")} </span>
              </div>
              {account.activity.length === 0 ? (
                <p className="muted">
                  {account.historyError || account.error
                    ? t("No se pudo cargar el historial.")
                    : t("No hay movimientos confirmados para esta dirección.")}
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
                            ? t("Transacción fallida")
                            : entry.changeLamports === null
                              ? t("Movimiento en cadena")
                              : entry.changeLamports > 0
                                ? t("Entrada")
                                : entry.changeLamports < 0
                                  ? t("Salida")
                                  : t("Sin cambio de saldo")}
                        </strong>
                        <small>
                          {entry.blockTime
                            ? new Date(entry.blockTime * 1000).toLocaleString(
                                locale,
                              )
                            : t("Hora no disponible")}{" "}
                          ·{" "}
                          {entry.status === "failed"
                            ? t("fallida")
                            : entry.status === "finalized"
                              ? t("finalizada")
                              : t("confirmada")}
                        </small>
                      </span>
                      {entry.changeLamports !== null && (
                        <strong>
                          {entry.changeLamports > 0 ? "+" : ""}
                          {sol(entry.changeLamports)} {solUnit}
                        </strong>
                      )}
                      <a
                        href={transactionExplorer(entry.signature)}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={t("Ver transacción {signature} en Solana Explorer", { signature: entry.signature })}
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
        {t(testnet
          ? "Los perfiles son cuentas de sistema de testnet controladas por la billetera del representante. El SOL de prueba no tiene valor monetario; cada operación necesita su firma y puede pagar una comisión de prueba."
          : "Los perfiles son cuentas de sistema controladas técnicamente por la billetera del representante. Consultar no reserva fondos; cada operación real necesita su firma y puede pagar comisión de red. Las actividades de práctica de Brote son independientes de SOL.")} </p>
    </section>
  );
}
