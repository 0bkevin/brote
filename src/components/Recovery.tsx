import { useEffect, useRef, useState } from "react";
import { LatestRequest } from "../solana-connection";
import { Download, FolderOpen, ShieldCheck } from "lucide-react";
import { MAX_BACKUP_BYTES, mergeBackupOperations, operationsForBackup, parseBackup, serializeBackup, verifyBackupAccountDerivations } from "../persistence";
import { OperationJournal } from "../solana-operations";
import type { AppState } from "../types";
import { useStore } from "../store";
import { useSolana } from "../solana";
import Modal from "./Modal";
import { useI18n } from "../i18n";

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function downloadBackup(state: AppState, _guardianAddress?: string | null) {
  const signedOperations = operationsForBackup(state, new OperationJournal(window.localStorage).read());
  downloadText(
    serializeBackup(state, new Date().toISOString(), signedOperations),
    `brote-copia-${new Date().toISOString().slice(0, 10)}.json`,
  );
}

export function downloadCorruptRaw(raw: string) {
  downloadText(raw, `brote-registro-original-${new Date().toISOString().slice(0, 10)}.json`);
}

export default function Recovery({ state, notify }: {
  state: AppState;
  notify: (s: string) => void;
}) {
  const { t } = useI18n();
  const store = useStore();
  const chain = useSolana();
  const current = useRef({ store, chain });
  current.current = { store, chain };
  const restoreRequest = useRef(new LatestRequest());
  const readRequest = useRef(new LatestRequest());
  useEffect(() => () => { restoreRequest.current.cancel(); readRequest.current.cancel(); }, []);
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ReturnType<typeof parseBackup> | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [downloadedRaw, setDownloadedRaw] = useState<string | null>(null);
  const [error, setError] = useState("");
  async function read(file: File | undefined) {
    if (!file) return;
    const request = readRequest.current.begin();
    try {
      if (file.size > MAX_BACKUP_BYTES) throw Error(t("Esta copia es demasiado grande."));
      const parsed = parseBackup(await file.text());
      await verifyBackupAccountDerivations(parsed);
      if (!readRequest.current.isCurrent(request)) return;
      setPending(parsed);
      setError("");
    } catch (e) {
      if (!readRequest.current.isCurrent(request)) return;
      setError(e instanceof Error ? t(e.message) : t("No pudimos abrir la copia."));
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  const corruptRaw = store.persistence.corruptRaw;
  return (
    <section className="card settings-card recovery-card">
      <ShieldCheck size={26} />
      <h2>{t("Conserva su camino")}</h2>
      <p>
        {t("Guarda perfiles, metas y actividad de práctica. Los IDs de la copia permiten volver a encontrar las mismas cuentas Solana con la misma wallet responsable.")}
      </p>
      <p>
        {t("La copia incluye las direcciones públicas responsables que Brote verificó para cada perfil y el registro de transacciones firmadas, incluso las pendientes. Las claves permanecen en tu wallet.")}
      </p>
      <p>{t("Una copia anterior a una firma no puede registrar esa transacción. Conserva la copia más reciente y verifica cualquier firma pendiente antes de volver a operar.")}</p>
      {corruptRaw !== null && (
        <div className="form-note" role="alert">
          <p>{t("Encontramos un registro que no pudimos leer. Descarga sus datos originales antes de reemplazarlo.")}</p>
          <div className="recovery-actions">
            <button className="button button-secondary" onClick={() => {
              try {
                downloadCorruptRaw(corruptRaw);
                setDownloadedRaw(corruptRaw);
                notify(t("Registro original descargado."));
              } catch (e) {
                setError(e instanceof Error ? t(e.message) : t("No pudimos descargar el registro original."));
              }
            }}>{t("Descargar registro original")}</button>
            <button className="button button-secondary" disabled={downloadedRaw !== corruptRaw}
              onClick={() => setConfirmReplace(true)}>
              {t("Reemplazar con ejemplos")}
            </button>
          </div>
        </div>
      )}
      <div className="recovery-actions">
        <button className="button button-primary" disabled={corruptRaw !== null} onClick={() => {
          try {
            downloadBackup(state);
            notify(t("Copia de perfiles descargada."));
          } catch (e) {
            setError(e instanceof Error ? t(e.message) : t("No pudimos preparar la copia."));
          }
        }}>
          <Download size={16} />{t("Guardar copia")}
        </button>
        <button className="button button-secondary" onClick={() => input.current?.click()}>
          <FolderOpen size={16} />{t("Restaurar copia")}
        </button>
      </div>
      <input ref={input} type="file" accept=".json,application/json" className="sr-only"
        onChange={(e) => void read(e.target.files?.[0])} />
      {error && <p className="form-error" role="alert">{t(error)}</p>}
      {confirmReplace && (
        <Modal title={t("Reemplazar registro dañado")} onClose={() => setConfirmReplace(false)}>
          <p>{t("Se reemplazarán los datos guardados por los perfiles de ejemplo. Descarga el registro original si necesitas recuperar IDs o actividad.")}</p>
          <div className="modal-actions">
            <button className="button button-secondary" onClick={() => setConfirmReplace(false)}>{t("Conservar registro")}</button>
            <button className="button button-primary" onClick={() => {
              try {
                if (chain.operationError || chain.busy || chain.operations.some(operation => operation.state === "pending"))
                  throw Error(t("Resuelve la operación Solana pendiente antes de reemplazar perfiles."));
                chain.invalidateSigningSession();
                store.replaceCorruptWithSeed();
                setConfirmReplace(false);
                notify(t("Datos de ejemplo guardados."));
              } catch (e) {
                setError(e instanceof Error ? t(e.message) : t("No pudimos reemplazar el registro."));
                setConfirmReplace(false);
              }
            }}>{t("Reemplazar con ejemplos")}</button>
          </div>
        </Modal>
      )}
      {pending && (
        <Modal title={t("Recupera su camino")} onClose={() => { restoreRequest.current.cancel(); setPending(null); }}>
          <p className="muted modal-intro">
            {t("Esta copia tiene {wallets} perfiles, {transactions} movimientos de práctica y {signed} transacciones firmadas registradas. Se reemplazarán los perfiles y se conservarán las firmas locales junto con las importadas.", { wallets: pending.state.wallets.length, transactions: pending.state.transactions.length, signed: pending.signedOperations?.length ?? 0 })}
          </p>
          {(pending.state.guardianBases?.length ?? 0) > 0 && (
            <div className="form-note" style={{ display: "block", overflowWrap: "anywhere" }}>
              {t("Direcciones responsables verificadas en esta copia:")}
              <ul>{pending.state.guardianBases?.map((base) => (
                <li key={`${base.walletId}:${base.address}`}>{base.walletId}: {base.address}</li>
              ))}</ul>
            </div>
          )}
          {pending.guardianAddress && (
            <div className="form-note" style={{ display: "block", overflowWrap: "anywhere" }}>
              {t("Dirección de una copia anterior (sin verificación por perfil):")}<br />
              <strong>{pending.guardianAddress}</strong>
            </div>
          )}
          <div className="modal-actions">
            <button className="button button-secondary" onClick={() => { restoreRequest.current.cancel(); setPending(null); }}>{t("Conservar datos actuales")}</button>
            <button className="button button-primary" onClick={async () => {
              const request = restoreRequest.current.begin();
              const originalState = current.current.store.state;
              const assertCurrent = () => {
                if (!restoreRequest.current.isCurrent(request)) throw Error(t("Restauración cancelada."));
                current.current.store.assertWriter();
                if (current.current.chain.busy || current.current.chain.operationError)
                  throw Error(t("Espera a que termine la operación Solana antes de restaurar."));
                if (current.current.store.state !== originalState)
                  throw Error(t("Los perfiles cambiaron mientras se preparaba la copia. Ábrela de nuevo."));
              };
              try {
                if (chain.operationError || chain.busy)
                  throw Error(t("Resuelve la operación Solana pendiente antes de restaurar perfiles."));
                store.assertWriter();
                if (corruptRaw !== null) downloadCorruptRaw(corruptRaw);
                else downloadBackup(state);
                chain.invalidateSigningSession();
                await mergeBackupOperations(window.localStorage, pending, assertCurrent);
                assertCurrent();
                current.current.chain.invalidateSigningSession();
                current.current.store.restoreBackup(pending.state);
                window.location.reload();
              } catch (e) {
                if (!restoreRequest.current.isCurrent(request)) return;
                setError(e instanceof Error ? t(e.message) : t("No pudimos guardar la copia en este navegador."));
                setPending(null);
              }
            }}>{t("Guardar copia actual y restaurar")}</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
