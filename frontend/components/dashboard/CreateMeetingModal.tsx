"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useMeetings } from "@/components/providers/MeetingsProvider";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { TagInput } from "@/components/ui/TagInput";

type CreateMeetingModalProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateMeetingModal({ open, onClose }: CreateMeetingModalProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { createMeeting, isCreating } = useMeetings();
  const [title, setTitle] = useState("");
  const [invites, setInvites] = useState<string[]>([]);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      return;
    }

    const nextTitle = title.trim();
    if (!nextTitle) {
      setError("Add a document title.");
      return;
    }

    setError("");
    const meeting = await createMeeting({
      title: nextTitle,
      invitedUsernames: invites
    });

    setTitle("");
    setInvites([]);
    onClose();
    router.push(`/meeting/${meeting.id}`);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create new meeting"
      description="Start a shared writing room and invite teammates by username."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="meeting-title"
          >
            Document title
          </label>
          <input
            id="meeting-title"
            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            placeholder="Sprint planning notes"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              if (error) {
                setError("");
              }
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "meeting-title-error" : undefined}
          />
          {error ? (
            <p id="meeting-title-error" className="mt-2 text-sm text-rose-600">
              {error}
            </p>
          ) : null}
        </div>

        <TagInput
          label="Invite usernames"
          value={invites}
          onChange={setInvites}
          placeholder="Type a username and press Enter"
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isCreating}>
            <FilePlus2 className="h-4 w-4" aria-hidden="true" />
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}
