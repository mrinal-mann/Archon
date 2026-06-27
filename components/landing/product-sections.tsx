"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useInView } from "framer-motion"
import {
  ArrowRight,
  Sparkles,
  Users,
  ShieldCheck,
  Zap,
  GitBranch,
  FileDown,
  MessageSquare,
  Boxes,
} from "lucide-react"
import Link from "next/link"

const FONT = "var(--font-almarai),sans-serif"
const CREAM = "#E1E0CC"
const ACCENT = "#DEDBC8"

// ─── Section heading (fade-up) ────────────────────────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

function Typewriter({
  text,
  start = 0,
  speed = 42,
}: {
  text: string
  start?: number
  speed?: number
}) {
  const [n, setN] = useState(0)
  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined
    const t = setTimeout(() => {
      let i = 0
      iv = setInterval(() => {
        i += 1
        setN(i)
        if (i >= text.length && iv) clearInterval(iv)
      }, speed)
    }, start * 1000)
    return () => {
      clearTimeout(t)
      if (iv) clearInterval(iv)
    }
  }, [text, start, speed])
  return <>{text.slice(0, n)}</>
}

// ─── Animated diagram demo ("video" replacement) ──────────────────────────────

type DemoNode = { id: string; x: number; y: number; label: string; tone: string }

// Coordinates live in a 400 × 240 space; rendered as % so SVG edges + node
// cards share the same fractional grid.
const VB_W = 400
const VB_H = 240

const DEMO_NODES: DemoNode[] = [
  { id: "client", x: 34, y: 120, label: "Client", tone: "#9DB4C0" },
  { id: "gateway", x: 140, y: 120, label: "API Gateway", tone: "#DEDBC8" },
  { id: "auth", x: 252, y: 50, label: "Auth", tone: "#C6B8DB" },
  { id: "orders", x: 252, y: 120, label: "Orders", tone: "#DEDBC8" },
  { id: "pay", x: 252, y: 190, label: "Payments", tone: "#C9D7B0" },
  { id: "db", x: 360, y: 120, label: "Database", tone: "#D9B8A0" },
]

const DEMO_EDGES: Array<[string, string]> = [
  ["client", "gateway"],
  ["gateway", "auth"],
  ["gateway", "orders"],
  ["gateway", "pay"],
  ["auth", "db"],
  ["orders", "db"],
  ["pay", "db"],
]

const byId = (id: string) => DEMO_NODES.find((n) => n.id === id)!

const NODES_START = 1.2
const NODE_STAGGER = 0.12
const EDGES_START = NODES_START + DEMO_NODES.length * NODE_STAGGER + 0.2
const EDGE_STAGGER = 0.1
const SPEC_AT = EDGES_START + DEMO_EDGES.length * EDGE_STAGGER + 0.4
const CYCLE_MS = 9500

function DiagramDemo() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: false, margin: "-80px" })
  const [cycle, setCycle] = useState(0)

  useEffect(() => {
    if (!inView) return
    const iv = setInterval(() => setCycle((c) => c + 1), CYCLE_MS)
    return () => clearInterval(iv)
  }, [inView])

  return (
    <div
      ref={ref}
      className="relative w-full rounded-2xl md:rounded-[1.75rem] overflow-hidden"
      style={{ backgroundColor: "#0D0D0D", border: "1px solid rgba(222,219,200,0.1)" }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: "1px solid rgba(222,219,200,0.08)" }}
      >
        <span className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(222,219,200,0.25)" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(222,219,200,0.18)" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "rgba(222,219,200,0.12)" }} />
        </span>
        <span
          className="mx-auto text-[10px] sm:text-xs px-3 py-1 rounded-md"
          style={{
            color: "rgba(225,224,204,0.4)",
            background: "rgba(222,219,200,0.05)",
            fontFamily: FONT,
          }}
        >
          archon.app / editor
        </span>
      </div>

      {/* Body: prompt + canvas */}
      <div key={cycle} className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Prompt column */}
        <div
          className="p-5 sm:p-6 flex flex-col gap-4"
          style={{ borderRight: "1px solid rgba(222,219,200,0.06)" }}
        >
          <span
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "rgba(225,224,204,0.35)", fontFamily: FONT }}
          >
            Prompt
          </span>
          <div
            className="rounded-xl p-3.5 text-xs sm:text-sm min-h-[88px]"
            style={{
              background: "rgba(222,219,200,0.04)",
              border: "1px solid rgba(222,219,200,0.08)",
              color: CREAM,
              fontFamily: FONT,
              lineHeight: 1.5,
            }}
          >
            <Typewriter
              text="Design an e-commerce backend with auth, orders, payments and a shared database."
              speed={28}
            />
            <motion.span
              className="inline-block w-[2px] h-3.5 ml-0.5 align-middle"
              style={{ background: ACCENT }}
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
            />
          </div>

          {/* Archon working indicator */}
          <motion.div
            className="flex items-center gap-2 text-xs"
            style={{ color: "rgba(225,224,204,0.6)", fontFamily: FONT }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0.7] }}
            transition={{ duration: SPEC_AT, times: [0, 0.18, 0.85, 1] }}
          >
            <motion.span
              className="inline-flex"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles size={13} color={ACCENT} />
            </motion.span>
            Archon is designing…
          </motion.div>

          {/* Spec generated chip */}
          <motion.div
            className="mt-auto flex items-center gap-2 text-xs rounded-lg px-3 py-2 w-fit"
            style={{
              background: "rgba(201,215,176,0.1)",
              border: "1px solid rgba(201,215,176,0.25)",
              color: "#C9D7B0",
              fontFamily: FONT,
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: SPEC_AT, duration: 0.5 }}
          >
            <FileDown size={13} /> Spec generated
          </motion.div>
        </div>

        {/* Canvas column */}
        <div
          className="relative"
          style={{
            aspectRatio: "400 / 240",
            backgroundImage:
              "radial-gradient(rgba(222,219,200,0.07) 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        >
          {/* Edges */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 ${VB_W} ${VB_H}`}
            preserveAspectRatio="none"
          >
            {DEMO_EDGES.map(([s, t], i) => {
              const a = byId(s)
              const b = byId(t)
              const delay = EDGES_START + i * EDGE_STAGGER
              return (
                <g key={`${s}-${t}`}>
                  {/* Permanent rail — keeps the connection visible at all times */}
                  <motion.line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(222,219,200,0.18)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay }}
                  />
                  {/* Brighter line that draws along the rail */}
                  <motion.line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="rgba(222,219,200,0.55)"
                    strokeWidth={1.2}
                    vectorEffect="non-scaling-stroke"
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay, ease: "easeInOut" }}
                  />
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {DEMO_NODES.map((n, i) => (
            <motion.div
              key={n.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md text-[9px] sm:text-[11px] whitespace-nowrap"
              style={{
                left: `${(n.x / VB_W) * 100}%`,
                top: `${(n.y / VB_H) * 100}%`,
                background: "#1A1A1A",
                border: `1px solid ${n.tone}55`,
                color: CREAM,
                fontFamily: FONT,
                boxShadow: `0 0 0 1px ${n.tone}11`,
              }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: NODES_START + i * NODE_STAGGER,
                duration: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                style={{ background: n.tone }}
              />
              {n.label}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── How It Works ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "01",
    title: "Describe it",
    body: "Type what you want to build in plain English. No diagramming knowledge required — just describe the system.",
  },
  {
    n: "02",
    title: "Archon designs it",
    body: "Watch the AI agent place nodes, connect services, and lay out your architecture live on the canvas in real time.",
  },
  {
    n: "03",
    title: "Refine & export",
    body: "Iterate with follow-up prompts, collaborate with your team, then generate a full technical spec in one click.",
  },
]

export function HowItWorksSection() {
  return (
    <section id="how" className="scroll-mt-20 bg-black px-4 md:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="text-center mb-4">
          <span
            className="text-[10px] sm:text-xs uppercase tracking-widest"
            style={{ color: ACCENT, fontFamily: FONT }}
          >
            See it in motion
          </span>
        </FadeUp>
        <FadeUp delay={0.05} className="text-center mb-12 md:mb-16">
          <h2
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal max-w-2xl mx-auto leading-tight"
            style={{ color: CREAM, fontFamily: FONT }}
          >
            From a sentence to a system, in seconds.
          </h2>
        </FadeUp>

        {/* Animated demo */}
        <FadeUp delay={0.1}>
          <DiagramDemo />
        </FadeUp>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-12 md:mt-16">
          {STEPS.map((s, i) => (
            <FadeUp key={s.n} delay={0.1 + i * 0.1}>
              <div className="flex flex-col gap-3">
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "rgba(225,224,204,0.3)", fontFamily: FONT }}
                >
                  {s.n}
                </span>
                <h3
                  className="text-lg sm:text-xl font-medium"
                  style={{ color: CREAM, fontFamily: FONT }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(225,224,204,0.5)", fontFamily: FONT }}
                >
                  {s.body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Capabilities ─────────────────────────────────────────────────────────────

const CAPS = [
  {
    Icon: Sparkles,
    title: "AI design agent",
    body: "Powered by a reasoning model that understands architecture patterns — microservices, event-driven, monoliths and more.",
  },
  {
    Icon: Users,
    title: "Real-time collaboration",
    body: "Live cursors, presence, and shared canvas state. Design alongside your whole team, no refresh required.",
  },
  {
    Icon: MessageSquare,
    title: "Conversational refinement",
    body: "Chat with Archon to evolve the diagram. Every follow-up prompt updates the canvas in place.",
  },
  {
    Icon: GitBranch,
    title: "Smart architecture review",
    body: "Surface bottlenecks, single points of failure, and best-practice improvements automatically.",
  },
  {
    Icon: FileDown,
    title: "One-click specs",
    body: "Turn any diagram into a complete technical specification, exportable as Markdown or PDF.",
  },
  {
    Icon: ShieldCheck,
    title: "Private by default",
    body: "Your canvas data and generated specs are stored privately and never exposed publicly.",
  },
]

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="scroll-mt-20 bg-black px-4 md:px-8 py-20 md:py-28">
      <div className="max-w-6xl mx-auto">
        <FadeUp className="mb-12 md:mb-16 max-w-2xl">
          <span
            className="text-[10px] sm:text-xs uppercase tracking-widest"
            style={{ color: ACCENT, fontFamily: FONT }}
          >
            Everything you need
          </span>
          <h2
            className="text-2xl sm:text-3xl md:text-4xl font-normal mt-4 leading-tight"
            style={{ color: CREAM, fontFamily: FONT }}
          >
            A complete studio for designing systems with intelligence.
          </h2>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden"
          style={{ background: "rgba(222,219,200,0.08)" }}
        >
          {CAPS.map(({ Icon, title, body }, i) => (
            <FadeUp key={title} delay={(i % 3) * 0.08}>
              <div
                className="h-full p-6 md:p-8 flex flex-col gap-4"
                style={{ backgroundColor: "#0A0A0A" }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(222,219,200,0.07)" }}
                >
                  <Icon size={17} color={ACCENT} />
                </div>
                <h3
                  className="text-base sm:text-lg font-medium"
                  style={{ color: CREAM, fontFamily: FONT }}
                >
                  {title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(225,224,204,0.5)", fontFamily: FONT }}
                >
                  {body}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

const STATS = [
  { value: "< 5s", label: "From prompt to diagram" },
  { value: "6+", label: "Architecture patterns" },
  { value: "∞", label: "Real-time collaborators" },
  { value: "1-click", label: "Spec generation" },
]

export function StatsStrip() {
  return (
    <section
      className="bg-black px-4 md:px-8 py-14 md:py-16"
      style={{ borderTop: "1px solid rgba(222,219,200,0.06)", borderBottom: "1px solid rgba(222,219,200,0.06)" }}
    >
      <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((s, i) => (
          <FadeUp key={s.label} delay={i * 0.08} className="text-center">
            <div
              className="text-3xl sm:text-4xl md:text-5xl font-medium"
              style={{ color: CREAM, fontFamily: FONT }}
            >
              {s.value}
            </div>
            <div
              className="text-xs sm:text-sm mt-2"
              style={{ color: "rgba(225,224,204,0.4)", fontFamily: FONT }}
            >
              {s.label}
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  )
}

// ─── Final CTA ────────────────────────────────────────────────────────────────

export function CTASection() {
  return (
    <section className="bg-black px-4 md:px-8 py-24 md:py-36">
      <FadeUp className="max-w-4xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <span
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(222,219,200,0.06)",
              border: "1px solid rgba(222,219,200,0.12)",
              color: ACCENT,
              fontFamily: FONT,
            }}
          >
            <Boxes size={13} /> Start building today
          </span>
        </div>
        <h2
          className="text-3xl sm:text-5xl md:text-6xl font-medium leading-[0.95] tracking-tight"
          style={{ color: CREAM, fontFamily: FONT }}
        >
          Your next system is one
          <br className="hidden sm:block" /> sentence away.
        </h2>
        <p
          className="text-sm sm:text-base mt-6 max-w-md mx-auto"
          style={{ color: "rgba(225,224,204,0.5)", fontFamily: FONT }}
        >
          Stop wrestling with diagramming tools. Describe what you want and let Archon architect it.
        </p>
        <div className="flex items-center justify-center gap-3 mt-10 flex-wrap">
          <Link
            href="/sign-in"
            className="group flex items-center gap-2 rounded-full font-medium text-sm sm:text-base transition-all duration-200 hover:gap-3"
            style={{
              backgroundColor: ACCENT,
              color: "#000",
              padding: "0.55rem 0.7rem 0.55rem 1.4rem",
              fontFamily: FONT,
            }}
          >
            Start designing free
            <span className="flex items-center justify-center rounded-full bg-black w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-200 group-hover:scale-110">
              <ArrowRight size={16} color={CREAM} />
            </span>
          </Link>
          <Link
            href="/sign-in"
            className="flex items-center gap-2 rounded-full font-medium text-sm sm:text-base px-6 py-3 transition-colors"
            style={{
              border: "1px solid rgba(222,219,200,0.2)",
              color: CREAM,
              fontFamily: FONT,
            }}
          >
            <Zap size={15} /> See it in action
          </Link>
        </div>
      </FadeUp>
    </section>
  )
}
