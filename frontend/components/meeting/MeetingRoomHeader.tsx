"use client";

import Link from "next/link";
import { ArrowLeft, Check, Clipboard } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Meeting } from "@/types";

type MeetingRoomHeaderProps = {
  meeting: Meeting;
  copied: boolean;
  onCopyInvite: () => void;
};

export function MeetingRoomHeader({
  meeting,
  copied,
  onCopyInvite
}: MeetingRoomHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard"
            className="mt-1 grid h-9 w-9 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            aria-label="Back to dashboard"
            title="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <div>
            <p className="text-xs font-semibold uppercase text-indigo-700">
              Meeting room
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">
              {meeting.title}
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex -space-x-2">
            {meeting.participants.map((participant) => (
              <Avatar
                key={participant.username}
                name={participant.username}
                showStatus={participant.isOnline}
              />
            ))}
          </div>
          <Button variant="outline" onClick={onCopyInvite}>
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Clipboard className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy invite link"}
          </Button>
        </div>
      </div>
    </header>
  );
}
