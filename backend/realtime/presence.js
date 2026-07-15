export class MeetingPresence {
  constructor() {
    this.connections = {};
  }

  add(meetingId, user, socket) {
    this.connections[meetingId] ??= {};
    this.connections[meetingId][user.id] = {
      socket,
      username: user.username
    };
  }

  remove(meetingId, userId, socket) {
    if (this.connections[meetingId]?.[userId]?.socket === socket) {
      delete this.connections[meetingId][userId];
    }
  }

  getOnlineUsernames(meetingId) {
    return Object.values(this.connections[meetingId] ?? {}).map((entry) => entry.username);
  }

  broadcast(meetingId, payload, exceptSocket = null) {
    const meetingConnections = this.connections[meetingId] ?? {};

    for (const entry of Object.values(meetingConnections)) {
      if (entry.socket !== exceptSocket) {
        sendJson(entry.socket, payload);
      }
    }
  }
}

export function sendJson(socket, payload) {
  if (socket.readyState === 1) {
    socket.send(JSON.stringify(payload));
  }
}
