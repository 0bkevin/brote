import test from "node:test";
import assert from "node:assert/strict";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { encodeBase58, parseSolLamports, seedFor } from "./solana-utils";

test("profile seed is stable, distinct and within createWithSeed limit", async () => {
  const first = await seedFor("sofia");
  assert.equal(first, await seedFor("sofia"));
  assert.notEqual(first, await seedFor("mateo"));
  assert.equal(new TextEncoder().encode(first).length, 31);
  const guardian = new PublicKey("11111111111111111111111111111111");
  assert.equal(
    (
      await PublicKey.createWithSeed(guardian, first, SystemProgram.programId)
    ).toBase58(),
    (
      await PublicKey.createWithSeed(guardian, first, SystemProgram.programId)
    ).toBase58(),
  );
});

test("SOL amount parsing keeps lamport precision and rejects unsafe values", () => {
  assert.equal(parseSolLamports("0.000000001"), 1);
  assert.equal(parseSolLamports("1.123456789"), 1_123_456_789);
  assert.equal(parseSolLamports("9007199.254740991"), Number.MAX_SAFE_INTEGER);
  for (const value of ["0", "-1", "1.0000000001", "1e3", "9007199.254740992"]) {
    assert.throws(() => parseSolLamports(value), value);
  }
});

test("TransferWithSeed requires the guardian base signer and derived source", async () => {
  const guardian = new PublicKey("11111111111111111111111111111111");
  const destination = new PublicKey(
    "Vote111111111111111111111111111111111111111",
  );
  const seed = await seedFor("sofia");
  const source = await PublicKey.createWithSeed(
    guardian,
    seed,
    SystemProgram.programId,
  );
  const instruction = SystemProgram.transfer({
    fromPubkey: source,
    basePubkey: guardian,
    toPubkey: destination,
    lamports: 1,
    seed,
    programId: SystemProgram.programId,
  });
  assert(instruction.programId.equals(SystemProgram.programId));
  assert(instruction.keys[0].pubkey.equals(source));
  assert.equal(instruction.keys[0].isSigner, false);
  assert(instruction.keys[1].pubkey.equals(guardian));
  assert.equal(instruction.keys[1].isSigner, true);
  assert(instruction.keys[2].pubkey.equals(destination));
});

test("signature base58 encoding preserves leading zero bytes", () => {
  assert.equal(encodeBase58(Uint8Array.from([0, 0, 1])), "112");
  assert.equal(encodeBase58(Uint8Array.from([0, 0])), "11");
});
