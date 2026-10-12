import type { Transaction } from "./types";

/** Old backups retain their creation date when no review date was recorded. */
export function activityDate(transaction: Transaction): string {
  return transaction.resolvedAt ?? transaction.createdAt;
}
