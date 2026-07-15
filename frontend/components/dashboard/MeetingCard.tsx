"use client";

import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { Meeting } from "@/types";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { buttonStyles } from "@/components/ui/Button";

type MeetingCardProps = {
  meeting: Meeting;
};

export function MeetingCard({ meeting }: MeetingCardProps) {
  return (
    <Card className="flex min-h-[220px] flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-950">{meeting.title}</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-slate-500">
            <Clock3 className="h-4 w-4" aria-hidden="true" />
            <span>{meeting.lastEdited}</span>
          </div>
        </div>
        <div className="rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
          Live
        </div>
      </div>

      <div className="mt-6 flex -space-x-2">
        {meeting.participants.slice(0, 5).map((participant) => (
          <Avatar
            key={participant.username}
            name={participant.username}
            showStatus={participant.isOnline}
          />
        ))}
      </div>

      <div className="mt-4 text-sm text-slate-600">
        {meeting.participants.length} participants
      </div>

      <div className="mt-auto pt-6">
        <Link
          href={`/meeting/${meeting.id}`}
          className={buttonStyles({ variant: "outline" })}
        >
          Open
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}
