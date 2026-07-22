import "dotenv/config";
import cors from "cors";
import express from "express";
import http from "node:http";
import { getCorsOrigin, PORT } from "./config.js";
import { prisma } from "./db.js";
import { asyncHandler } from "./middleware/asyncHandler.js";
import { DocumentSessionStore } from "./realtime/documentSessionStore.js";
import { MeetingPresence } from "./realtime/presence.js";
import { attachWebSocketServer } from "./realtime/websocket.js";
import { createAuthRouter } from "./routes/authRoutes.js";
import { createMeetingRouter } from "./routes/meetingRoutes.js";
import { redis_helper } from "./redis_stuff/rd.js";

const app = express();
const server = http.createServer(app);
const documentStore = new DocumentSessionStore();
const presence = new MeetingPresence();
const redis_client=new redis_helper();

app.use(
  cors({
    origin: getCorsOrigin()
  })
);
app.use(express.json({ limit: "1mb" }));

app.get(
  "/health",
  asyncHandler(async (_request, response) => {
    await prisma.$queryRaw`SELECT 1`;
    response.json({ ok: true });
  })
);

app.use("/auth", createAuthRouter());
app.use(
  "/meetings",
  createMeetingRouter({
    documentStore,
    getOnlineUsernames: (meetingId) => presence.getOnlineUsernames(meetingId)
  })
);

attachWebSocketServer(server, {
  documentStore,
  presence,
  redisclient: redis_client
});

app.use((error, _request, response, _next) => {
  console.error("[server] unhandled error:", error);
  response.status(500).json({ error: "Internal server error." });
});

async function start() {
  await redis_client.connect();
  server.listen(PORT, () => {
    console.log(`SyncPad server started on http://localhost:${PORT}`);
  });
}

void start().catch((error) => {
  console.error("[server] failed to connect to Redis:", error);
  process.exitCode = 1;
});
