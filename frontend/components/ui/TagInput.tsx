"use client";

import { KeyboardEvent, useState } from "react";
import { X } from "lucide-react";

type TagInputProps = {
  label: string;
  value: string[];
  onChange: (nextValue: string[]) => void;
  placeholder?: string;
};

export function TagInput({
  label,
  value,
  onChange,
  placeholder
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  function addTag(rawTag: string) {
    const nextTag = rawTag.trim().replace(/^@/, "");

    if (!nextTag || value.includes(nextTag)) {
      return;
    }

    onChange([...value, nextTag]);
    setDraft("");
  }

  function removeTag(tag: string) {
    onChange(value.filter((existingTag) => existingTag !== tag));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draft);
    }

    if (event.key === "Backspace" && !draft && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  }

  return (
    <div>
      <label className="text-sm font-medium text-slate-800">{label}</label>
      <div className="mt-2 flex min-h-12 flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-2 focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-100">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex min-h-8 items-center gap-1 rounded-md bg-indigo-50 px-2 text-sm font-medium text-indigo-700"
          >
            @{tag}
            <button
              type="button"
              className="grid h-5 w-5 place-items-center rounded text-indigo-500 transition hover:bg-indigo-100 hover:text-indigo-800"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              title={`Remove ${tag}`}
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          className="min-w-[12rem] flex-1 border-0 bg-transparent px-1 py-1 text-sm text-slate-950 outline-none placeholder:text-slate-400"
          placeholder={value.length === 0 ? placeholder : undefined}
          value={draft}
          onBlur={() => addTag(draft)}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
