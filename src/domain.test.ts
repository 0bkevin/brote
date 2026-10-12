import test from "node:test";
import assert from "node:assert/strict";
import {
  completeMissionState,
  createGoalState,
  createInitialState,
  createWalletState,
  isAppState,
  purchaseState,
  reviewTransactionState,
  saveToGoalState,
  toCents,
  topUpState,
  updateWalletState,
} from "./domain";

test("seed data has three practice profiles, no crypto funds, and one pending purchase", () => {
  const state = createInitialState();
  assert.equal(state.wallets.length, 3);
  assert.deepEqual(
    state.wallets.map((wallet) => wallet.cryptoBalance),
    [0, 0, 0],
  );
  assert.equal(
    state.transactions.filter((tx) => tx.status === "pending").length,
    1,
  );
  assert.deepEqual(
    state.wallets.map((wallet) => wallet.completedMissions),
    [["smart-shop"], [], ["spot-the-scam"]],
  );
  assert.ok(
    state.transactions.every(
      (tx) => Date.now() - Date.parse(tx.createdAt) < 7 * 24 * 60 * 60 * 1000,
    ),
  );
  assert.ok(isAppState(state));
});

test("new wallets start without real or practice funds", () => {
  const initial = createInitialState();
  const { state, wallet } = createWalletState(initial, {
    name: "  Lucía ",
    relationship: "Hija",
    kind: "child",
    avatar: "rabbit",
    color: "yellow",
  });
  assert.equal(wallet.name, "Lucía");
  assert.equal(wallet.practiceBalance, 0);
  assert.equal(wallet.cryptoBalance, 0);
  assert.equal(
    initial.wallets.length,
    3,
    "creation leaves the previous state untouched",
  );
  assert.equal(state.wallets.length, 4);
});

test("money amounts use safe integer cents and reject invalid precision or signs", () => {
  assert.equal(toCents(12.34), 1234);
  for (const amount of [
    -0.01,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    1.001,
    Number.MAX_SAFE_INTEGER,
  ]) {
    assert.throws(() => toCents(amount));
  }
});

test("practice top-ups and purchases use immutable states and preserve a non-negative balance", () => {
  const initial = createInitialState();
  const topped = topUpState(initial, "sofia", 1.11, "practice");
  assert.equal(initial.wallets[0].practiceBalance, 42.5);
  assert.equal(topped.wallets[0].practiceBalance, 43.61);
  const bought = purchaseState(
    topped,
    "sofia",
    "Lápices",
    "Papelería",
    4.25,
    "practice",
  );
  assert.equal(
    bought.wallets[0].practiceBalance,
    43.61,
    "approval-pending purchases do not deduct funds",
  );
  assert.equal(bought.transactions[0].status, "pending");
  assert.throws(
    () => purchaseState(topped, "sofia", "Too much", "Otros", 50, "practice"),
    /límite/i,
  );
  assert.throws(
    () => purchaseState(topped, "sofia", "Crypto", "Otros", 1, "crypto"),
    /práctica/i,
  );
  const noApproval = updateWalletState(topped, "sofia", {
    spendingLimit: 15,
    approvalRequired: false,
    paused: false,
  });
  const spent = purchaseState(
    noApproval,
    "sofia",
    "Snack",
    "Comida",
    4.25,
    "practice",
  );
  assert.equal(spent.wallets[0].practiceBalance, 39.36);
  assert.throws(
    () =>
      purchaseState(
        updateWalletState(noApproval, "sofia", {
          spendingLimit: 15,
          approvalRequired: false,
          paused: true,
        }),
        "sofia",
        "Snack",
        "Comida",
        1,
        "practice",
      ),
    /pausa/i,
  );
  const highLimit = updateWalletState(noApproval, "sofia", {
    spendingLimit: 200,
    approvalRequired: false,
    paused: false,
  });
  assert.throws(
    () =>
      purchaseState(
        highLimit,
        "sofia",
        "Unaffordable",
        "Otros",
        100,
        "practice",
      ),
    /suficientes/i,
  );
});

test("approving pending purchase deducts once; declined purchases stay rejected", () => {
  let state = createInitialState();
  state = purchaseState(state, "sofia", "Aprobable", "Otros", 7.25, "practice");
  const pending = state.transactions[0];
  const startingBalance = state.wallets[0].practiceBalance;
  const approved = reviewTransactionState(state, pending.id, true);
  assert.equal(approved.wallets[0].practiceBalance, startingBalance - 7.25);
  assert.equal(approved.transactions[0].status, "completed");
  assert.throws(
    () => reviewTransactionState(approved, pending.id, true),
    /ya fue revisado/i,
  );

  state = purchaseState(state, "sofia", "Rechazada", "Otros", 3, "practice");
  const declinedId = state.transactions[0].id;
  const declined = reviewTransactionState(state, declinedId, false);
  assert.equal(
    declined.wallets[0].practiceBalance,
    startingBalance,
    "declining never deducts",
  );
  assert.equal(declined.transactions[0].status, "rejected");
  assert.throws(
    () => reviewTransactionState(declined, declinedId, true),
    /ya fue revisado/i,
  );
});

test("approval rechecks spendable balance and leaves an unaffordable request pending", () => {
  let state = createInitialState();
  state = purchaseState(state, "sofia", "Pending", "Otros", 10, "practice");
  const pendingId = state.transactions[0].id;
  state = topUpState(state, "sofia", 0.5, "practice");
  state = saveToGoalState(state, "sofia", "skateboard", 33.01);
  assert.throws(
    () => reviewTransactionState(state, pendingId, true),
    /suficientes/i,
  );
  assert.equal(
    state.transactions.find((tx) => tx.id === pendingId)?.status,
    "pending",
  );
});

test("goal saving deducts spendable balance, increases savings, and respects target", () => {
  const state = createInitialState();
  const before = state.wallets[0];
  const saved = saveToGoalState(state, "sofia", "skateboard", 2.35);
  assert.equal(saved.wallets[0].practiceBalance, before.practiceBalance - 2.35);
  assert.equal(saved.wallets[0].goals[0].saved, 29.85);
  assert.equal(saved.transactions[0].type, "saving");
  assert.throws(
    () => saveToGoalState(saved, "sofia", "skateboard", 100),
    /suficientes|supera/i,
  );
  assert.throws(
    () => createGoalState(state, "sofia", "Invalid target", 0, "practice"),
    /mayor que cero/i,
  );
  assert.throws(
    () => createGoalState(state, "sofia", "Crypto goal", 10, "crypto"),
    /práctica/i,
  );
});

test("a mission reward and XP can only be claimed once", () => {
  const state = createInitialState();
  const completed = completeMissionState(
    state,
    "mateo",
    "first-budget",
    25,
    2.5,
  );
  assert.equal(completed.wallets[1].practiceBalance, 28.5);
  assert.equal(completed.wallets[1].xp, 120);
  assert.equal(completed.transactions[0].type, "reward");
  assert.throws(
    () => completeMissionState(completed, "mateo", "first-budget", 25, 2.5),
    /ya se completó/i,
  );
  assert.throws(
    () => completeMissionState(state, "mateo", "bad-xp", -1, 0),
    /experiencia/i,
  );
});

test("a paused profile blocks every practice mutation", () => {
  const initial = createInitialState();
  const paused = updateWalletState(initial, "sofia", {
    spendingLimit: 15,
    approvalRequired: true,
    paused: true,
  });
  const actions = [
    () => topUpState(paused, "sofia", 1, "practice"),
    () => purchaseState(paused, "sofia", "Snack", "Comida", 1, "practice"),
    () => saveToGoalState(paused, "sofia", "skateboard", 1),
    () => createGoalState(paused, "sofia", "Nueva meta", 10, "practice"),
    () => completeMissionState(paused, "sofia", "rainy-day", 40, 14),
  ];
  for (const action of actions) assert.throws(action, /pausa/i);
  assert.equal(
    paused.wallets[0].practiceBalance,
    initial.wallets[0].practiceBalance,
  );
  assert.equal(paused.transactions.length, initial.transactions.length);
  assert.equal(paused.wallets[0].goals.length, initial.wallets[0].goals.length);
  assert.equal(paused.wallets[0].completedMissions.length, 1);
});

test("persisted state validation rejects unsafe or structurally invalid values", () => {
  const state = createInitialState();
  assert.ok(isAppState(state));
  const invalid = structuredClone(state);
  invalid.wallets[0].practiceBalance = -1;
  assert.equal(isAppState(invalid), false);
  const badReference = structuredClone(state);
  badReference.transactions[0].walletId = "missing";
  assert.equal(isAppState(badReference), false);
  const empty = structuredClone(state);
  empty.wallets = [];
  assert.equal(isAppState(empty), false);
  const missingRelationship = structuredClone(state);
  missingRelationship.wallets[0].relationship = "  ";
  assert.equal(isAppState(missingRelationship), false);
  const invalidMissions = structuredClone(state);
  invalidMissions.wallets[0].completedMissions = ["smart-shop", ""];
  assert.equal(isAppState(invalidMissions), false);
  const duplicateMissions = structuredClone(state);
  duplicateMissions.wallets[0].completedMissions = ["smart-shop", "smart-shop"];
  assert.equal(isAppState(duplicateMissions), false);
  const duplicateGoals = structuredClone(state);
  duplicateGoals.wallets[1].goals[0].id = duplicateGoals.wallets[0].goals[0].id;
  assert.equal(isAppState(duplicateGoals), false);
  const duplicateTransactions = structuredClone(state);
  duplicateTransactions.transactions[1].id =
    duplicateTransactions.transactions[0].id;
  assert.equal(isAppState(duplicateTransactions), false);
});
