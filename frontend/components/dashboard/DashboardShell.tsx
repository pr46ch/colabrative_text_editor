"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Plus, Search } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMeetings } from "@/components/providers/MeetingsProvider";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { CreateMeetingModal } from "@/components/dashboard/CreateMeetingModal";
import { MeetingCard } from "@/components/dashboard/MeetingCard";

export function DashboardShell() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { meetings } = useMeetings();
  const [createOpen, setCreateOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!user) {
      router.replace("/sign-in");
    }
  }, [router, user]);

  const filteredMeetings = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return meetings;
    }

    return meetings.filter((meeting) =>
      meeting.title.toLowerCase().includes(normalized)
    );
  }, [meetings, query]);

  if (!user) {
    return (
      <main className="grid min-h-screen place-items-center px-4">
        <div className="text-sm font-medium text-slate-600">
          Redirecting to sign in...
        </div>
      </main>
    );
  }

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white px-4 py-4 lg:w-72 lg:border-b-0 lg:border-r lg:px-6">
          <div className="flex items-center justify-between gap-4 lg:block">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-indigo-600 text-lg font-bold text-white">
                S
              </div>
              <div>
                <p className="text-lg font-bold text-slate-950">SyncPad</p>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Workspace
                </p>
              </div>
            </div>
            <Button
              className="lg:mt-8 lg:w-full"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              New
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3 lg:mt-10">
            <div className="flex items-center gap-3">
              <Avatar name={user.username} size="sm" showStatus />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {user.username}
                </p>
                <p className="text-xs text-slate-500">Signed in</p>
              </div>
            </div>
            <button
              className="grid h-9 w-9 place-items-center rounded-md text-slate-500 transition hover:bg-white hover:text-slate-900"
              onClick={handleSignOut}
              type="button"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </aside>

        <section className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase text-indigo-700">
                  Your Meetings
                </p>
                <h1 className="mt-2 text-3xl font-bold text-slate-950 sm:text-4xl">
                  Collaborative rooms
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  Open a recent room or create a new writing session with
                  invited teammates.
                </p>
              </div>
              <Button
                className="sm:w-auto"
                size="lg"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create New Meeting
              </Button>
            </div>

            <div className="mt-8 flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                placeholder="Search meetings"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredMeetings.map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            </div>

            {filteredMeetings.length === 0 ? (
              <div className="mt-10 rounded-md border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="text-sm font-medium text-slate-700">
                  No meetings found.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      </div>

      <CreateMeetingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </main>
  );
}
