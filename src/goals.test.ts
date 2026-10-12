import test from "node:test";
import assert from "node:assert/strict";
import { goalProgress } from "./goals";
import { createGoalState, createInitialState, saveToGoalState } from "./domain";

test("a nearly complete goal accepts its final cent before celebrating completion", () => {
  const created = createGoalState(createInitialState(), "sofia", "Mi meta", 2, "practice");
  const goal = created.wallets[0].goals.at(-1)!;
  const almost = saveToGoalState(created, "sofia", goal.id, 1.99);
  assert.deepEqual(goalProgress(almost.wallets[0].goals.at(-1)!), { complete: false, percent: 99 });
  const complete = saveToGoalState(almost, "sofia", goal.id, 0.01);
  assert.deepEqual(goalProgress(complete.wallets[0].goals.at(-1)!), { complete: true, percent: 100 });
});
