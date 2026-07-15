import { normalizeUsername } from "../auth.js";
import { prisma } from "../db.js";

export async function findMeetingForUser(meetingId, user) {
  if (!meetingId) {
    return null;
  }

  return prisma.meeting.findFirst({
    where: {
      id: meetingId,
      ...userMeetingAccessWhere(user)
    },
    include: meetingInclude()
  });
}

export function userMeetingAccessWhere(user) {
  return {
    OR: [
      {
        hostUserId: user.id
      },
      {
        participants: {
          some: {
            username: user.username
          }
        }
      }
    ]
  };
}

export function meetingInclude() {
  return {
    host: {
      select: {
        id: true,
        username: true
      }
    },
    participants: {
      orderBy: {
        createdAt: "asc"
      }
    }
  };
}

export function serializeMeeting(meeting, options = {}) {
  const payload = {
    meetingId: meeting.id,
    id: meeting.id,
    title: meeting.title,
    hostUserId: meeting.hostUserId,
    createdBy: meeting.host?.username ?? "Unknown",
    participants: meeting.participants.map((participant) => participant.username),
    presence: getParticipantPresence(meeting, options.onlineUsernames),
    version: meeting.version
  };

  if (options.includeDocument) {
    payload.text = meeting.currentText;
  }

  return payload;
}

export function getParticipantPresence(meeting, onlineUsernames = []) {
  const onlineSet =
    onlineUsernames instanceof Set ? onlineUsernames : new Set(onlineUsernames);

  return meeting.participants.map((participant) => ({
    username: participant.username,
    isOnline: onlineSet.has(participant.username)
  }));
}

export function uniqueUsernames(usernames) {
  return Array.from(
    new Set(
      usernames
        .map(normalizeUsername)
        .filter(Boolean)
    )
  );
}
