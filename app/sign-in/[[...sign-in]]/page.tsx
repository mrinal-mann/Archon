import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex h-screen bg-background">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center px-16 border-r border-border">
        <div className="mb-8">
          <span className="text-lg font-semibold text-foreground">Archon </span>
        </div>
        <p className="text-muted-foreground text-sm mb-8">
          Design systems that think with you.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>AI-powered system design canvas</li>
          <li>Collaborative diagramming in real time</li>
          <li>Export to production-ready specs</li>
        </ul>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center">
        <SignIn />
      </div>
    </div>
  );
}
