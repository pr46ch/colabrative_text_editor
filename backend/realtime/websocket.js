import { WebSocketServer } from "ws";
import { getUserFromToken } from "../auth.js";
import { prisma } from "../db.js";
import { isValidOperation } from "../helper.js";
import { findMeetingForUser, getParticipantPresence } from "../services/meetings.js";
import { OperationQueue } from "./operationQueue.js";
import { sendJson } from "./presence.js";

export function attachWebSocketServer(server, { documentStore, presence }) {
  const wsServer = new WebSocketServer({ server });
  const operationQueue = new OperationQueue();

  wsServer.on("connection", (socket, request) => {
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

    presence.add(meetingId, user, socket);
    console.log(`[ws] ${user.username} connected to meeting ${meetingId}`);

    activateConnection(user, meetingId);

    socket.on("close", () => {
      presence.remove(meetingId, user.id, socket);
      console.log(`[ws] ${user.username} disconnected from meeting ${meetingId}`);
      void broadcastPresence(meetingId);
    });

    socket.on("error", (error) => {
      console.error(`[ws] connection error for ${user.username}:`, error);
    });

    const session = await documentStore.get(meetingId);

    sendJson(socket, {
      type: "document",
      text: session.text,
      version: session.version
    });
    await broadcastPresence(meetingId);
  }

  async function handleMessage(rawMessage, sender, user, meetingId) {
    let message;

    try {
      message = JSON.parse(rawMessage.toString());
    } catch (error) {
      console.warn("[ws] ignored non-JSON message:", error.message);
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

    await operationQueue.enqueue(meetingId, async () => {
      const meeting = await findMeetingForUser(meetingId, user);

      if (!meeting) {
        console.warn(`[ws] ignored operation for inaccessible meeting ${meetingId}`);
        return;
      }

      let result;

      try {
        const session = await documentStore.get(meetingId);

        console.log(
          `[ot] operation from ${user.username} on meeting ${meetingId} at base ${message.baseVersion}`
        );

        result = session.handleOperation({
          op: message.op,
          baseVersion: message.baseVersion,
          clientId: String(message.clientId)
        });

        await documentStore.persistOperation(meetingId, result, String(message.clientId));
      } catch (error) {
        documentStore.invalidate(meetingId);
        console.warn(
          "[ws] ignored operation that failed validation or persistence:",
          error.message
        );
        return;
      }

      sendJson(sender, {
        type: "ack",
        version: result.version
      });

      presence.broadcast(
        meetingId,
        {
          type: "remoteOperation",
          op: result.op,
          version: result.version,
          clientId: String(message.clientId)
        },
        sender
      );

      console.log(`[ot] broadcast version ${result.version} for meeting ${meetingId}`);
    });
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

    const participants = getParticipantPresence(
      meeting,
      presence.getOnlineUsernames(meetingId)
    );

    presence.broadcast(meetingId, {
      type: "presence",
      participants
    });

    console.log(`[presence] broadcast ${participants.length} participants for meeting ${meetingId}`);
  }

  return wsServer;
}
