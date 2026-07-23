import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";
import { getUserFromToken } from "../auth.js";
import { prisma } from "../db.js";
import { isValidOperation } from "../helper.js";
import { findMeetingForUser, getParticipantPresence } from "../services/meetings.js";
import { OperationQueue } from "./operationQueue.js";
import { sendJson } from "./presence.js";
import { isAllowedOrigin } from "../config.js";

export function attachWebSocketServer(server, { documentStore, presence, redisclient }) {
  const wsServer = new WebSocketServer({ server });
  const operationQueue = new OperationQueue();
  const pendingSenders = new Map();

  wsServer.on("connection", (socket, request) => {
    if (!isAllowedOrigin(request.headers.origin)) {
      socket.close(1008, "Origin is not allowed.");
      return;
    }

    const pendingMessages = [];
    let connectionContext = null;

    socket.on("message", (rawMessage) => {
      if (!connectionContext) {
        pendingMessages.push(rawMessage);
        return;
      }

      void handleMessage(
        rawMessage,
        socket,
        connectionContext.user,
        connectionContext.meetingId
      );
    });

    void handleConnection(socket, request, (user, meetingId) => {
      connectionContext = { user, meetingId };

      for (const rawMessage of pendingMessages.splice(0)) {
        void handleMessage(rawMessage, socket, user, meetingId);
      }
    });
  });

  async function handleConnection(socket, request, activateConnection) {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");
    const meetingId = requestUrl.searchParams.get("meetingId") ?? "";
    const token = requestUrl.searchParams.get("token") ?? "";
    const user = await getUserFromToken(token);

    if (!user) {
      console.log("[ws] rejected connection: invalid token");
      socket.close(1008, "Invalid token.");
      return;
    }

    const meeting = await findMeetingForUser(meetingId, user);

    if (!meeting) {
      console.log("[ws] rejected connection: invalid meeting or access denied");
      socket.close(1008, "Invalid meetingId or access denied.");
      return;
    }

    const connectionId = randomUUID();
    presence.add(meetingId, user, socket);
    console.log(`[ws] ${user.username} connected to meeting ${meetingId}`);
    await redisclient.add_user_in_meeting(connectionId, user.username, meetingId);
    await redisclient.recive_message(meetingId, () => hendleincomingmessage(meetingId));
    await redisclient.subscribeToInvalidation(meetingId, () => documentStore.invalidate(meetingId));
    await redisclient.subscribeToPresence(meetingId, () => void broadcastPresence(meetingId));

    activateConnection(user, meetingId);

    socket.on("close", () => {
      presence.remove(meetingId, user.id, socket);
      console.log(`[ws] ${user.username} disconnected from meeting ${meetingId}`);
      void redisclient
        .delete_user_from_meeting(connectionId, meetingId, documentStore, operationQueue)
        .then(() => redisclient.publishPresenceChanged(meetingId))
        .catch((error) => console.error("[redis] presence cleanup failed:", error));
    });

    socket.on("error", (error) => {
      console.error(`[ws] connection error for ${user.username}:`, error);
    });

    const session = await operationQueue.enqueue(meetingId, () =>
      documentStore.get(meetingId, redisclient)
    );

    sendJson(socket, {
      type: "document",
      text: session.text,
      version: session.version
    });
    await broadcastPresence(meetingId);
    await redisclient.publishPresenceChanged(meetingId);
  }

  async function handleMessage(rawMessage, sender, user, meetingId) {
    let message;

    try {
      message = JSON.parse(rawMessage.toString());
    } catch (error) {
      console.warn("[ws] ignored non-JSON message:", error.message);
      return;
    }

    if (message.type === "ping") {
      return;
    }

    if (message.type !== "operation") {
      console.warn(`[ws] ignored unsupported message type: ${message.type}`);
      return;
    }

    const hasMalformedOperation =
      !isValidOperation(message.op) ||
      !Number.isInteger(message.baseVersion) ||
      !message.clientId;

    if (hasMalformedOperation) {
      console.warn("[ws] ignored malformed operation message:", message);
      return;
    }
    const clientId = String(message.clientId);
    const pendingSender = createPendingSender(clientId, sender);

    try {
      await operationQueue.enqueue(meetingId, async () => {
        const session = await documentStore.get(meetingId, redisclient);
        const publishedOperation = session.prepareOperation({
          op: message.op,
          baseVersion: message.baseVersion,
          clientId
        });

        await redisclient.add_message(meetingId, publishedOperation);
      });
    } catch (error) {
      removePendingSender(clientId, pendingSender);
      console.warn("[ws] ignored operation:", error.message);
    }
  }
  async function hendleincomingmessage(meetingId) {
    await operationQueue.enqueue(meetingId, async () => {
      try {
        const results = await documentStore.sync(meetingId, redisclient);

        for (const result of results) {
          const pendingSender = takePendingSender(String(result.clientId));

          presence.broadcast(meetingId, {
            type: "remoteOperation",
            op: result.op,
            version: result.version,
            clientId: String(result.clientId)
          }, pendingSender?.sender);

          if (pendingSender) {
            sendJson(pendingSender.sender, { type: "ack", version: result.version });
          }
        }
      } catch (error) {
        documentStore.invalidate(meetingId);
        console.warn("[redis] ignored operation:", error.message);
      }
    });
  }

  function createPendingSender(clientId, sender) {
    const pendingSender = {
      sender
    };

    const senders = pendingSenders.get(clientId) ?? [];
    senders.push(pendingSender);
    pendingSenders.set(clientId, senders);
    return pendingSender;
  }

  function takePendingSender(clientId) {
    const senders = pendingSenders.get(clientId);
    const pendingSender = senders?.shift();

    if (senders?.length === 0) {
      pendingSenders.delete(clientId);
    }

    return pendingSender;
  }

  function removePendingSender(clientId, pendingSender) {
    const senders = pendingSenders.get(clientId);

    if (!senders) {
      return;
    }

    const index = senders.indexOf(pendingSender);
    if (index !== -1) {
      senders.splice(index, 1);
    }
    if (senders.length === 0) {
      pendingSenders.delete(clientId);
    }
  }

  async function broadcastPresence(meetingId) {
    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId
      },
      include: {
        participants: {
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    });

    if (!meeting) {
      return;
    }

    const onlineUsernames = await redisclient.findPresence(meetingId);
    const participants = getParticipantPresence(meeting, onlineUsernames);

    presence.broadcast(meetingId, {
      type: "presence",
      participants
    });

  }

  return wsServer;
}
