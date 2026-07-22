"use client";

import Link from "next/link";
import { buttonStyles } from "@/components/ui/Button";

export function LandingHeader() {
  return (
    <Link
      href="/"
      className={[
        buttonStyles({ variant: "primary", size: "sm" }),
        "absolute left-4 top-4 z-30 sm:left-6 lg:left-8"
      ].join(" ")}
      aria-label="Open the SyncPad home page"
    >
      SyncPad
    </Link>
  );
}
