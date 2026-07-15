"use client";

import { ChangeEvent } from "react";

type MeetingEditorPanelProps = {
  documentText: string;
  documentVersion: number;
  socketStatus: string;
  onDocumentChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export function MeetingEditorPanel({
  documentText,
  documentVersion,
  socketStatus,
  onDocumentChange
}: MeetingEditorPanelProps) {
  const statusColor =
    socketStatus === "Connected" ? "bg-emerald-500" : "bg-amber-400";

  return (
    <section className="min-h-[calc(100vh-10rem)] rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-full min-h-[520px] flex-col rounded-md border border-slate-200 bg-slate-50">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className={["h-2 w-2 rounded-full", statusColor].join(" ")} />
            {socketStatus}
          </div>
          <div className="text-xs font-medium text-slate-400">
            Version {documentVersion}
          </div>
        </div>
        <textarea
          className="min-h-[460px] flex-1 resize-none border-0 bg-white p-5 font-mono text-sm leading-6 text-slate-950 outline-none placeholder:text-slate-400"
          value={documentText}
          onChange={onDocumentChange}
          placeholder="Start typing..."
          spellCheck
        />
      </div>
    </section>
  );
}
