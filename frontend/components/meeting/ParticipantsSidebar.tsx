import { Avatar } from "@/components/ui/Avatar";
import { Participant } from "@/types";

type ParticipantsSidebarProps = {
  participants: Participant[];
};

export function ParticipantsSidebar({ participants }: ParticipantsSidebarProps) {
  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-sm font-semibold uppercase text-slate-500">
        Participants
      </h2>
      <div className="mt-5 space-y-3">
        {participants.map((participant) => (
          <div
            key={participant.username}
            className="flex items-center justify-between gap-3 rounded-md border border-slate-100 bg-slate-50 p-3"
          >
            <div className="flex items-center gap-3">
              <Avatar
                name={participant.username}
                size="sm"
                showStatus={participant.isOnline}
              />
              <span className="text-sm font-semibold text-slate-800">
                {participant.username}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              {participant.isOnline ? "Online" : "Away"}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
