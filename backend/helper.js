export class DocumentSession {
  constructor(initialState = {}) {
    this.text = initialState.text ?? "";
    this.operations = Array.isArray(initialState.operations)
      ? initialState.operations
      : [];
    this.version = Number.isInteger(initialState.version)
      ? initialState.version
      : 0;
  }

  handleOperation(clientMsg) {
    const preparedOperation = this.prepareOperation(clientMsg);
    return this.applyPublishedOperation(preparedOperation);
  }

  prepareOperation(clientMsg) {
    const { op, baseVersion, clientId } = clientMsg;

    if (!clientId || !Number.isInteger(baseVersion)) {
      throw new Error("Operation message must include clientId and baseVersion.");
    }

    if (baseVersion < 0 || baseVersion > this.version) {
      throw new Error(`Invalid baseVersion ${baseVersion}; current version is ${this.version}.`);
    }

    if (!isValidOperation(op)) {
      throw new Error("Malformed operation.");
    }

    const operationsSince = this.operations
      .filter((entry) => entry.version > baseVersion)
      .sort((first, second) => first.version - second.version);

    let transformedOp = cloneOperation(op);

    for (const historyEntry of operationsSince) {
      transformedOp = transformOperation(historyEntry, transformedOp, clientId);
    }

    return {
      op: transformedOp,
      clientId,
      transformedAtVersion: this.version
    };
  }

  applyPublishedOperation(publishedOperation) {
    const { op, clientId, transformedAtVersion } = publishedOperation;

    if (!clientId || !Number.isInteger(transformedAtVersion)) {
      throw new Error("Published operation must include clientId and transformedAtVersion.");
    }

    if (transformedAtVersion < 0 || transformedAtVersion > this.version) {
      throw new Error("Published operation has an invalid transformedAtVersion.");
    }

    if (!isValidOperation(op)) {
      throw new Error("Malformed operation.");
    }

    let transformedOp = cloneOperation(op);

    for (const historyEntry of this.operations
      .filter((entry) => entry.version > transformedAtVersion)
      .sort((first, second) => first.version - second.version)) {
      transformedOp = transformOperation(historyEntry, transformedOp, clientId);
    }

    this.text = applyOperation(this.text, transformedOp);
    this.version += 1;

    this.operations.push({
      op: transformedOp,
      version: this.version,
      clientId,
      time: Date.now()
    });

    return {
      op: transformedOp,
      text: this.text,
      version: this.version,
      clientId
    };
  }
}

export function applyOperation(text, op) {
  if (op.type === "insert") {
    const position = clampPosition(op.position, text.length);
    return `${text.slice(0, position)}${op.value}${text.slice(position)}`;
  }

  if (op.type === "delete") {
    const position = clampPosition(op.position, text.length);
    const deleteCount = Math.max(0, Math.min(op.dell, text.length - position));
    return `${text.slice(0, position)}${text.slice(position + deleteCount)}`;
  }

  throw new Error(`Unsupported operation type: ${op.type}`);
}

export function transformOperation(opReference, op, clientId = "") {
  const reference = getReferenceOperation(opReference);
  const transformed = cloneOperation(op);

  if (reference.type === "insert" && transformed.type === "insert") {
    transformInsertAgainstInsert(reference, transformed, clientId);
    return transformed;
  }

  if (reference.type === "insert" && transformed.type === "delete") {
    transformDeleteAgainstInsert(reference, transformed);
    return transformed;
  }

  if (reference.type === "delete" && transformed.type === "insert") {
    transformInsertAgainstDelete(reference, transformed);
    return transformed;
  }

  if (reference.type === "delete" && transformed.type === "delete") {
    transformDeleteAgainstDelete(reference, transformed);
    return transformed;
  }

  return transformed;
}

export function isValidOperation(op) {
  if (!op || typeof op !== "object") {
    return false;
  }

  if (!Number.isInteger(op.position) || op.position < 0) {
    return false;
  }

  if (op.type === "insert") {
    return typeof op.value === "string" && op.value.length > 0;
  }

  if (op.type === "delete") {
    return Number.isInteger(op.dell) && op.dell > 0;
  }

  return false;
}

function transformInsertAgainstInsert(reference, op, clientId) {
  const referenceLength = reference.value.length;

  // Simultaneous inserts at the same position are ordered by clientId so every
  // server transform makes the same deterministic choice.
  const referenceWinsTie =
    String(reference.clientId ?? "").localeCompare(String(clientId ?? "")) <= 0;

  if (reference.position < op.position || (reference.position === op.position && referenceWinsTie)) {
    op.position += referenceLength;
  }
}

function transformDeleteAgainstInsert(reference, op) {
  const referenceLength = reference.value.length;
  const deleteEnd = op.position + op.dell;

  if (reference.position <= op.position) {
    op.position += referenceLength;
    return;
  }

  if (reference.position < deleteEnd) {
    op.dell += referenceLength;
  }
}

function transformInsertAgainstDelete(reference, op) {
  const deleteEnd = reference.position + reference.dell;

  if (op.position <= reference.position) {
    return;
  }

  if (op.position >= deleteEnd) {
    op.position -= reference.dell;
    return;
  }

  op.position = reference.position;
}

function transformDeleteAgainstDelete(reference, op) {
  const referenceStart = reference.position;
  const referenceEnd = reference.position + reference.dell;
  const deleteStart = op.position;
  const deleteEnd = op.position + op.dell;

  if (referenceEnd <= deleteStart) {
    op.position -= reference.dell;
    return;
  }

  if (referenceStart >= deleteEnd) {
    return;
  }

  const overlapStart = Math.max(referenceStart, deleteStart);
  const overlapEnd = Math.min(referenceEnd, deleteEnd);
  const overlapLength = Math.max(0, overlapEnd - overlapStart);

  op.dell = Math.max(0, op.dell - overlapLength);

  if (referenceStart < deleteStart) {
    op.position = referenceStart;
  }
}

function getReferenceOperation(opReference) {
  const referenceOp = opReference.op ? opReference.op : opReference;

  return {
    ...cloneOperation(referenceOp),
    clientId: opReference.clientId ?? referenceOp.clientId
  };
}

function cloneOperation(op) {
  if (op.type === "insert") {
    return {
      type: "insert",
      position: op.position,
      value: op.value
    };
  }

  if (op.type === "delete") {
    return {
      type: "delete",
      position: op.position,
      dell: op.dell
    };
  }

  return { ...op };
}

function clampPosition(position, textLength) {
  return Math.max(0, Math.min(position, textLength));
}
