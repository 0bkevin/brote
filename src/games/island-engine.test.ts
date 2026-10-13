import assert from "node:assert/strict";
import test from "node:test";
import { createIslandGame, ISLAND, playIsland, scheduleIslandPulse, type IslandAction, type IslandState } from "./island-engine";

function run(state: IslandState, ...actions: IslandAction[]): IslandState {
  return actions.reduce(playIsland, state);
}

test("four-day route covers needs, funds storm from reserve, builds bridge, and wins only at the gate", () => {
  let state = createIslandGame();
  state = run(state, "work", "needs", "bridge", "next");
  assert.equal(state.day, 2);
  state = run(state, "work", "needs", "reserve", "bridge", "next");
  assert.equal(state.day, 3);
  assert.equal(state.reserve, ISLAND.stormCost);
  state = run(state, "work", "needs", "repair", "bridge", "next");
  assert.equal(state.day, 4);
  assert.equal(state.reserve, 0);
  assert.equal(state.stormRepaired, true);
  assert.equal(state.won, false);
  state = run(state, "work", "needs", "bridge", "next");
  assert.equal(state.bridge, ISLAND.bridgeGoal);
  assert.equal(state.won, true);
  assert.equal(state.coins, 5);
  assert.equal(playIsland(state, "work").coins, state.coins);
});

test("repeated work and rapid day presses cannot mint coins or skip essentials", () => {
  let state = createIslandGame();
  assert.equal(playIsland(state, "next").day, 1);
  state = run(state, "work", "work", "work");
  assert.equal(state.coins, ISLAND.wage);
  assert.equal(playIsland(state, "next").day, 1);
  state = run(state, "needs", "needs", "next", "next");
  assert.equal(state.day, 2);
  assert.equal(state.coins, ISLAND.wage - ISLAND.needs);
  assert.equal(state.worked, false);
});

test("insufficient purchases, capped reserve and bridge, and invalid actions never change money", () => {
  const start = createIslandGame();
  for (const action of ["needs", "reserve", "bridge", "decorate"] as const) {
    assert.equal(playIsland(start, action).coins, 0);
  }
  let state = run(start, "work", "reserve", "reserve");
  assert.equal(state.reserve, 3);
  assert.equal(state.coins, 6);
  state = playIsland(state, "bad" as IslandAction);
  assert.equal(state.coins, 6);
  assert.equal(state.reserve, 3);

  let bridge = run(createIslandGame(), "work", "needs", "bridge", "next", "work", "needs", "reserve", "bridge", "next", "work", "needs", "repair", "bridge", "bridge");
  assert.equal(bridge.bridge, ISLAND.bridgeGoal);
  bridge = playIsland(bridge, "bridge");
  assert.equal(bridge.bridge, ISLAND.bridgeGoal);
  assert.equal(bridge.coins, 0);
});

test("storm repair uses only the separate reserve and cannot be charged twice", () => {
  let state = run(createIslandGame(), "work", "needs", "next", "work", "needs", "next");
  assert.equal(state.day, 3);
  assert.equal(playIsland(state, "next").day, 3);
  assert.equal(playIsland(state, "repair").stormRepaired, false);
  state = run(state, "reserve", "repair");
  const coins = state.coins;
  assert.equal(state.reserve, 0);
  state = playIsland(state, "repair");
  assert.equal(state.reserve, 0);
  assert.equal(state.coins, coins);
});

test("optional decorations stop before exhausting the bridge budget; restart recovers a fresh game", () => {
  let state = run(createIslandGame(), "work", "needs", "decorate", "bridge", "next");
  state = run(state, "work", "needs", "decorate", "bridge", "next");
  state = run(state, "work", "needs", "reserve", "repair", "next");
  state = run(state, "work", "needs", "decorate", "bridge", "next");
  assert.equal(state.day, 4);
  assert.equal(state.won, false);
  assert.equal(state.bridge, 9);
  assert.equal(state.decoratedDays.length, 2);
  assert.match(state.notice, /Faltan piezas del puente/);
  assert.deepEqual(playIsland(state, "restart"), createIslandGame());
});

test("locked savings and decorations cannot consume today's essential money", () => {
  const state = run(createIslandGame(), "work", "bridge");
  assert.equal(state.coins, 6);
  assert.equal(playIsland(state, "bridge").coins, 6);
  assert.equal(playIsland(state, "reserve").coins, 6);
  const later = run(state, "decorate", "needs");
  assert.equal(later.needsPaid, true);
  assert.equal(later.coins, 0);
});

test("visual timeout disposer prevents late updates after unmount", async () => {
  let updates = 0;
  const dispose = scheduleIslandPulse(() => { updates += 1; }, 5);
  dispose();
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(updates, 0);
  scheduleIslandPulse(() => { updates += 1; }, 5);
  await new Promise(resolve => setTimeout(resolve, 15));
  assert.equal(updates, 1);
});
