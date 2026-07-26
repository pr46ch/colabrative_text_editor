import { Copy, Users } from "lucide-react";
import { TeacherTypingText } from "@/components/landing/TeacherTypingText";

type EditorMockupProps = {
  compact?: boolean;
};

const participants = [
  { name: "Teacher", color: "bg-indigo-500" },
  { name: "Student", color: "bg-emerald-500" },
  { name: "Nia", color: "bg-fuchsia-500" }
];

export function EditorMockup({ compact = false }: EditorMockupProps) {
  return (
    <div
      className={[
        "rounded-lg border border-slate-200 bg-white shadow-soft",
        compact ? "p-4" : "p-3 sm:p-4"
      ].join(" ")}
      aria-label="SyncPad meeting room preview"
    >
      <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Product planning notes
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Shared meeting room
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Connected
            </span>
            <span className="hidden sm:inline">Version 24</span>
          </div>
        </div>

        <div className="grid gap-3 p-3 lg:grid-cols-[1fr_11rem]">
          <div className="min-h-[310px] rounded-md border border-slate-200 bg-white p-5 text-black">
            <p className="text-sm font-semibold leading-7 text-black">
              Product planning notes
            </p>
            <p className="mt-4 text-sm leading-7 text-black">
              Keep the editing flow simple, make collaboration obvious, and
              agree on the work before Friday.
            </p>
            <p className="mt-4 text-sm leading-7 text-black">
              <span className="font-medium">Teacher:</span>{" "}
              <TeacherTypingText />
            </p>
            <p className="mt-4 text-sm leading-7 text-black">
              <span className="font-medium">Student:</span>{" "}
              The server transforms concurrent edits so every collaborator sees
              the same document.
              <span
                className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-emerald-500 align-[-2px]"
                aria-hidden="true"
              />
            </p>
          </div>

          <aside className="rounded-md border border-slate-200 bg-white p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Users className="h-4 w-4" aria-hidden="true" />
              Participants
            </div>
            <div className="mt-3 space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.name}
                  className="flex items-center gap-2 rounded-md bg-slate-50 p-2"
                >
                  <span
                    className={[
                      "grid h-7 w-7 place-items-center rounded-full text-xs font-semibold text-white",
                      participant.color
                    ].join(" ")}
                  >
                    {participant.name[0]}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-slate-800">
                      {participant.name}
                    </p>
                    <p className="text-[11px] text-emerald-600">Online</p>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="mt-4 flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-2 text-xs font-medium text-slate-600"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              Copy invite
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
