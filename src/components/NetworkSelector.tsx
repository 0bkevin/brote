import { SOLANA_NETWORK, networkHref, type SolanaCluster } from "../solana-network";
import { useI18n } from "../i18n";

export default function NetworkSelector({ compact = false, busy = false }: { compact?: boolean; busy?: boolean }) {
  const { t } = useI18n();
  return (
    <label className={`network-selector${compact ? " network-selector--compact" : ""}`}>
      <span className={compact ? "sr-only" : undefined}>{t("Red Solana")}</span>
      <select
        aria-label={t("Red Solana")}
        value={SOLANA_NETWORK.cluster}
        disabled={busy}
        onChange={(event) => {
          const next = event.target.value as SolanaCluster;
          if (next !== SOLANA_NETWORK.cluster)
            window.location.assign(networkHref(window.location.href, next));
        }}
      >
        <option value="mainnet">{t("Mainnet")}</option>
        <option value="testnet">{t("Testnet")}</option>
      </select>
    </label>
  );
}
