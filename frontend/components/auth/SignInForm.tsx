"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, LogIn } from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function SignInForm() {
  const router = useRouter();
  const { user, register, signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [router, user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextUsername = username.trim();
    const nextPassword = password;

    if (!nextUsername) {
      setError("Enter a username to continue.");
      return;
    }

    if (nextPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await register(nextUsername, nextPassword);
      } else {
        await signIn(nextUsername, nextPassword);
      }

      router.push("/dashboard");
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Unable to sign in.";

      setError(
        message === "Invalid username or password."
          ? "Invalid username or password. If this is your first time here, create an account first."
          : message
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md p-6 sm:p-8">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to SyncPad
      </Link>

      <div>
        <p className="text-sm font-semibold uppercase text-indigo-700">
          Welcome
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-950">
          {mode === "register" ? "Create your workspace account" : "Sign in to your workspace"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Invites are matched by username. Passwords are stored as bcrypt hashes.
        </p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="username"
          >
            Username
          </label>
          <input
            id="username"
            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            placeholder="maya"
            value={username}
            onChange={(event) => {
              setUsername(event.target.value);
              if (error) {
                setError("");
              }
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "username-error" : undefined}
          />
          {error ? (
            <p id="username-error" className="mt-2 text-sm text-rose-600">
              {error}
            </p>
          ) : null}
        </div>

        <div>
          <label
            className="text-sm font-medium text-slate-800"
            htmlFor="password"
          >
            Password
          </label>
          <input
            id="password"
            className="mt-2 w-full rounded-md border border-slate-200 bg-white px-3 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
            placeholder="At least 6 characters"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) {
                setError("");
              }
            }}
            aria-invalid={Boolean(error)}
          />
        </div>

        <Button
          className="w-full"
          isLoading={isSubmitting}
          size="lg"
          type="submit"
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {mode === "register" ? "Create account" : "Sign in"}
        </Button>
      </form>

      <div className="mt-6 rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-600">
        {mode === "register" ? "Already have an account?" : "New to SyncPad?"}{" "}
        <button
          className="font-semibold text-indigo-700 transition hover:text-indigo-900"
          type="button"
          onClick={() => {
            setMode((currentMode) =>
              currentMode === "register" ? "signin" : "register"
            );
            setError("");
          }}
        >
          {mode === "register" ? "Sign in instead." : "Create an account."}
        </button>
      </div>
    </Card>
  );
}
