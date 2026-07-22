import { createClient } from "redis";

export class redis_helper {
  constructor() {
    this.rediscliend = createClient();
    this.subscriber = this.rediscliend.duplicate();
    this.handlers = new Map();
  }

  async connect() {
    await Promise.all([this.rediscliend.connect(), this.subscriber.connect()]);
  }

  async add_user_in_meeting(connectionId, username, meetingId) {
    await this.rediscliend.hSet(this.presenceKey(meetingId), connectionId, username);
  }

  async delete_user_from_meeting(connectionId, meetingId, documentStore, operationQueue) {
    await this.rediscliend.hDel(this.presenceKey(meetingId), connectionId);

    if ((await this.rediscliend.hLen(this.presenceKey(meetingId))) === 0) {
      await operationQueue.enqueue(meetingId, async () => {
        const session = await documentStore.get(meetingId, this);
        await documentStore.persistOperation(meetingId, session.text, session.version);
        await this.rediscliend.del(this.operationKey(meetingId));
        documentStore.invalidate(meetingId);
      });
    }
  }

  async add_message(meetingId, operation) {
    const message = JSON.stringify(operation);
    await this.rediscliend
      .multi()
      .rPush(this.operationKey(meetingId), message)
      .publish(this.operationChannel(meetingId), message)
      .exec();
  }

  async recive_message(meetingId, handler) {
    if (this.handlers.has(meetingId)) {
      return;
    }

    this.handlers.set(meetingId, handler);
    await this.subscriber.subscribe(this.operationChannel(meetingId), () => {
      try {
        void handler();
      } catch (error) {
        console.warn("[redis] operation handler failed:", error.message);
      }
    });
  }

  async findPresence(meetingId) {
    return this.rediscliend.hVals(this.presenceKey(meetingId));
  }

  async findOperations(meetingId) {
    const operations = await this.rediscliend.lRange(this.operationKey(meetingId), 0, -1);
    return operations.map((operation) => JSON.parse(operation));
  }

  presenceKey(meetingId) {
    return `meeting:${meetingId}:presence`;
  }

  operationKey(meetingId) {
    return `meeting:${meetingId}:operations`;
  }

  operationChannel(meetingId) {
    return `meeting:${meetingId}:operations:events`;
  }
}
