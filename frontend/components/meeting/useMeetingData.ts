"use client";

import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { getMeetingRequest } from "@/lib/api";
import { Meeting } from "@/types";

type UseMeetingDataArgs = {
  meetingId: string;
  cachedMeeting?: Meeting;
  enabled: boolean;
  token?: string;
};

type UseMeetingDataResult = {
  meeting: Meeting | null;
  setMeeting: Dispatch<SetStateAction<Meeting | null>>;
  isLoading: boolean;
  loadError: string;
};

export function useMeetingData({
  meetingId,
  cachedMeeting,
  enabled,
  token
}: UseMeetingDataArgs): UseMeetingDataResult {
  const [meeting, setMeeting] = useState<Meeting | null>(cachedMeeting ?? null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (cachedMeeting) {
      setMeeting((currentMeeting) => currentMeeting ?? cachedMeeting);
    }
  }, [cachedMeeting]);

  useEffect(() => {
    if (!enabled || !token) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    getMeetingRequest(meetingId, token)
      .then((nextMeeting) => {
        if (cancelled) {
          return;
        }

        setMeeting(nextMeeting);
        setLoadError("");
      })
      .catch((caughtError) => {
        if (cancelled) {
          return;
        }

        setLoadError(
          caughtError instanceof Error ? caughtError.message : "Meeting not found."
        );
        setMeeting(cachedMeeting ?? null);
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cachedMeeting, enabled, meetingId, token]);

  return {
    meeting,
    setMeeting,
    isLoading,
    loadError
  };
}
