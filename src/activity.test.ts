import test from "node:test";
import assert from "node:assert/strict";
import { activityDate } from "./activity";
import { createInitialState, reviewTransactionState } from "./domain";

test("an old request approved today appears in today's expense summary", () => {
  const state = createInitialState();
  const pending = state.transactions.find(tx => tx.status === "pending")!;
  pending.createdAt = "2020-01-01T00:00:00.000Z";
  const approved = reviewTransactionState(state, pending.id, true);
  const tx = approved.transactions.find(tx => tx.id === pending.id)!;
  assert.equal(new Date(activityDate(tx)).toDateString(), new Date().toDateString());
  assert.equal(activityDate({ ...tx, resolvedAt: undefined }), pending.createdAt);
});
