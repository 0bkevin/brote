const LAMPORTS_PER_SOL = 1_000_000_000n;
const BASE58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function parseSolLamports(amountSol: string): number {
  const value = amountSol.trim().replace(",", ".");
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,9})?$/.test(value))
    throw new Error("Introduce un monto de SOL válido, con hasta 9 decimales.");
  const [whole, fraction = ""] = value.split(".");
  const lamports =
    BigInt(whole) * LAMPORTS_PER_SOL + BigInt(fraction.padEnd(9, "0"));
  if (lamports <= 0n || lamports > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error(
      "El monto debe ser mayor que cero y estar dentro del límite permitido.",
    );
  return Number(lamports);
}

/** A System Program transfer may leave a zero-byte account empty or rent-exempt. */
export function hasValidSystemAccountRemainder(
  balanceLamports: number,
  transferLamports: number,
  minimumBalanceLamports: number,
): boolean {
  if (![balanceLamports, transferLamports, minimumBalanceLamports].every(Number.isSafeInteger) ||
      balanceLamports < 0 || transferLamports < 0 || minimumBalanceLamports < 0 ||
      transferLamports > balanceLamports) return false;
  const remaining = balanceLamports - transferLamports;
  return remaining === 0 || remaining >= minimumBalanceLamports;
}

/** A transfer must fund its destination to the rent-exempt minimum for its data size. */
export function hasRentExemptDestinationBalance(
  balanceLamports: number,
  transferLamports: number,
  minimumBalanceLamports: number,
): boolean {
  if (![balanceLamports, transferLamports, minimumBalanceLamports].every(Number.isSafeInteger) ||
      balanceLamports < 0 || transferLamports <= 0 || minimumBalanceLamports <= 0) return false;
  return BigInt(balanceLamports) + BigInt(transferLamports) >= BigInt(minimumBalanceLamports);
}

export async function seedFor(walletId: string): Promise<string> {
  if (!globalThis.crypto?.subtle)
    throw new Error("La derivación de direcciones requiere HTTPS o localhost.");
  const bytes = new TextEncoder().encode(`brote:profile:v1:${walletId}`);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const seed = `brote1-${Array.from(digest.slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  if (new TextEncoder().encode(seed).length > 32)
    throw new Error("La semilla excede 32 bytes.");
  return seed;
}

export function encodeBase58(bytes: Uint8Array): string {
  let value = 0n;
  for (const byte of bytes) value = (value << 8n) + BigInt(byte);
  let result = "";
  while (value > 0n) {
    result = BASE58[Number(value % 58n)] + result;
    value /= 58n;
  }
  for (const byte of bytes) {
    if (byte !== 0) break;
    result = `1${result}`;
  }
  return result;
}
