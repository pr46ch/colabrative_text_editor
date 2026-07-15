import test from "node:test";
import assert from "node:assert/strict";
import { DocumentSession, applyOperation, transformOperation } from "../helper.js";

test("applyOperation inserts and deletes text", () => {
  assert.equal(
    applyOperation("", { type: "insert", position: 0, value: "hello" }),
    "hello"
  );
  assert.equal(
    applyOperation("hello", { type: "delete", position: 1, dell: 3 }),
    "ho"
  );
});

test("DocumentSession transforms stale inserts against newer history", () => {
  const session = new DocumentSession();

  const first = session.handleOperation({
    op: { type: "insert", position: 0, value: "A" },
    baseVersion: 0,
    clientId: "a"
  });
  const second = session.handleOperation({
    op: { type: "insert", position: 0, value: "B" },
    baseVersion: 0,
    clientId: "b"
  });

  assert.equal(first.version, 1);
  assert.equal(second.version, 2);
  assert.equal(session.text, "AB");
});

test("transformOperation handles delete overlap", () => {
  const transformed = transformOperation(
    {
      op: { type: "delete", position: 1, dell: 3 },
      version: 1,
      clientId: "a"
    },
    { type: "delete", position: 2, dell: 3 },
    "b"
  );

  assert.deepEqual(transformed, {
    type: "delete",
    position: 1,
    dell: 1
  });
});

test("DocumentSession can be rehydrated from persisted state", () => {
  const session = new DocumentSession({
    text: "hello",
    version: 3,
    operations: [
      {
        op: { type: "insert", position: 0, value: "hello" },
        version: 3,
        clientId: "seed"
      }
    ]
  });

  assert.equal(session.text, "hello");
  assert.equal(session.version, 3);
  assert.equal(session.operations.length, 1);
});
