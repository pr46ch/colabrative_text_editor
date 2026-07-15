type LandingFooterProps = {
  githubUrl: string;
};

export function LandingFooter({ githubUrl }: LandingFooterProps) {
  return (
    <footer className="border-t border-slate-200 bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Copyright 2026 SyncPad. All rights reserved.</p>
        <a
          className="font-medium text-slate-700 transition hover:text-indigo-700"
          href={githubUrl}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>
    </footer>
  );
}
