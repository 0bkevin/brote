export type Mode = "practice" | "crypto";
export type PersonKind = "child" | "adult" | "senior";
export type AvatarKind = "fox" | "bear" | "rabbit" | "owl";
export type ColorKind = "mint" | "peach" | "lavender" | "yellow";
export interface Goal {
  id: string;
  title: string;
  target: number;
  saved: number;
  mode: Mode;
  icon: string;
}
export interface Wallet {
  id: string;
  name: string;
  relationship: string;
  kind: PersonKind;
  avatar: AvatarKind;
  color: ColorKind;
  practiceBalance: number;
  cryptoBalance: number;
  xp: number;
  completedMissions: string[];
  goals: Goal[];
  spendingLimit: number;
  approvalRequired: boolean;
  paused: boolean;
}
export interface Transaction {
  id: string;
  walletId: string;
  title: string;
  category: string;
  amount: number;
  mode: Mode;
  type: "topup" | "purchase" | "saving" | "reward";
  status: "completed" | "pending" | "rejected";
  createdAt: string;
  resolvedAt?: string;
}
export interface AppState {
  version: 1;
  wallets: Wallet[];
  transactions: Transaction[];
  guardianBases?: { walletId: string; address: string }[];
  /** An unverified address from an older backup, retained only as a recovery hint. */
  legacyGuardianAddress?: string | null;
}
export interface PersistenceStatus {
  loading: boolean;
  writable: boolean;
  error: string | null;
  corruptRaw: string | null;
}
export interface NewWallet {
  name: string;
  relationship: string;
  kind: PersonKind;
  avatar: AvatarKind;
  color: ColorKind;
}
export interface StoreAPI {
  state: AppState;
  persistence: PersistenceStatus;
  assertWriter: () => void;
  assertDurableWallet: (walletId: string) => void;
  recordGuardianBase: (walletId: string, address: string) => void;
  restoreBackup: (state: AppState) => void;
  replaceCorruptWithSeed: () => void;
  createWallet: (input: NewWallet) => Wallet;
  topUp: (walletId: string, amount: number, mode: Mode) => void;
  purchase: (
    walletId: string,
    title: string,
    category: string,
    amount: number,
    mode: Mode,
  ) => void;
  saveToGoal: (walletId: string, goalId: string, amount: number) => void;
  createGoal: (
    walletId: string,
    title: string,
    target: number,
    mode: Mode,
  ) => void;
  completeMission: (
    walletId: string,
    missionId: string,
    xp: number,
    reward: number,
  ) => void;
  reviewTransaction: (transactionId: string, approve: boolean) => void;
  updateWallet: (
    walletId: string,
    changes: Pick<Wallet, "spendingLimit" | "approvalRequired" | "paused">,
  ) => void;
  resetDemo: () => void;
}
