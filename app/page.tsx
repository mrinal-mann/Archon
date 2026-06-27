import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { LandingPage } from "@/components/landing/landing-page"

export const metadata = {
  title: { absolute: "Archon — Design systems with AI" },
  description:
    "Describe your system. Archon designs it. The AI-powered collaborative canvas for system architecture.",
}

export default async function Home() {
  const { userId } = await auth()
  if (userId) redirect("/editor")
  return <LandingPage />
}
