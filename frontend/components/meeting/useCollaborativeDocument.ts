"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from "react";
import { WS_BASE_URL } from "@/lib/api";
import { Meeting, Participant, User } from "@/types";
import {
  applyOperation,
  buildOperations,
  createClientId,
  isSyncOperation,
  parseSocketMessage,
  SyncOperation,
  transformCursorPosition
} from "@/components/meeting/syncOperations";

type UseCollaborativeDocumentArgs = {
  meetingId: string;
  meeting: Meeting | null;
  user: User | null;
  onParticipantsChange: (participants: Participant[]) => void;
};

export function useCollaborativeDocument({
  meetingId,
  meeting,
  user,
  onParticipantsChange
}: UseCollaborativeDocumentArgs) {
  const [documentText, setDocumentText] = useState("");
  const [documentVersion, setDocumentVersion] = useState(0);
  const [socketStatus, setSocketStatus] = useState("Disconnected");
  const seededDocumentKeyRef = useRef<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const versionRef = useRef(0);
  const clientIdRef = useRef(createClientId());
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const documentTextRef = useRef("");
  const pendingSelectionRef = useRef<{
    start: number;
    end: number;
    direction: "forward" | "backward" | "none";
  } | null>(null);

  const updateVersion = useCallback((nextVersion: number) => {
    versionRef.current = Math.max(versionRef.current, nextVersion);
    setDocumentVersion(versionRef.current);
  }, []);

  useEffect(() => {
    if (!meeting) {
      return;
    }

    const nextVersion = meeting.version ?? 0;
    const nextDocumentKey = `${meeting.id}:${nextVersion}:${meeting.text ?? ""}`;

    if (seededDocumentKeyRef.current === nextDocumentKey) {
      return;
    }

    setDocumentText(meeting.text ?? "");
    documentTextRef.current = meeting.text ?? "";
    setDocumentVersion(nextVersion);
    versionRef.current = nextVersion;
    seededDocumentKeyRef.current = nextDocumentKey;
  }, [meeting]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const socketUrl = `${WS_BASE_URL}?meetingId=${encodeURIComponent(
      meetingId
    )}&userId=${encodeURIComponent(user.userId)}&token=${encodeURIComponent(user.token)}`;
    const socket = new WebSocket(socketUrl);

    wsRef.current = socket;
    setSocketStatus("Connecting");

    socket.onopen = () => {
      setSocketStatus("Connected");
    };

    socket.onmessage = (event) => {
      const message = parseSocketMessage(event.data);

      if (!message) {
        return;
      }

      if (message.type === "document" && typeof message.text === "string") {
        const nextVersion = typeof message.version === "number" ? message.version : 0;

        documentTextRef.current = message.text;
        pendingSelectionRef.current = null;
        setDocumentText(message.text);
        updateVersion(nextVersion);
        return;
      }

      if (message.type === "presence" && Array.isArray(message.participants)) {
        onParticipantsChange(message.participants);
        return;
      }

      if (message.type === "ack" && typeof message.version === "number") {
        updateVersion(message.version);
        return;
      }

      const incomingOperation = message.op;

      if (
        message.type === "remoteOperation" &&
        typeof message.version === "number" &&
        isSyncOperation(incomingOperation)
      ) {
        const editor = editorRef.current;
        const currentSelection =
          pendingSelectionRef.current ??
          (editor
            ? {
                start: editor.selectionStart,
                end: editor.selectionEnd,
                direction: editor.selectionDirection
              }
            : null);

        if (currentSelection) {
          pendingSelectionRef.current = {
            start: transformCursorPosition(currentSelection.start, incomingOperation),
            end: transformCursorPosition(currentSelection.end, incomingOperation),
            direction: currentSelection.direction
          };
        }

        const nextText = applyOperation(documentTextRef.current, incomingOperation);
        documentTextRef.current = nextText;
        setDocumentText(nextText);
        updateVersion(message.version);
      }
    };

    socket.onerror = () => {
      setSocketStatus("Disconnected");
    };

    socket.onclose = () => {
      setSocketStatus("Disconnected");
    };

    return () => {
      socket.close();

      if (wsRef.current === socket) {
        wsRef.current = null;
      }
    };
  }, [meetingId, onParticipantsChange, updateVersion, user]);

  useLayoutEffect(() => {
    const pendingSelection = pendingSelectionRef.current;
    const editor = editorRef.current;

    if (!pendingSelection || !editor) {
      return;
    }

    editor.setSelectionRange(
      pendingSelection.start,
      pendingSelection.end,
      pendingSelection.direction
    );
    pendingSelectionRef.current = null;
  }, [documentText]);

  const sendOperations = useCallback((operations: SyncOperation[]) => {
    const socket = wsRef.current;

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }

    let baseVersion = versionRef.current;

    for (const op of operations) {
      socket.send(
        JSON.stringify({
          type: "operation",
          op,
          baseVersion,
          clientId: clientIdRef.current
        })
      );
      baseVersion += 1;
    }

    versionRef.current = baseVersion;
    setDocumentVersion(baseVersion);
  }, []);

  const handleEditorChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const nextText = event.target.value;
      const operations = buildOperations(documentTextRef.current, nextText);

      documentTextRef.current = nextText;
      pendingSelectionRef.current = null;
      setDocumentText(nextText);

      if (operations.length > 0) {
        sendOperations(operations);
      }
    },
    [sendOperations]
  );

  return {
    documentText,
    documentVersion,
    socketStatus,
    editorRef,
    handleEditorChange
  };
}
