"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import { Almarai } from "next/font/google"
import Link from "next/link"
import { ArrowLeft, Sparkles, Users, FileDown } from "lucide-react"
import { ArchonLogo } from "@/components/brand/archon-logo"

const almarai = Almarai({
  subsets: ["latin"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
})

const FONT = "var(--font-almarai),sans-serif"
const CREAM = "#E1E0CC"
const ACCENT = "#DEDBC8"

// ─── Mini animated node graphic ───────────────────────────────────────────────

const VB = { w: 320, h: 220 }
const NODES = [
  { id: "a", x: 60, y: 50, tone: "#C6B8DB" },
  { id: "b", x: 160, y: 110, tone: "#DEDBC8" },
  { id: "c", x: 60, y: 170, tone: "#9DB4C0" },
  { id: "d", x: 260, y: 60, tone: "#C9D7B0" },
  { id: "e", x: 260, y: 160, tone: "#D9B8A0" },
]
const EDGES: Array<[string, string]> = [
  ["a", "b"],
  ["c", "b"],
  ["b", "d"],
  ["b", "e"],
]
const node = (id: string) => NODES.find((n) => n.id === id)!

function NodeGraphic() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false })
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!inView) return
    const iv = setInterval(() => setCycle((c) => c + 1), 7000)
    return () => clearInterval(iv)
  }, [inView])

  return (
    <div ref={ref} key={cycle} className="relative w-full max-w-sm" style={{ aspectRatio: "320 / 220" }}>
      <svg className="absolute inset-0 w-full h-full" viewBox={`0 0 ${VB.w} ${VB.h}`} preserveAspectRatio="none">
        {EDGES.map(([s, t], i) => {
          const a = node(s)
          const b = node(t)
          return (
            <g key={`${s}-${t}`}>
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="rgba(222,219,200,0.15)" strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <motion.line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="rgba(222,219,200,0.5)" strokeWidth={1.2}
                vectorEffect="non-scaling-stroke"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.7, delay: 0.6 + i * 0.18, ease: "easeInOut" }}
              />
            </g>
          )
        })}
      </svg>
      {NODES.map((n, i) => (
        <motion.span
          key={n.id}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-md"
          style={{
            left: `${(n.x / VB.w) * 100}%`,
            top: `${(n.y / VB.h) * 100}%`,
            width: 14,
            height: 14,
            background: "#1A1A1A",
            border: `1.5px solid ${n.tone}`,
            boxShadow: `0 0 12px ${n.tone}44`,
          }}
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: [0.4, 1.15, 1] }}
          transition={{ delay: 0.2 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </div>
  )
}

// ─── Auth Shell ───────────────────────────────────────────────────────────────

const FEATURES = [
  { Icon: Sparkles, text: "AI-powered system design canvas" },
  { Icon: Users, text: "Real-time collaborative diagramming" },
  { Icon: FileDown, text: "Export to production-ready specs" },
]

const COPY = {
  "sign-in": {
    eyebrow: "Welcome back",
    heading: "Pick up where your architecture left off.",
    formTitle: "Sign in to Archon",
    switchText: "New to Archon?",
    switchCta: "Create an account",
    switchHref: "/sign-up",
  },
  "sign-up": {
    eyebrow: "Get started",
    heading: "Design systems that think with you.",
    formTitle: "Create your account",
    switchText: "Already have an account?",
    switchCta: "Sign in",
    switchHref: "/sign-in",
  },
} as const

export function AuthShell({
  mode,
  children,
}: {
  mode: "sign-in" | "sign-up"
  children: React.ReactNode
}) {
  const copy = COPY[mode]

  return (
    <div className={`${almarai.variable} min-h-screen flex bg-black`} style={{ color: CREAM }}>

      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 xl:p-16">
        {/* dot grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(rgba(222,219,200,0.06) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        {/* warm glow */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(222,219,200,0.06), transparent 70%)" }}
        />
        {/* noise */}
        <div className="bg-noise absolute inset-0 opacity-[0.1] pointer-events-none" />

        {/* Top — wordmark */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center gap-2.5"
        >
          <ArchonLogo size={24} style={{ color: CREAM }} />
          <span className="text-lg font-bold tracking-[0.25em]" style={{ fontFamily: FONT }}>
            ARCHON
          </span>
        </motion.div>

        {/* Middle — heading + graphic */}
        <div className="relative">
          <motion.p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: ACCENT, fontFamily: FONT }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            {copy.eyebrow}
          </motion.p>
          <motion.h1
            className="text-3xl xl:text-4xl font-normal leading-[1.05] max-w-md mb-10"
            style={{ color: CREAM, fontFamily: FONT }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {copy.heading}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
          >
            <NodeGraphic />
          </motion.div>
        </div>

        {/* Bottom — feature bullets */}
        <div className="relative flex flex-col gap-3">
          {FEATURES.map(({ Icon, text }, i) => (
            <motion.div
              key={text}
              className="flex items-center gap-3 text-sm"
              style={{ color: "rgba(225,224,204,0.65)", fontFamily: FONT }}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span
                className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                style={{ background: "rgba(222,219,200,0.07)" }}
              >
                <Icon size={14} color={ACCENT} />
              </span>
              {text}
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div className="relative flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-10">
        {/* subtle grid on mobile/right */}
        <div
          className="absolute inset-0 pointer-events-none lg:hidden"
          style={{
            backgroundImage: "radial-gradient(rgba(222,219,200,0.05) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />

        <motion.div
          className="relative w-full max-w-md flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Back to home */}
          <div className="w-full mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: "rgba(225,224,204,0.45)", fontFamily: FONT }}
              onMouseEnter={(e) => (e.currentTarget.style.color = CREAM)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225,224,204,0.45)")}
            >
              <ArrowLeft size={13} /> Back to home
            </Link>
          </div>

          {/* Mobile wordmark */}
          <div className="lg:hidden w-full mb-4 flex items-center gap-2.5">
            <ArchonLogo size={22} style={{ color: CREAM }} />
            <span className="text-base font-bold tracking-[0.25em]" style={{ fontFamily: FONT, color: CREAM }}>
              ARCHON
            </span>
          </div>

          {/* Heading */}
          <div className="w-full mb-6">
            <h2 className="text-2xl font-medium" style={{ color: CREAM, fontFamily: FONT }}>
              {copy.formTitle}
            </h2>
            <p className="text-sm mt-1.5" style={{ color: "rgba(225,224,204,0.5)", fontFamily: FONT }}>
              {copy.switchText}{" "}
              <Link
                href={copy.switchHref}
                className="underline underline-offset-2 transition-colors"
                style={{ color: ACCENT }}
              >
                {copy.switchCta}
              </Link>
            </p>
          </div>

          {/* Clerk form (themed via ClerkProvider appearance) */}
          <div className="w-full flex justify-center">{children}</div>
        </motion.div>
      </div>
    </div>
  )
}
