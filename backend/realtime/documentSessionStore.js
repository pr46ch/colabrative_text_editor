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

  async get(meetingId, redisClient) {
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

    const session = new DocumentSession({
      text: meeting.currentText,
      version: meeting.version
    });

    this.sessions.set(meetingId, session);
    await this.sync(meetingId, redisClient);
    return session;
  }

  async sync(meetingId, redisClient) {
    if (!this.sessions.has(meetingId)) {
      await this.get(meetingId, redisClient);
      return [];
    }

    const session = this.sessions.get(meetingId);
    const operations = await redisClient.findOperations(meetingId);
    const unseenOperations = operations.slice(session.operations.length);

    return unseenOperations.map((operation) => session.applyPublishedOperation(operation));
  }

  async persistOperation(meetingId, text, version) {
    await prisma.meeting.update({
      where: {
        id: meetingId
      },
      data: {
        currentText: text,
        version
      }
    });
  }
}
