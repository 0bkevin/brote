import test from "node:test";
import assert from "node:assert/strict";
import { stopSpeech } from "./speech";

test("dismissing a speaking quiz cancels narration and detaches state callbacks", () => {
  let cancels = 0;
  const utterance = { onstart: () => {}, onend: () => {}, onerror: () => {} } as unknown as SpeechSynthesisUtterance;
  stopSpeech({ cancel: () => { cancels++; } }, utterance);
  assert.equal(cancels, 1);
  assert.equal(utterance.onstart, null);
  assert.equal(utterance.onend, null);
  assert.equal(utterance.onerror, null);
  stopSpeech({ cancel: () => { cancels++; } }, null);
  assert.equal(cancels, 1, "a silent quiz does not cancel someone else's speech");
});
