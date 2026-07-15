import { SignInForm } from "@/components/auth/SignInForm";
import { EditorMockup } from "@/components/landing/EditorMockup";

export default function SignInPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <SignInForm />
        <div className="hidden lg:block">
          <EditorMockup compact />
        </div>
      </div>
    </main>
  );
}
