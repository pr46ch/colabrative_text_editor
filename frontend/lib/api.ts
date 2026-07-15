import { Meeting, Participant, User } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_BASE_URL ?? "ws://localhost:8000";

type ApiMeeting = {
  meetingId: string;
  id?: string;
  title: string;
  createdBy?: string;
  participants: string[];
  presence?: Participant[];
  version?: number;
  text?: string;
};

type SignInResponse = User;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers
    }
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => null);
    throw new Error(errorPayload?.error ?? "SyncPad API request failed.");
  }

  return response.json() as Promise<T>;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`
  };
}

export async function registerRequest(username: string, password: string) {
  return request<SignInResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      password
    })
  });
}

export async function signInRequest(username: string, password: string) {
  return request<SignInResponse>("/auth/signin", {
    method: "POST",
    body: JSON.stringify({
      username,
      password
    })
  });
}

export async function listMeetingsRequest(userId: string, token: string) {
  const payload = await request<{ meetings: ApiMeeting[] }>(
    `/meetings?userId=${encodeURIComponent(userId)}`,
    {
      headers: authHeaders(token)
    }
  );

  return payload.meetings.map(toMeeting);
}

export async function createMeetingRequest(input: {
  title: string;
  hostUserId: string;
  inviteUsernames: string[];
}, token: string) {
  const payload = await request<ApiMeeting>("/meetings", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(input)
  });

  return toMeeting(payload);
}

export async function getMeetingRequest(meetingId: string, token: string) {
  const payload = await request<ApiMeeting>(
    `/meetings/${encodeURIComponent(meetingId)}`,
    {
      headers: authHeaders(token)
    }
  );

  return toMeeting(payload);
}

function toMeeting(meeting: ApiMeeting): Meeting {
  const participants =
    meeting.presence ??
    meeting.participants.map((username) => ({
      username,
      isOnline: false
    }));

  return {
    id: meeting.meetingId ?? meeting.id ?? "",
    title: meeting.title,
    createdBy: meeting.createdBy ?? "Unknown",
    lastEdited: "Just now",
    participants,
    text: meeting.text,
    version: meeting.version ?? 0
  };
}
