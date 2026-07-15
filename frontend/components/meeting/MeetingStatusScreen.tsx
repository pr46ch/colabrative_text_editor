import Link from "next/link";
import { Card } from "@/components/ui/Card";

type MeetingStatusScreenProps = {
  message: string;
  title?: string;
  actionHref?: string;
  actionLabel?: string;
};

export function MeetingStatusScreen({
  message,
  title,
  actionHref,
  actionLabel
}: MeetingStatusScreenProps) {
  if (!title) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="text-sm font-medium text-slate-600">{message}</div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4">
      <Card className="max-w-md p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">{message}</p>
        {actionHref && actionLabel ? (
          <Link
            href={actionHref}
            className="mt-6 inline-flex text-sm font-semibold text-indigo-700"
          >
            {actionLabel}
          </Link>
        ) : null}
      </Card>
    </main>
  );
}
