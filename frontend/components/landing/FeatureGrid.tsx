import { Eye, Link2, MousePointer2, Zap } from "lucide-react";
import { Card } from "@/components/ui/Card";

const features = [
  {
    icon: Zap,
    title: "Real-time sync",
    description: "Typing, edits, and document state stay aligned across the room."
  },
  {
    icon: MousePointer2,
    title: "Live cursors",
    description: "See where teammates are working without losing your own flow."
  },
  {
    icon: Eye,
    title: "Presence at a glance",
    description: "Online indicators and participant lists keep collaboration clear."
  },
  {
    icon: Link2,
    title: "Invite by username",
    description: "Spin up a session and add collaborators with simple tags."
  }
];

export function FeatureGrid() {
  return (
    <section id="features" className="bg-white px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-indigo-700">
            Features
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
            Built for shared drafts
          </h2>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <Card key={feature.title} className="p-5">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-indigo-50 text-indigo-700">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
