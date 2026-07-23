import { createClient } from "redis";
import { REDIS_URL } from "../config.js";

export class redis_helper {
  constructor() {
    this.rediscliend = createClient({ url: REDIS_URL });
    this.subscriber = this.rediscliend.duplicate();
    this.handlers = new Map();
    this.invalidationHandlers = new Map();
    this.presenceHandlers = new Map();

    this.rediscliend.on("error", (error) => {
      console.error("[redis] client error:", error.message);
    });
    this.subscriber.on("error", (error) => {
      console.error("[redis] subscriber error:", error.message);
    });
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
        await this.rediscliend.publish(this.invalidationChannel(meetingId), "invalidate");
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

  async subscribeToInvalidation(meetingId, handler) {
    if (this.invalidationHandlers.has(meetingId)) {
      return;
    }

    this.invalidationHandlers.set(meetingId, handler);
    await this.subscriber.subscribe(this.invalidationChannel(meetingId), () => {
      void handler();
    });
  }

  async subscribeToPresence(meetingId, handler) {
    if (this.presenceHandlers.has(meetingId)) {
      return;
    }

    this.presenceHandlers.set(meetingId, handler);
    await this.subscriber.subscribe(this.presenceChannel(meetingId), () => {
      void handler();
    });
  }

  async publishPresenceChanged(meetingId) {
    await this.rediscliend.publish(this.presenceChannel(meetingId), "changed");
  }

  async ping() {
    return this.rediscliend.ping();
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

  invalidationChannel(meetingId) {
    return `meeting:${meetingId}:document:invalidate`;
  }

  presenceChannel(meetingId) {
    return `meeting:${meetingId}:presence:events`;
  }
}
