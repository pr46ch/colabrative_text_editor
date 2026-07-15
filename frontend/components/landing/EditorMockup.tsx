import { MousePointer2 } from "lucide-react";

type EditorMockupProps = {
  compact?: boolean;
};

const lineBlocks = [
  { width: "w-11/12", color: "bg-slate-800" },
  { width: "w-4/5", color: "bg-slate-500" },
  { width: "w-10/12", color: "bg-slate-300" },
  { width: "w-7/12", color: "bg-indigo-300" },
  { width: "w-9/12", color: "bg-slate-300" },
  { width: "w-5/6", color: "bg-emerald-300" }
];

export function EditorMockup({ compact = false }: EditorMockupProps) {
  return (
    <div
      className={[
        "relative rounded-lg border border-slate-200 bg-white shadow-soft",
        compact ? "p-4" : "p-3 sm:p-4"
      ].join(" ")}
      aria-label="SyncPad editor preview"
    >
      <div className="rounded-md border border-slate-200 bg-slate-950 p-3">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-slate-300 sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            4 editing now
          </div>
        </div>

        <div className="grid gap-4 pt-4 lg:grid-cols-[1fr_11rem]">
          <div className="min-h-[320px] rounded-md bg-white p-5">
            <div className="mb-6 h-7 w-2/3 rounded-md bg-slate-900" />
            <div className="space-y-4">
              {lineBlocks.map((block, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-4 w-7 rounded bg-slate-100" />
                  <div
                    className={[
                      "h-3 rounded-full",
                      block.width,
                      block.color
                    ].join(" ")}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border border-indigo-100 bg-indigo-50 p-3">
                <div className="h-3 w-24 rounded-full bg-indigo-300" />
                <div className="mt-3 h-3 w-full rounded-full bg-white" />
                <div className="mt-2 h-3 w-4/5 rounded-full bg-white" />
              </div>
              <div className="rounded-md border border-emerald-100 bg-emerald-50 p-3">
                <div className="h-3 w-20 rounded-full bg-emerald-300" />
                <div className="mt-3 h-3 w-full rounded-full bg-white" />
                <div className="mt-2 h-3 w-3/4 rounded-full bg-white" />
              </div>
            </div>

            <div className="absolute left-10 top-36 hidden sm:block">
              <div className="flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-semibold text-white shadow-lg">
                <MousePointer2 className="h-3 w-3" aria-hidden="true" />
                Maya
              </div>
            </div>
            <div className="absolute bottom-24 right-12 hidden sm:block">
              <div className="flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white shadow-lg">
                <MousePointer2 className="h-3 w-3" aria-hidden="true" />
                Jules
              </div>
            </div>
          </div>

          <div className="hidden rounded-md bg-white/5 p-3 lg:block">
            <p className="text-xs font-semibold uppercase text-slate-400">
              Room
            </p>
            <div className="mt-4 space-y-3">
              {["Maya", "Jules", "Nia", "Owen"].map((name, index) => (
                <div
                  key={name}
                  className="flex items-center gap-2 rounded-md bg-white/10 p-2"
                >
                  <span
                    className={[
                      "grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white",
                      index === 0
                        ? "bg-indigo-500"
                        : index === 1
                          ? "bg-emerald-500"
                          : index === 2
                            ? "bg-fuchsia-500"
                            : "bg-amber-500"
                    ].join(" ")}
                  >
                    {name[0]}
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
