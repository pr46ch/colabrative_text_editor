import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { MeetingsProvider } from "@/components/providers/MeetingsProvider";

export const metadata: Metadata = {
  title: "SyncPad | Collaborative Text Editor",
  description: "A polished frontend prototype for real-time collaborative editing."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <MeetingsProvider>{children}</MeetingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
