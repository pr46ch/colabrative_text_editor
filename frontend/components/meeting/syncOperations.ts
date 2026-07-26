import { Participant } from "@/types";

export type SyncOperation =
  | { type: "insert"; position: number; value: string }
  | { type: "delete"; position: number; dell: number };

type SocketMessage = {
  type?: string;
  text?: string;
  version?: number;
  participants?: Participant[];
  op?: unknown;
};

export function buildOperations(previousText: string, nextText: string) {
  if (previousText === nextText) {
    return [];
  }

  let start = 0;

  while (
    start < previousText.length &&
    start < nextText.length &&
    previousText[start] === nextText[start]
  ) {
    start += 1;
  }

  let previousEnd = previousText.length;
  let nextEnd = nextText.length;

  while (
    previousEnd > start &&
    nextEnd > start &&
    previousText[previousEnd - 1] === nextText[nextEnd - 1]
  ) {
    previousEnd -= 1;
    nextEnd -= 1;
  }

  const removedCount = previousEnd - start;
  const insertedText = nextText.slice(start, nextEnd);
  const operations: SyncOperation[] = [];

  if (removedCount > 0) {
    operations.push({
      type: "delete",
      position: start,
      dell: removedCount
    });
  }

  if (insertedText.length > 0) {
    operations.push({
      type: "insert",
      position: start,
      value: insertedText
    });
  }

  return operations;
}

export function applyOperation(text: string, operation: SyncOperation) {
  const position = Math.max(0, Math.min(operation.position, text.length));

  if (operation.type === "insert") {
    return `${text.slice(0, position)}${operation.value}${text.slice(position)}`;
  }

  const deleteCount = Math.max(
    0,
    Math.min(operation.dell, text.length - position)
  );
  return `${text.slice(0, position)}${text.slice(position + deleteCount)}`;
}

export function transformCursorPosition(
  cursorPosition: number,
  operation: SyncOperation
) {
  if (operation.type === "insert") {
    return operation.position < cursorPosition
      ? cursorPosition + operation.value.length
      : cursorPosition;
  }

  const deleteEnd = operation.position + operation.dell;

  if (cursorPosition <= operation.position) {
    return cursorPosition;
  }

  if (cursorPosition >= deleteEnd) {
    return cursorPosition - operation.dell;
  }

  return operation.position;
}

export function isSyncOperation(value: unknown): value is SyncOperation {
  if (!value || typeof value !== "object") {
    return false;
  }

  const operation = value as {
    type?: string;
    position?: unknown;
    value?: unknown;
    dell?: unknown;
  };

  if (!Number.isInteger(operation.position) || Number(operation.position) < 0) {
    return false;
  }

  if (operation.type === "insert") {
    return typeof operation.value === "string";
  }

  if (operation.type === "delete") {
    return Number.isInteger(operation.dell) && Number(operation.dell) >= 0;
  }

  return false;
}

export function parseSocketMessage(data: unknown): SocketMessage | null {
  try {
    return JSON.parse(String(data)) as SocketMessage;
  } catch {
    return null;
  }
}

export function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `client-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}
