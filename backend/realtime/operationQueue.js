export class OperationQueue {
  constructor() {
    this.queues = new Map();
  }

  enqueue(key, task) {
    const previous = this.queues.get(key) ?? Promise.resolve();
    const next = previous.then(task, task);
    const tracked = next.finally(() => {
      if (this.queues.get(key) === tracked) {
        this.queues.delete(key);
      }
    });

    this.queues.set(key, tracked);
    return tracked;
  }
}
