"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { DashboardCta } from "@/components/landing/DashboardCta";
import { buttonStyles } from "@/components/ui/Button";

type LandingHeaderProps = {
  githubUrl: string;
};

export function LandingHeader({ githubUrl }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-indigo-600 text-lg font-bold text-white">
            S
          </div>
          <span className="text-lg font-bold text-slate-950">SyncPad</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
          <a className="transition hover:text-indigo-700" href="#features">
            Features
          </a>
          <a
            className="transition hover:text-indigo-700"
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
          >
            GitHub
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <a
            className={buttonStyles({ variant: "outline", size: "sm" })}
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
          >
            <Github className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <DashboardCta label="Dashboard" size="sm" />
        </div>
      </div>
    </header>
  );
}
