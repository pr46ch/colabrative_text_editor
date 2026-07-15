import { prisma } from "../db.js";
import { DocumentSession } from "../helper.js";

export class DocumentSessionStore {
  constructor() {
    this.sessions = new Map();
  }

  createEmpty(meetingId) {
    this.sessions.set(meetingId, new DocumentSession());
  }

  invalidate(meetingId) {
    this.sessions.delete(meetingId);
  }

  async get(meetingId) {
    if (this.sessions.has(meetingId)) {
      return this.sessions.get(meetingId);
    }

    const meeting = await prisma.meeting.findUnique({
      where: {
        id: meetingId
      },
      select: {
        currentText: true,
        version: true
      }
    });

    if (!meeting) {
      throw new Error("Meeting not found.");
    }

    const operations = await prisma.operationLog.findMany({
      where: {
        meetingId
      },
      orderBy: {
        version: "asc"
      }
    });

    const session = new DocumentSession({
      text: meeting.currentText,
      version: meeting.version,
      operations: operations.map((entry) => ({
        op: entry.op,
        version: entry.version,
        clientId: entry.clientId,
        time: entry.createdAt.getTime()
      }))
    });

    this.sessions.set(meetingId, session);
    return session;
  }

  async persistOperation(meetingId, result, clientId) {
    await prisma.$transaction(async (transaction) => {
      const updated = await transaction.meeting.updateMany({
        where: {
          id: meetingId,
          version: result.version - 1
        },
        data: {
          currentText: result.text,
          version: result.version
        }
      });

      if (updated.count !== 1) {
        throw new Error("Document version changed before the operation could be saved.");
      }

      await transaction.operationLog.create({
        data: {
          meetingId,
          version: result.version,
          clientId,
          op: result.op
        }
      });
    });
  }
}
