"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createMeetingRequest, listMeetingsRequest } from "@/lib/api";
import { CreateMeetingInput, Meeting } from "@/types";

type MeetingsContextValue = {
  meetings: Meeting[];
  isCreating: boolean;
  createMeeting: (input: CreateMeetingInput) => Promise<Meeting>;
};

const MeetingsContext = createContext<MeetingsContextValue | undefined>(
  undefined
);

type MeetingsProviderProps = {
  children: React.ReactNode;
};

export function MeetingsProvider({ children }: MeetingsProviderProps) {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) {
      setMeetings([]);
      return;
    }

    let cancelled = false;

    listMeetingsRequest(user.userId, user.token)
      .then((nextMeetings) => {
        if (!cancelled) {
          setMeetings(nextMeetings);
        }
      })
      .catch((caughtError) => {
        console.error("Unable to load meetings:", caughtError);
        if (!cancelled) {
          setMeetings([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const createMeeting = useCallback(async (input: CreateMeetingInput) => {
    if (!user) {
      throw new Error("Sign in before creating a meeting.");
    }

    setIsCreating(true);

    try {
      const uniqueInvites = Array.from(
        new Set(
          input.invitedUsernames
            .map((username) => username.trim())
            .filter(Boolean)
            .filter((username) => username !== user.username)
        )
      );

      const meeting = await createMeetingRequest({
        title: input.title,
        inviteUsernames: uniqueInvites
      }, user.token);

      setMeetings((currentMeetings) => [meeting, ...currentMeetings]);
      return meeting;
    } finally {
      setIsCreating(false);
    }
  }, [user]);

  const value = useMemo(
    () => ({
      meetings,
      isCreating,
      createMeeting
    }),
    [createMeeting, isCreating, meetings]
  );

  return (
    <MeetingsContext.Provider value={value}>
      {children}
    </MeetingsContext.Provider>
  );
}

export function useMeetings() {
  const context = useContext(MeetingsContext);

  if (!context) {
    throw new Error("useMeetings must be used within MeetingsProvider");
  }

  return context;
}
