import type { Mode } from "./types";
import { getIntlLocale } from "./i18n-core";
export const formatMoney = (amount: number, mode: Mode = "practice") =>
  `${new Intl.NumberFormat(getIntlLocale(), { maximumFractionDigits: mode === "practice" ? 2 : 6, minimumFractionDigits: mode === "practice" ? 2 : 3 }).format(amount)} ${mode === "practice" ? "B" : "SOL"}`;
export const moneyNumber = (amount: number) =>
  new Intl.NumberFormat(getIntlLocale(), {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
export const levelFor = (xp: number) => Math.floor(xp / 100) + 1;
