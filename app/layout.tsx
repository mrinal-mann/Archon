import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Archon — AI Systems Architect",
    template: "%s · Archon",
  },
  description:
    "Describe your system. Archon designs it — an AI-powered collaborative canvas for system architecture.",
  applicationName: "Archon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        theme: dark,
        variables: {
          colorBackground: "#141413",
          colorInput: "#0f0f0e",
          colorForeground: "#e1e0cc",
          colorMutedForeground: "#9d9c8d",
          colorPrimary: "#dedbc8",
          colorPrimaryForeground: "#0a0a0a",
          colorDanger: "oklch(0.704 0.191 22.216)",
          borderRadius: "0.625rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased scroll-smooth`}
      >
        <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
      </html>
    </ClerkProvider>
  );
}
