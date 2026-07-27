"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMeetings } from "@/components/providers/MeetingsProvider";
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

  const cachedMeeting = meetings.find((meeting) => meeting.id === meetingId);

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

  function handleCopyInvite() {
    const inviteUrl = `${window.location.origin}/meeting/${meetingId}`;

    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(inviteUrl);
    }

    setCopied(true);
  }

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

  const statusColor =
    documentState.socketStatus === "Connected"
      ? "bg-emerald-500"
      : "bg-amber-400";

  return (
    <main className="min-h-screen bg-slate-50">
      <MeetingRoomHeader
        meeting={meeting}
        copied={copied}
        onCopyInvite={handleCopyInvite}
      />

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_20rem] lg:px-8">
        <section className="min-h-[calc(100vh-10rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex h-full min-h-[520px] flex-col rounded-md border border-slate-200 bg-slate-50">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <span className={`h-2 w-2 rounded-full ${statusColor}`} />
                {documentState.socketStatus}
              </div>
              <div className="text-xs font-medium text-slate-400">
                Version {documentState.documentVersion}
              </div>
            </div>
            <textarea
              ref={documentState.editorRef}
              className="min-h-[460px] flex-1 resize-none border-0 bg-white p-5 font-mono text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400"
              value={documentState.documentText}
              onBeforeInput={documentState.handleEditorBeforeInput}
              onChange={documentState.handleEditorChange}
              placeholder="Start typing..."
              spellCheck
            />
          </div>
        </section>
        <ParticipantsSidebar participants={meeting.participants} />
      </div>
    </main>
  );
}
