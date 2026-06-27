import { SignUp } from "@clerk/nextjs";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata = {
  title: "Create account",
  description: "Create your Archon account and design systems with AI.",
};

export default function SignUpPage() {
  return (
    <AuthShell mode="sign-up">
      <SignUp
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
