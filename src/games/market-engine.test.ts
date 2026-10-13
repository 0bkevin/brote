import test from "node:test";
import assert from "node:assert/strict";
import {
  CHECKOUT, MARKET_HEIGHT, MARKET_WIDTH, ROUNDS, START, cartTotal, initialMarketState,
  marketReducer, missingProducts, remaining, type MarketState,
} from "./market-engine";

const play = () => marketReducer(initialMarketState(), { type: "START" });
const visit = (state: MarketState, x: number, y: number) => marketReducer(state, { type: "VISIT", x, y });
const buy = (state: MarketState, offerId: string) => marketReducer(state, { type: "BUY", offerId });

test("movement obeys the compact board and rejects invalid leaps", () => {
  let state = play();
  assert.deepEqual(state.position, START);
  state = marketReducer(state, { type: "MOVE", dx: -1, dy: 0 });
  assert.deepEqual(state.position, START);
  state = marketReducer(state, { type: "MOVE", dx: 2, dy: 0 });
  assert.deepEqual(state.position, START);
  state = marketReducer(state, { type: "MOVE", dx: 0, dy: -1 });
  assert.deepEqual(state.position, { x: 0, y: 2 });
  state = visit(state, MARKET_WIDTH, MARKET_HEIGHT);
  assert.deepEqual(state.position, { x: 0, y: 2 });
  state = visit(state, 4, 1); // No stall in that cell.
  assert.deepEqual(state.position, { x: 0, y: 2 });
});

test("buy is explicit, location-bound, unique by product, and cannot overspend", () => {
  let state = play();
  state = visit(state, 0, 0);
  assert.equal(cartTotal(state), 0);
  state = buy(state, "r1-bread");
  state = buy(state, "r1-bread");
  assert.deepEqual(state.cart, ["r1-bread"]);
  state = visit(state, 0, 2);
  state = buy(state, "r1-bread-kiosk");
  assert.deepEqual(state.cart, ["r1-bread"]);
  state = visit(state, 1, 3);
  state = buy(state, "r1-sticker");
  state = visit(state, 3, 3);
  state = buy(state, "r1-sweet");
  assert.equal(remaining(state), 1);
  state = visit(state, 2, 0);
  state = buy(state, "r1-milk");
  assert.equal(state.feedback, "noMoney");
  assert.equal(remaining(state), 1);
  state = marketReducer(state, { type: "REFUND", offerId: "r1-sticker" });
  assert.equal(remaining(state), 5);
  state = buy(state, "r1-milk");
  assert.equal(remaining(state), 1);
});

test("early checkout cannot advance; exact budget is valid; duplicate actions cannot advance twice", () => {
  let state = play();
  state = marketReducer(state, { type: "CHECKOUT" });
  assert.equal(state.phase, "playing");
  state = visit(state, CHECKOUT.x, CHECKOUT.y);
  state = marketReducer(state, { type: "CHECKOUT" });
  assert.equal(state.feedback, "missing");
  assert.equal(state.results.length, 0);
  for (const offerId of ["r1-bread", "r1-milk", "r1-fruit"]) {
    const item = ROUNDS[0].offers.find((candidate) => candidate.id === offerId)!;
    state = buy(visit(state, item.x, item.y), offerId);
  }
  assert.deepEqual(missingProducts(state), []);
  assert.equal(remaining(state), 1);
  state = buy(visit(state, 3, 3), "r1-sweet");
  assert.equal(state.feedback, "noMoney");
  // Swap the lower-cost fruit for the kiosk fruit to use the full budget.
  state = marketReducer(state, { type: "REFUND", offerId: "r1-fruit" });
  state = buy(visit(state, 4, 2), "r1-fruit-kiosk");
  assert.equal(remaining(state), 0);
  state = visit(state, CHECKOUT.x, CHECKOUT.y);
  state = marketReducer(state, { type: "CHECKOUT" });
  assert.equal(state.phase, "roundCleared");
  assert.deepEqual(state.results, [{ roundId: "picnic", remaining: 0 }]);
  const duplicate = marketReducer(state, { type: "CHECKOUT" });
  assert.equal(duplicate, state);
  state = marketReducer(state, { type: "NEXT" });
  assert.equal(state.roundIndex, 1);
  assert.equal(state.cart.length, 0);
  assert.equal(marketReducer(state, { type: "NEXT" }), state);
});

test("all three rounds win once; post-win input is inert and reset clears history", () => {
  let state = play();
  for (let index = 0; index < ROUNDS.length; index++) {
    const round = ROUNDS[index];
    for (const product of round.required) {
      const item = round.offers.find((candidate) => candidate.product === product)!;
      state = buy(visit(state, item.x, item.y), item.id);
    }
    state = marketReducer(visit(state, CHECKOUT.x, CHECKOUT.y), { type: "CHECKOUT" });
    if (index < ROUNDS.length - 1) state = marketReducer(state, { type: "NEXT" });
  }
  assert.equal(state.phase, "won");
  assert.equal(state.results.length, 3);
  assert.equal(state.results.reduce((sum, result) => sum + result.remaining, 0), 6);
  assert.equal(marketReducer(state, { type: "CHECKOUT" }), state);
  assert.equal(marketReducer(state, { type: "BUY", offerId: "r3-sweet" }), state);
  assert.deepEqual(marketReducer(state, { type: "RESET" }), initialMarketState());
});
