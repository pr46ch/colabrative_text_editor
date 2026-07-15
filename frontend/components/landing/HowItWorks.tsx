import { ArrowRight, FilePlus2, LogIn, UsersRound } from "lucide-react";

const steps = [
  {
    icon: LogIn,
    title: "Sign in",
    description: "Choose a username for the mock workspace."
  },
  {
    icon: FilePlus2,
    title: "Create a room",
    description: "Name the document and start a shared session."
  },
  {
    icon: UsersRound,
    title: "Invite teammates",
    description: "Add usernames and open the room together."
  }
];

export function HowItWorks() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-indigo-700">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
            From blank page to shared space
          </h2>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="relative rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="grid h-12 w-12 place-items-center rounded-md bg-slate-950 text-white">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  {index < steps.length - 1 ? (
                    <ArrowRight
                      className="hidden h-5 w-5 text-slate-300 lg:block"
                      aria-hidden="true"
                    />
                  ) : null}
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
