import { Router } from "express";
import { requireAuth } from "../auth.js";
import { prisma } from "../db.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  findMeetingForUser,
  meetingInclude,
  serializeMeeting,
  uniqueUsernames,
  userMeetingAccessWhere
} from "../services/meetings.js";

export function createMeetingRouter({ documentStore, getOnlineUsernames }) {
  const router = Router();
  //route to create meeting
  router.post(
    "/",
    requireAuth,
    asyncHandler(async (request, response) => {
      const title = String(request.body?.title ?? "").trim();
      const inviteUsernames = Array.isArray(request.body?.inviteUsernames)
        ? request.body.inviteUsernames
        : [];

      if (!title) {
        return response.status(400).json({ error: "Meeting title is required." });
      }

      const participants = uniqueUsernames([request.user.username, ...inviteUsernames]);

      const meeting = await prisma.meeting.create({
        data: {
          title,
          hostUserId: request.user.id,
          participants: {
            create: participants.map((username) => ({ username }))
          }
        },
        include: meetingInclude()
      });

      documentStore.createEmpty(meeting.id);

      console.log(`[meeting] created ${meeting.id} "${title}"`);
      return response.status(201).json(serializeWithPresence(meeting));
    })
  );
  
  //route to get all the meetings
  router.get(
    "/",
    requireAuth,
    asyncHandler(async (request, response) => {
      const requestedUserId = String(request.query.userId ?? "").trim();

      if (requestedUserId && requestedUserId !== request.user.id) {
        return response.status(403).json({ error: "Cannot list another user's meetings." });
      }

      const meetings = await prisma.meeting.findMany({
        where: userMeetingAccessWhere(request.user),
        include: meetingInclude(),
        orderBy: {
          updatedAt: "desc"
        }
      });

      return response.json({
        meetings: meetings.map((meeting) => serializeWithPresence(meeting))
      });
    })
  );

  //get a meeting
  router.get(
    "/:id",
    requireAuth,
    asyncHandler(async (request, response) => {
      const meeting = await findMeetingForUser(request.params.id, request.user);

      if (!meeting) {
        return response.status(404).json({ error: "Meeting not found." });
      }

      return response.json(serializeWithPresence(meeting, { includeDocument: true }));
    })
  );

  function serializeWithPresence(meeting, options = {}) {
    return serializeMeeting(meeting, {
      ...options,
      onlineUsernames: getOnlineUsernames(meeting.id)
    });
  }

  return router;
}
