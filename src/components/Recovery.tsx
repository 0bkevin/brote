import { useRef, useState } from "react";
import { Download, FolderOpen, ShieldCheck } from "lucide-react";
import { isAppState } from "../domain";
import type { AppState } from "../types";
import { STORAGE_KEY } from "../store";
import { useSolana } from "../solana";
import Modal from "./Modal";

export function downloadBackup(
  state: AppState,
  guardianAddress: string | null,
) {
  const backup = {
    format: "brote-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    guardianAddress,
    state,
  };
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `brote-copia-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Recovery({
  state,
  notify,
}: {
  state: AppState;
  notify: (s: string) => void;
}) {
  const chain = useSolana();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{
    state: AppState;
    guardianAddress: string | null;
  } | null>(null);
  const [error, setError] = useState("");
  async function read(file: File | undefined) {
    if (!file) return;
    try {
      if (file.size > 5_000_000) throw Error("Esta copia es demasiado grande.");
      const data: unknown = JSON.parse(await file.text());
      if (!data || typeof data !== "object")
        throw Error("La copia no tiene un formato válido.");
      const b = data as Record<string, unknown>;
      if (
        b.format !== "brote-backup" ||
        b.version !== 1 ||
        !isAppState(b.state) ||
        (b.guardianAddress !== null && typeof b.guardianAddress !== "string")
      )
        throw Error("Esta copia no es compatible con Brote.");
      setPending({
        state: b.state,
        guardianAddress: b.guardianAddress as string | null,
      });
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No pudimos abrir la copia.");
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section className="card settings-card recovery-card">
      <ShieldCheck size={26} />
      <h2>Conserva su camino</h2>
      <p>
        Guarda perfiles, metas y actividad de práctica. Los IDs de la copia
        permiten volver a encontrar las mismas cuentas Solana con la misma
        wallet responsable.
      </p>
      <p>
        La copia contiene datos de tus perfiles y la dirección pública del
        responsable. Las claves permanecen en tu wallet.
      </p>
      <div className="recovery-actions">
        <button
          className="button button-primary"
          onClick={() => {
            downloadBackup(state, chain.observedAddress);
            notify("Copia de perfiles descargada.");
          }}
        >
          <Download size={16} />
          Guardar copia
        </button>
        <button
          className="button button-secondary"
          onClick={() => input.current?.click()}
        >
          <FolderOpen size={16} />
          Restaurar copia
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        onChange={(e) => void read(e.target.files?.[0])}
      />
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {pending && (
        <Modal title="Recupera su camino" onClose={() => setPending(null)}>
          <p className="muted modal-intro">
            Esta copia tiene {pending.state.wallets.length} perfiles y{" "}
            {pending.state.transactions.length} movimientos de práctica. Se
            reemplazarán los datos de este navegador.
          </p>
          {pending.guardianAddress && (
            <div
              className="form-note"
              style={{ display: "block", overflowWrap: "anywhere" }}
            >
              Responsable de esta copia:
              <br />
              <strong>{pending.guardianAddress}</strong>
              <br />
              Conecta esa misma wallet para consultar sus cuentas Solana.
            </div>
          )}
          <div className="modal-actions">
            <button
              className="button button-secondary"
              onClick={() => setPending(null)}
            >
              Conservar datos actuales
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                try {
                  downloadBackup(state, chain.observedAddress);
                  localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(pending.state),
                  );
                  window.location.reload();
                } catch {
                  setError("No pudimos guardar la copia en este navegador.");
                  setPending(null);
                }
              }}
            >
              Guardar copia actual y restaurar
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
