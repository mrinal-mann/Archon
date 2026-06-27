import { SignIn } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = {
  title: "Sign in",
  description: "Sign in to Archon — your AI systems architect.",
};

export default function SignInPage() {
  return (
    <AuthShell mode="sign-in">
      <SignIn
        appearance={{
          elements: {
            rootBox: "w-full flex justify-center",
            cardBox: "shadow-none",
            card: "bg-transparent shadow-none border-none p-0",
            header: "hidden",
            footer: "hidden",
          },
        }}
      />
    </AuthShell>
  );
}
