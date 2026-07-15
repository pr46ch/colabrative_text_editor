import test from "node:test";
import assert from "node:assert/strict";

process.env.JWT_SECRET = "syncpad-test-secret";
process.env.BCRYPT_ROUNDS = "4";

const {
  hashPassword,
  normalizeUsername,
  validatePassword,
  verifyPassword
} = await import("../auth.js");

test("normalizeUsername trims and lowercases usernames", () => {
  assert.equal(normalizeUsername("  Maya  "), "maya");
});

test("validatePassword requires at least 6 characters", () => {
  assert.equal(validatePassword("short"), false);
  assert.equal(validatePassword("secret1"), true);
});

test("hashPassword stores a bcrypt hash and verifyPassword checks it", async () => {
  const hash = await hashPassword("secret1");

  assert.notEqual(hash, "secret1");
  assert.equal(await verifyPassword("secret1", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});
