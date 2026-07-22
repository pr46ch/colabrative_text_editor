import { DashboardCta } from "@/components/landing/DashboardCta";
import { EditorMockup } from "@/components/landing/EditorMockup";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { buttonStyles } from "@/components/ui/Button";

const githubUrl = "https://github.com/pr46ch/colabrative_text_editor";

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <LandingHeader />

      <section className="relative px-4 pb-20 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-md border border-indigo-100 bg-white px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Live documents for focused teams
            </div>
            <h1 className="max-w-3xl text-5xl font-bold leading-[1.06] text-slate-950 sm:text-6xl lg:text-7xl">
              Write together, in real time
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              SyncPad gives fast-moving teams a shared writing room with live
              presence, clear invites, and just enough structure to keep every
              draft moving.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <DashboardCta label="Try it now" />
              <a
                className={buttonStyles({ variant: "outline", size: "lg" })}
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
              >
                View GitHub
              </a>
            </div>
          </div>

          <EditorMockup />
        </div>
      </section>

      <FeatureGrid />
      <HowItWorks />
      <LandingFooter />
    </main>
  );
}
