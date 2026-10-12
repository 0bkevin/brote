import type {
  AppState,
  Goal,
  Mode,
  NewWallet,
  Transaction,
  Wallet,
} from "./types";

/** Convert display currency units to exact cents, rejecting fractions of a cent. */
export function toCents(amount: number, label = "El monto"): number {
  if (!Number.isFinite(amount) || amount < 0)
    throw new Error(`${label} debe ser una cantidad válida y no negativa.`);
  const scaled = amount * 100;
  const cents = Math.round(scaled);
  if (!Number.isSafeInteger(cents) || Math.abs(scaled - cents) > 1e-7) {
    throw new Error(
      `${label} debe tener como máximo dos decimales y estar dentro del límite permitido.`,
    );
  }
  return cents;
}

const fromCents = (cents: number) => cents / 100;
function positiveCents(amount: number, label: string): number {
  const cents = toCents(amount, label);
  if (cents <= 0) throw new Error(`${label} debe ser mayor que cero.`);
  return cents;
}
function requirePractice(mode: Mode): void {
  if (mode === "crypto")
    throw new Error("Esta acción solo está disponible con dinero de práctica.");
  if (mode !== "practice") throw new Error("El tipo de dinero no es válido.");
}
function walletOrThrow(state: AppState, walletId: string): Wallet {
  const wallet = state.wallets.find((item) => item.id === walletId);
  if (!wallet)
    throw new Error(
      "No encontramos este perfil. Actualiza la página e inténtalo de nuevo.",
    );
  return wallet;
}
function transactionOrThrow(
  state: AppState,
  transactionId: string,
): Transaction {
  const transaction = state.transactions.find(
    (item) => item.id === transactionId,
  );
  if (!transaction)
    throw new Error(
      "No encontramos este movimiento. Actualiza la página e inténtalo de nuevo.",
    );
  return transaction;
}
const now = () => new Date().toISOString();
const seedDate = (daysAgo: number, hour: number, minute: number) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
};
const id = (prefix: string) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;

export function createInitialState(): AppState {
  const wallets: Wallet[] = [
    {
      id: "sofia",
      name: "Sofía",
      relationship: "Hija · 12 años",
      kind: "child",
      avatar: "fox",
      color: "mint",
      practiceBalance: 42.5,
      cryptoBalance: 0,
      xp: 180,
      completedMissions: ["smart-shop"],
      spendingLimit: 15,
      approvalRequired: true,
      paused: false,
      goals: [
        {
          id: "skateboard",
          title: "Patineta nueva",
          target: 90,
          saved: 27.5,
          mode: "practice",
          icon: "🛹",
        },
        {
          id: "books",
          title: "Libros de aventura",
          target: 35,
          saved: 12,
          mode: "practice",
          icon: "📚",
        },
      ],
    },
    {
      id: "mateo",
      name: "Mateo",
      relationship: "Hijo · 9 años",
      kind: "child",
      avatar: "bear",
      color: "peach",
      practiceBalance: 26,
      cryptoBalance: 0,
      xp: 95,
      completedMissions: [],
      spendingLimit: 10,
      approvalRequired: true,
      paused: false,
      goals: [
        {
          id: "lego",
          title: "Set de construcción",
          target: 60,
          saved: 18,
          mode: "practice",
          icon: "🧱",
        },
      ],
    },
    {
      id: "elena",
      name: "Elena",
      relationship: "Mamá",
      kind: "senior",
      avatar: "owl",
      color: "lavender",
      practiceBalance: 135,
      cryptoBalance: 0,
      xp: 320,
      completedMissions: ["spot-the-scam"],
      spendingLimit: 50,
      approvalRequired: false,
      paused: false,
      goals: [
        {
          id: "garden",
          title: "Jardín en el balcón",
          target: 180,
          saved: 65,
          mode: "practice",
          icon: "🪴",
        },
      ],
    },
  ];
  const transactions: Transaction[] = [
    {
      id: "seed-topup-sofia",
      walletId: "sofia",
      title: "Mesada semanal",
      category: "Mesada",
      amount: 20,
      mode: "practice",
      type: "topup",
      status: "completed",
      createdAt: seedDate(0, 13, 0),
    },
    {
      id: "seed-save-sofia",
      walletId: "sofia",
      title: "Ahorro para Patineta nueva",
      category: "Ahorro",
      amount: 5,
      mode: "practice",
      type: "saving",
      status: "completed",
      createdAt: seedDate(1, 16, 30),
    },
    {
      id: "seed-purchase-sofia",
      walletId: "sofia",
      title: "Merienda después de clases",
      category: "Comida",
      amount: 4.5,
      mode: "practice",
      type: "purchase",
      status: "completed",
      createdAt: seedDate(2, 19, 10),
    },
    {
      id: "seed-pending-sofia",
      walletId: "sofia",
      title: "Cuaderno de dibujo",
      category: "Papelería",
      amount: 8.5,
      mode: "practice",
      type: "purchase",
      status: "pending",
      createdAt: seedDate(0, 14, 15),
    },
    {
      id: "seed-topup-mateo",
      walletId: "mateo",
      title: "Mesada semanal",
      category: "Mesada",
      amount: 15,
      mode: "practice",
      type: "topup",
      status: "completed",
      createdAt: seedDate(0, 12, 0),
    },
    {
      id: "seed-reward-mateo",
      walletId: "mateo",
      title: "Misión: buen hábito de ahorro",
      category: "Recompensa",
      amount: 3,
      mode: "practice",
      type: "reward",
      status: "completed",
      createdAt: seedDate(3, 17, 0),
    },
    {
      id: "seed-topup-elena",
      walletId: "elena",
      title: "Fondo de práctica inicial",
      category: "Recarga",
      amount: 100,
      mode: "practice",
      type: "topup",
      status: "completed",
      createdAt: seedDate(4, 13, 0),
    },
    {
      id: "seed-purchase-elena",
      walletId: "elena",
      title: "Plantas para el balcón",
      category: "Hogar",
      amount: 18,
      mode: "practice",
      type: "purchase",
      status: "completed",
      createdAt: seedDate(5, 18, 45),
    },
  ];
  return { version: 1, wallets, transactions };
}

function transaction(
  walletId: string,
  title: string,
  category: string,
  amount: number,
  type: Transaction["type"],
  status: Transaction["status"],
): Transaction {
  return {
    id: id("tx"),
    walletId,
    title,
    category,
    amount,
    mode: "practice",
    type,
    status,
    createdAt: now(),
  };
}

export function createWalletState(
  state: AppState,
  input: NewWallet,
): { state: AppState; wallet: Wallet } {
  if (
    !["child", "adult", "senior"].includes(input.kind) ||
    !["fox", "bear", "rabbit", "owl"].includes(input.avatar) ||
    !["mint", "peach", "lavender", "yellow"].includes(input.color)
  )
    throw new Error("Revisa los datos del perfil e inténtalo de nuevo.");
  if (typeof input.name !== "string" || typeof input.relationship !== "string")
    throw new Error("El nombre y el vínculo deben ser texto.");
  const name = input.name.trim();
  if (!name) throw new Error("Escribe el nombre de la persona.");
  const relationship = input.relationship.trim();
  if (!relationship)
    throw new Error("Cuéntanos qué vínculo tienes con esta persona.");
  const wallet: Wallet = {
    ...input,
    name,
    relationship,
    id: id("wallet"),
    practiceBalance: 0,
    cryptoBalance: 0,
    xp: 0,
    completedMissions: [],
    goals: [],
    spendingLimit: 25,
    approvalRequired: true,
    paused: false,
  };
  return { state: { ...state, wallets: [...state.wallets, wallet] }, wallet };
}

export function topUpState(
  state: AppState,
  walletId: string,
  amount: number,
  mode: Mode,
): AppState {
  requirePractice(mode);
  const cents = positiveCents(amount, "La recarga");
  const wallet = walletOrThrow(state, walletId);
  if (wallet.paused)
    throw new Error("Este perfil está en pausa. Reanúdalo para hacer cambios.");
  const nextBalance = toCents(wallet.practiceBalance, "El saldo") + cents;
  if (!Number.isSafeInteger(nextBalance))
    throw new Error("El saldo supera el límite permitido.");
  return {
    ...state,
    wallets: state.wallets.map((item) =>
      item.id === walletId
        ? { ...item, practiceBalance: fromCents(nextBalance) }
        : item,
    ),
    transactions: [
      transaction(
        walletId,
        "Recarga de práctica",
        "Recarga",
        fromCents(cents),
        "topup",
        "completed",
      ),
      ...state.transactions,
    ],
  };
}

export function purchaseState(
  state: AppState,
  walletId: string,
  title: string,
  category: string,
  amount: number,
  mode: Mode,
): AppState {
  requirePractice(mode);
  const cents = positiveCents(amount, "El gasto");
  const wallet = walletOrThrow(state, walletId);
  if (wallet.paused)
    throw new Error("Este perfil está en pausa. Reanúdalo para hacer cambios.");
  if (cents > toCents(wallet.spendingLimit, "El límite por gasto"))
    throw new Error("El gasto supera el límite establecido para este perfil.");
  const status = wallet.approvalRequired ? "pending" : "completed";
  if (
    status === "completed" &&
    cents > toCents(wallet.practiceBalance, "El saldo")
  )
    throw new Error("No hay suficientes Brotes disponibles para este gasto.");
  const newTransaction = transaction(
    walletId,
    title.trim() || "Compra",
    category.trim() || "Otros",
    fromCents(cents),
    "purchase",
    status,
  );
  return {
    ...state,
    wallets:
      status === "completed"
        ? state.wallets.map((item) =>
            item.id === walletId
              ? {
                  ...item,
                  practiceBalance: fromCents(
                    toCents(item.practiceBalance) - cents,
                  ),
                }
              : item,
          )
        : state.wallets,
    transactions: [newTransaction, ...state.transactions],
  };
}

export function saveToGoalState(
  state: AppState,
  walletId: string,
  goalId: string,
  amount: number,
): AppState {
  const cents = positiveCents(amount, "El ahorro");
  const wallet = walletOrThrow(state, walletId);
  if (wallet.paused)
    throw new Error("Este perfil está en pausa. Reanúdalo para hacer cambios.");
  const goal = wallet.goals.find((item) => item.id === goalId);
  if (!goal)
    throw new Error(
      "No encontramos esta meta. Actualiza la página e inténtalo de nuevo.",
    );
  requirePractice(goal.mode);
  if (cents > toCents(wallet.practiceBalance, "El saldo"))
    throw new Error(
      "No hay suficientes Brotes disponibles para ahorrar esa cantidad.",
    );
  const target = toCents(goal.target, "La meta");
  const saved = toCents(goal.saved, "El ahorro acumulado");
  if (saved + cents > target)
    throw new Error("Esa cantidad supera lo que falta para completar la meta.");
  return {
    ...state,
    wallets: state.wallets.map((item) =>
      item.id === walletId
        ? {
            ...item,
            practiceBalance: fromCents(toCents(item.practiceBalance) - cents),
            goals: item.goals.map((candidate) =>
              candidate.id === goalId
                ? { ...candidate, saved: fromCents(saved + cents) }
                : candidate,
            ),
          }
        : item,
    ),
    transactions: [
      transaction(
        walletId,
        `Ahorro para ${goal.title}`,
        "Ahorro",
        fromCents(cents),
        "saving",
        "completed",
      ),
      ...state.transactions,
    ],
  };
}

export function createGoalState(
  state: AppState,
  walletId: string,
  title: string,
  target: number,
  mode: Mode,
): AppState {
  requirePractice(mode);
  const cents = positiveCents(target, "La meta");
  const wallet = walletOrThrow(state, walletId);
  if (wallet.paused)
    throw new Error("Este perfil está en pausa. Reanúdalo para hacer cambios.");
  if (typeof title !== "string" || !title.trim())
    throw new Error("Escribe un nombre para la meta.");
  const goal: Goal = {
    id: id("goal"),
    title: title.trim(),
    target: fromCents(cents),
    saved: 0,
    mode: "practice",
    icon: "🎯",
  };
  return {
    ...state,
    wallets: state.wallets.map((item) =>
      item.id === walletId ? { ...item, goals: [...item.goals, goal] } : item,
    ),
  };
}

export function completeMissionState(
  state: AppState,
  walletId: string,
  missionId: string,
  xp: number,
  reward: number,
): AppState {
  const wallet = walletOrThrow(state, walletId);
  if (wallet.paused)
    throw new Error("Este perfil está en pausa. Reanúdalo para hacer cambios.");
  const mission = missionId.trim();
  if (!mission) throw new Error("No se encontró la misión.");
  if (!Number.isSafeInteger(xp) || xp < 0)
    throw new Error(
      "La experiencia debe ser un número entero igual o mayor que cero.",
    );
  if (!Number.isSafeInteger(wallet.xp + xp))
    throw new Error("La experiencia acumulada supera el límite permitido.");
  const rewardCents = toCents(reward, "La recompensa");
  if (wallet.completedMissions.includes(mission))
    throw new Error(
      "Esta misión ya se completó y su recompensa fue entregada.",
    );
  const balance = toCents(wallet.practiceBalance, "El saldo") + rewardCents;
  if (!Number.isSafeInteger(balance))
    throw new Error("El saldo supera el límite permitido.");
  const next: AppState = {
    ...state,
    wallets: state.wallets.map((item) =>
      item.id === walletId
        ? {
            ...item,
            practiceBalance: fromCents(balance),
            xp: item.xp + xp,
            completedMissions: [...item.completedMissions, mission],
          }
        : item,
    ),
  };
  if (rewardCents > 0)
    next.transactions = [
      transaction(
        walletId,
        "Recompensa de misión",
        "Recompensa",
        fromCents(rewardCents),
        "reward",
        "completed",
      ),
      ...state.transactions,
    ];
  return next;
}

export function reviewTransactionState(
  state: AppState,
  transactionId: string,
  approve: boolean,
): AppState {
  const tx = transactionOrThrow(state, transactionId);
  if (tx.type !== "purchase" || tx.mode !== "practice")
    throw new Error("Solo se pueden revisar gastos de práctica.");
  if (tx.status !== "pending") throw new Error("Este gasto ya fue revisado.");
  if (!approve)
    return {
      ...state,
      transactions: state.transactions.map((item) =>
        item.id === tx.id ? { ...item, status: "rejected" } : item,
      ),
    };
  const wallet = walletOrThrow(state, tx.walletId);
  if (wallet.paused)
    throw new Error(
      "Este perfil está en pausa. Reanúdalo para aprobar gastos.",
    );
  const cents = positiveCents(tx.amount, "El gasto");
  if (cents > toCents(wallet.spendingLimit, "El límite por gasto"))
    throw new Error("El gasto supera el límite actual de este perfil.");
  const balance = toCents(wallet.practiceBalance, "El saldo");
  if (cents > balance)
    throw new Error("No hay suficientes Brotes para aprobar este gasto.");
  return {
    ...state,
    wallets: state.wallets.map((item) =>
      item.id === wallet.id
        ? { ...item, practiceBalance: fromCents(balance - cents) }
        : item,
    ),
    transactions: state.transactions.map((item) =>
      item.id === tx.id ? { ...item, status: "completed" } : item,
    ),
  };
}

export function updateWalletState(
  state: AppState,
  walletId: string,
  changes: Pick<Wallet, "spendingLimit" | "approvalRequired" | "paused">,
): AppState {
  const limit = positiveCents(changes.spendingLimit, "El límite por gasto");
  if (
    typeof changes.approvalRequired !== "boolean" ||
    typeof changes.paused !== "boolean"
  )
    throw new Error("Revisa las reglas del perfil e inténtalo de nuevo.");
  walletOrThrow(state, walletId);
  return {
    ...state,
    wallets: state.wallets.map((wallet) =>
      wallet.id === walletId
        ? { ...wallet, ...changes, spendingLimit: fromCents(limit) }
        : wallet,
    ),
  };
}

// Strictly validate persisted data before it can enter the live store.
export function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppState>;
  if (
    candidate.version !== 1 ||
    !Array.isArray(candidate.wallets) ||
    candidate.wallets.length === 0 ||
    !Array.isArray(candidate.transactions)
  )
    return false;
  const walletIds = new Set<string>();
  const goalIds = new Set<string>();
  for (const wallet of candidate.wallets) {
    if (
      !wallet ||
      typeof wallet !== "object" ||
      typeof wallet.id !== "string" ||
      !wallet.id ||
      walletIds.has(wallet.id)
    )
      return false;
    walletIds.add(wallet.id);
    try {
      if (
        typeof wallet.name !== "string" ||
        !wallet.name.trim() ||
        typeof wallet.relationship !== "string" ||
        !wallet.relationship.trim() ||
        !["child", "adult", "senior"].includes(wallet.kind) ||
        !["fox", "bear", "rabbit", "owl"].includes(wallet.avatar) ||
        !["mint", "peach", "lavender", "yellow"].includes(wallet.color)
      )
        return false;
      toCents(wallet.practiceBalance);
      toCents(wallet.cryptoBalance);
      toCents(wallet.spendingLimit);
      if (wallet.cryptoBalance !== 0) return false;
    } catch {
      return false;
    }
    if (
      !Number.isSafeInteger(wallet.xp) ||
      wallet.xp < 0 ||
      typeof wallet.approvalRequired !== "boolean" ||
      typeof wallet.paused !== "boolean" ||
      !Array.isArray(wallet.completedMissions) ||
      wallet.completedMissions.some(
        (mission) => typeof mission !== "string" || !mission.trim(),
      ) ||
      new Set(wallet.completedMissions).size !==
        wallet.completedMissions.length ||
      !Array.isArray(wallet.goals)
    )
      return false;
    for (const goal of wallet.goals) {
      try {
        if (
          !goal ||
          typeof goal.id !== "string" ||
          !goal.id.trim() ||
          goalIds.has(goal.id) ||
          typeof goal.title !== "string" ||
          !goal.title.trim() ||
          typeof goal.icon !== "string" ||
          goal.mode !== "practice"
        )
          return false;
        goalIds.add(goal.id);
        positiveCents(goal.target, "La meta");
        toCents(goal.saved, "El ahorro acumulado");
      } catch {
        return false;
      }
      if (goal.saved > goal.target) return false;
    }
  }
  const transactionIds = new Set<string>();
  for (const tx of candidate.transactions) {
    try {
      if (
        !tx ||
        typeof tx.id !== "string" ||
        !tx.id.trim() ||
        transactionIds.has(tx.id) ||
        !walletIds.has(tx.walletId) ||
        typeof tx.title !== "string" ||
        typeof tx.category !== "string" ||
        tx.mode !== "practice" ||
        !["topup", "purchase", "saving", "reward"].includes(tx.type) ||
        !["completed", "pending", "rejected"].includes(tx.status) ||
        typeof tx.createdAt !== "string" ||
        Number.isNaN(Date.parse(tx.createdAt))
      )
        return false;
      transactionIds.add(tx.id);
      toCents(tx.amount);
    } catch {
      return false;
    }
  }
  return true;
}
