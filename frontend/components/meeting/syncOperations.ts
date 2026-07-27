import type { Participant } from "@/types";

export type SyncOperation =
  | { type: "insert"; position: number; value: string }
  | { type: "delete"; position: number; dell: number };

export type EditorInput = {
  type: string;
  start: number;
  end: number;
};

type SocketMessage = {
  type?: string;
  text?: string;
  version?: number;
  participants?: Participant[];
  op?: unknown;
  clientId?: string;
};

export function buildOperations(
  previousText: string,
  nextText: string,
  input?: EditorInput | null
): SyncOperation[] {
  const selected = input ? input.end - input.start : 0;

  if (input?.type === "insertText") {
    const added = nextText.length - previousText.length + selected;
    const operations: SyncOperation[] = [];

    if (selected) {
      operations.push({ type: "delete", position: input.start, dell: selected });
    }
    if (added) {
      operations.push({
        type: "insert",
        position: input.start,
        value: nextText.slice(input.start, input.start + added)
      });
    }
    return operations;
  }

  if (
    input?.type === "deleteContentBackward" ||
    input?.type === "deleteContentForward"
  ) {
    const deleted = previousText.length - nextText.length;
    const position =
      selected || input.type === "deleteContentForward"
        ? input.start
        : input.start - deleted;

    return deleted ? [{ type: "delete", position, dell: deleted }] : [];
  }

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

export function transformoperation(
  incomingOperation: SyncOperation,
  operationArray: Array<SyncOperation & { clientId?: string }>,
  clientId = ""
): SyncOperation {
  const transformed: SyncOperation = { ...incomingOperation };

  for (const reference of operationArray) {
    if (reference.type === "insert" && transformed.type === "insert") {
      const referenceWinsTie =
        String(reference.clientId ?? "").localeCompare(clientId) <= 0;

      if (
        reference.position < transformed.position ||
        (reference.position === transformed.position && referenceWinsTie)
      ) {
        transformed.position += reference.value.length;
      }
      continue;
    }

    if (reference.type === "insert" && transformed.type === "delete") {
      if (reference.position <= transformed.position) {
        transformed.position += reference.value.length;
      } else if (reference.position < transformed.position + transformed.dell) {
        transformed.dell += reference.value.length;
      }
      continue;
    }

    if (reference.type === "delete" && transformed.type === "insert") {
      const referenceEnd = reference.position + reference.dell;

      if (transformed.position >= referenceEnd) {
        transformed.position -= reference.dell;
      } else if (transformed.position > reference.position) {
        transformed.position = reference.position;
      }
      continue;
    }

    if (reference.type === "delete" && transformed.type === "delete") {
      const referenceEnd = reference.position + reference.dell;
      const transformedEnd = transformed.position + transformed.dell;

      if (referenceEnd <= transformed.position) {
        transformed.position -= reference.dell;
      } else if (reference.position < transformedEnd) {
        const overlapStart = Math.max(reference.position, transformed.position);
        const overlapEnd = Math.min(referenceEnd, transformedEnd);

        transformed.dell -= Math.max(0, overlapEnd - overlapStart);

        if (reference.position < transformed.position) {
          transformed.position = reference.position;
        }
      }
    }
  }

  return transformed;
}
