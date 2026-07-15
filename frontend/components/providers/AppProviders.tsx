"use client";

import { AuthProvider } from "@/components/providers/AuthProvider";
import { MeetingsProvider } from "@/components/providers/MeetingsProvider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthProvider>
      <MeetingsProvider>{children}</MeetingsProvider>
    </AuthProvider>
  );
}
