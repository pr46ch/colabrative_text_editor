"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMeetings } from "@/components/providers/MeetingsProvider";
import { MeetingEditorPanel } from "@/components/meeting/MeetingEditorPanel";
import { MeetingRoomHeader } from "@/components/meeting/MeetingRoomHeader";
import { MeetingStatusScreen } from "@/components/meeting/MeetingStatusScreen";
import { ParticipantsSidebar } from "@/components/meeting/ParticipantsSidebar";
import { useCollaborativeDocument } from "@/components/meeting/useCollaborativeDocument";
import { useMeetingData } from "@/components/meeting/useMeetingData";
import { Participant } from "@/types";

type MeetingRoomProps = {
  meetingId: string;
};

export function MeetingRoom({ meetingId }: MeetingRoomProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { meetings } = useMeetings();
  const [copied, setCopied] = useState(false);

  const cachedMeeting = useMemo(
    () => meetings.find((candidate) => candidate.id === meetingId),
    [meetings, meetingId]
  );

  const { meeting, setMeeting, isLoading, loadError } = useMeetingData({
    meetingId,
    cachedMeeting,
    enabled: Boolean(user),
    token: user?.token
  });

  const handleParticipantsChange = useCallback(
    (participants: Participant[]) => {
      setMeeting((currentMeeting) =>
        currentMeeting ? { ...currentMeeting, participants } : currentMeeting
      );
    },
    [setMeeting]
  );

  const documentState = useCollaborativeDocument({
    meetingId,
    meeting,
    user,
    onParticipantsChange: handleParticipantsChange
  });

  useEffect(() => {
    if (!user) {
      router.replace("/sign-in");
    }
  }, [router, user]);

  useEffect(() => {
    if (!copied) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeoutId);
  }, [copied]);

  const handleCopyInvite = useCallback(() => {
    const inviteUrl = `${window.location.origin}/meeting/${meetingId}`;

    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(inviteUrl);
    }

    setCopied(true);
  }, [meetingId]);

  if (!user) {
    return <MeetingStatusScreen message="Redirecting to sign in..." />;
  }

  if (isLoading && !meeting) {
    return <MeetingStatusScreen message="Loading meeting..." />;
  }

  if (!meeting) {
    return (
      <MeetingStatusScreen
        title="Meeting not found"
        message={loadError || "Create or open a backend meeting from the dashboard."}
        actionHref="/dashboard"
        actionLabel="Back to dashboard"
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <MeetingRoomHeader
        meeting={meeting}
        copied={copied}
        onCopyInvite={handleCopyInvite}
      />

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_20rem] lg:px-8">
        <MeetingEditorPanel
          documentText={documentState.documentText}
          documentVersion={documentState.documentVersion}
          socketStatus={documentState.socketStatus}
          editorRef={documentState.editorRef}
          onDocumentChange={documentState.handleEditorChange}
        />
        <ParticipantsSidebar participants={meeting.participants} />
      </div>
    </main>
  );
}
