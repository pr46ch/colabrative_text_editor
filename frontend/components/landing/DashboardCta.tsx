"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";

type DashboardCtaProps = {
  label: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function DashboardCta({
  label,
  variant = "primary",
  size = "lg"
}: DashboardCtaProps) {
  const router = useRouter();
  const { user } = useAuth();

  function handleClick() {
    router.push(user ? "/dashboard" : "/sign-in");
  }

  return (
    <Button size={size} variant={variant} onClick={handleClick}>
      {label}
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
