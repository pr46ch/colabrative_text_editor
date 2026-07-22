import { Github } from "lucide-react";
import { buttonStyles } from "@/components/ui/Button";

export function LandingFooter() {
  return (
    <footer className="flex justify-center px-4 py-8">
      <a
        className={buttonStyles({ variant: "outline", size: "sm" })}
        href="https://github.com/pr46ch"
        target="_blank"
        rel="noreferrer"
      >
        <Github className="h-4 w-4" aria-hidden="true" />
        pr46ch
      </a>
    </footer>
  );
}
