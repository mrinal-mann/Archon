"use client"

import { useRef, useEffect } from "react"
import {
  motion,
  useInView,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion"
import { ArrowRight, Check, Network, GitBranch, FileText } from "lucide-react"
import { Almarai, Instrument_Serif } from "next/font/google"
import Link from "next/link"
import {
  HowItWorksSection,
  CapabilitiesSection,
  StatsStrip,
  CTASection,
} from "./product-sections"
import { ArchonLogo } from "@/components/brand/archon-logo"

// ─── Fonts ────────────────────────────────────────────────────────────────────

const almarai = Almarai({
  subsets: ["latin"],
  weight: ["300", "400", "700", "800"],
  variable: "--font-almarai",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  style: ["italic"],
  weight: "400",
  variable: "--font-instrument-serif",
})

// ─── Animated Particle Canvas ─────────────────────────────────────────────────

function NodeCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ctx = el.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const W = () => el.offsetWidth
    const H = () => el.offsetHeight

    const setup = () => {
      el.width = W() * dpr
      el.height = H() * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    setup()

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number }
    const pts: P[] = Array.from({ length: 55 }, () => ({
      x: Math.random() * W(),
      y: Math.random() * H(),
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.8 + 0.6,
      a: Math.random() * 0.32 + 0.08,
    }))

    let raf: number
    const MAX = 140

    const frame = () => {
      ctx.clearRect(0, 0, W(), H())

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i]
        for (let j = i + 1; j < pts.length; j++) {
          const q = pts[j]
          const dx = q.x - p.x
          const dy = q.y - p.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < MAX) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.strokeStyle = `rgba(225,224,204,${(1 - d / MAX) * 0.1})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      for (const p of pts) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(225,224,204,${p.a})`
        ctx.fill()
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > W()) p.vx = -p.vx
        if (p.y < 0 || p.y > H()) p.vy = -p.vy
      }

      raf = requestAnimationFrame(frame)
    }

    frame()

    const onResize = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); setup() }
    window.addEventListener("resize", onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize) }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 w-full h-full" />
}

// ─── Animation Primitives ─────────────────────────────────────────────────────

function WordsPullUp({
  text,
  delay = 0,
  className = "",
  style,
}: {
  text: string
  delay?: number
  className?: string
  style?: React.CSSProperties
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const words = text.split(" ")
  return (
    <span ref={ref} className={`inline-flex flex-wrap gap-x-[0.25em] ${className}`} style={style}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          style={{ overflow: "hidden", display: "inline-block" }}
          initial={{ y: "110%" }}
          animate={inView ? { y: 0 } : {}}
          transition={{ duration: 0.75, delay: delay + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  )
}

type Seg = { text: string; className?: string; style?: React.CSSProperties }

function WordsPullUpMultiStyle({
  segments,
  className = "",
}: {
  segments: Seg[]
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  const words: Array<{ w: string; cls: string; sty?: React.CSSProperties; i: number }> = []
  let idx = 0
  for (const seg of segments) {
    for (const w of seg.text.trim().split(/\s+/)) {
      words.push({ w, cls: seg.className ?? "", sty: seg.style, i: idx++ })
    }
  }

  return (
    <span
      ref={ref}
      className={`inline-flex flex-wrap justify-center gap-x-[0.3em] gap-y-[0.1em] ${className}`}
    >
      {words.map(({ w, cls, sty, i }) => (
        <motion.span
          key={i}
          className={cls}
          style={{ overflow: "hidden", display: "inline-block", ...(sty ?? {}) }}
          initial={{ y: "110%" }}
          animate={inView ? { y: 0 } : {}}
          transition={{ duration: 0.75, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          {w}
        </motion.span>
      ))}
    </span>
  )
}

function AnimatedChar({
  char,
  index,
  total,
  progress,
}: {
  char: string
  index: number
  total: number
  progress: MotionValue<number>
}) {
  const p = index / total
  const opacity = useTransform(progress, [p - 0.08, p + 0.04], [0.15, 1])
  return (
    <motion.span style={{ opacity, display: "inline-block" }}>
      {char === " " ? " " : char}
    </motion.span>
  )
}

// ─── Shared CTA Button ────────────────────────────────────────────────────────

function CTAButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-2 rounded-full font-medium text-sm sm:text-base transition-all duration-200 hover:gap-3"
      style={{
        backgroundColor: "#DEDBC8",
        color: "#000",
        padding: "0.45rem 0.6rem 0.45rem 1.2rem",
        fontFamily: "var(--font-almarai),sans-serif",
      }}
    >
      {label}
      <span className="flex items-center justify-center rounded-full bg-black w-9 h-9 sm:w-10 sm:h-10 transition-transform duration-200 group-hover:scale-110">
        <ArrowRight size={16} color="#E1E0CC" />
      </span>
    </Link>
  )
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

const NAV: Array<{ label: string; href: string }> = [
  { label: "Overview", href: "#about" },
  { label: "How it works", href: "#how" },
  { label: "Features", href: "#features" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Sign in", href: "/sign-in" },
]

function Navbar() {
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-center z-20 pointer-events-none">
      <nav className="pointer-events-auto flex items-center gap-3 sm:gap-6 md:gap-10 lg:gap-12 bg-black rounded-b-2xl md:rounded-b-3xl px-4 md:px-8 py-2 md:py-3">
        {NAV.map(({ label, href }) => {
          const isCTA = label === "Sign in"
          return (
            <Link
              key={label}
              href={href}
              className="text-[10px] sm:text-xs md:text-sm whitespace-nowrap transition-colors"
              style={{
                color: isCTA ? "#E1E0CC" : "rgba(225,224,204,0.72)",
                fontWeight: isCTA ? 700 : 400,
                fontFamily: "var(--font-almarai),sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = isCTA ? "#E1E0CC" : "rgba(225,224,204,0.72)")
              }
            >
              {label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <section className="h-screen p-4 md:p-6 relative">
      <div ref={ref} className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden">

        {/* Base black */}
        <div className="absolute inset-0 bg-black" />

        {/* Particle canvas */}
        <NodeCanvas />

        {/* SVG noise overlay */}
        <div className="noise-overlay absolute inset-0 opacity-[0.55] mix-blend-overlay pointer-events-none" />

        {/* Gradient vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />

        {/* Brand lockup — top left */}
        <div className="absolute left-5 top-4 z-20 hidden items-center gap-2 sm:flex md:left-8 md:top-6">
          <ArchonLogo size={22} style={{ color: "#E1E0CC" }} />
          <span
            className="text-sm font-bold tracking-[0.22em]"
            style={{ color: "#E1E0CC", fontFamily: "var(--font-almarai),sans-serif" }}
          >
            ARCHON
          </span>
        </div>

        <Navbar />

        {/* Content grid — bottom aligned */}
        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-12 items-end px-5 md:px-8 pb-6 md:pb-10">

          {/* Giant title */}
          <div className="col-span-12 lg:col-span-8 select-none">
            <h1
              className="font-medium leading-[0.85] tracking-[-0.07em]"
              style={{
                fontSize: "clamp(3.5rem, 20vw, 22vw)",
                color: "#E1E0CC",
                fontFamily: "var(--font-almarai),sans-serif",
              }}
            >
              {"ARCHON".split("").map((l, i) => (
                <motion.span
                  key={i}
                  style={{ display: "inline-block", overflow: "hidden" }}
                  initial={{ y: "110%" }}
                  animate={inView ? { y: 0 } : {}}
                  transition={{ duration: 0.85, delay: 0.08 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                >
                  {l}
                </motion.span>
              ))}
            </h1>
          </div>

          {/* Right column — desktop only */}
          <div className="hidden lg:flex col-span-4 flex-col items-end gap-5 pb-2">
            <motion.p
              className="text-sm md:text-base text-right max-w-xs"
              style={{
                color: "rgba(225,224,204,0.6)",
                lineHeight: 1.25,
                fontFamily: "var(--font-almarai),sans-serif",
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              Archon is your AI systems architect. Describe any system and watch it come to life on a collaborative canvas.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <CTAButton href="/sign-in" label="Start designing" />
            </motion.div>
          </div>
        </div>

        {/* Mobile CTA */}
        <div className="lg:hidden absolute bottom-6 right-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            <CTAButton href="/sign-in" label="Start designing" />
          </motion.div>
        </div>

      </div>
    </section>
  )
}

// ─── About Section ────────────────────────────────────────────────────────────

function AboutSection() {
  const scrollRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start 0.8", "end 0.2"],
  })

  const BODY =
    "Over the past year, I have helped engineering teams at startups and Fortune 500 companies alike design systems that scale. From event-driven microservices to multi-region databases, I transform complex architecture decisions into clarity."
  const chars = BODY.split("")

  return (
    <section id="about" className="scroll-mt-20 bg-black px-4 md:px-8 py-20 md:py-32">
      <div className="max-w-6xl mx-auto">
        <div
          className="rounded-2xl md:rounded-3xl px-8 md:px-16 py-16 md:py-24 text-center"
          style={{ backgroundColor: "#0D0D0D" }}
        >
          {/* Label */}
          <p
            className="text-[10px] sm:text-xs uppercase tracking-widest mb-8"
            style={{ color: "#DEDBC8", fontFamily: "var(--font-almarai),sans-serif" }}
          >
            AI Systems Architect
          </p>

          {/* Multi-style heading */}
          <div className="max-w-3xl mx-auto mb-12">
            <WordsPullUpMultiStyle
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-[0.95] sm:leading-[0.9]"
              segments={[
                {
                  text: "I am Archon,",
                  className: "font-normal",
                  style: { color: "#E1E0CC", fontFamily: "var(--font-almarai),sans-serif" },
                },
                {
                  text: "your AI systems architect.",
                  className: "italic",
                  style: {
                    color: "#E1E0CC",
                    fontFamily: "var(--font-instrument-serif),serif",
                    fontStyle: "italic",
                  },
                },
                {
                  text: "I design distributed systems, event-driven architectures, and cloud infrastructure.",
                  className: "font-normal",
                  style: { color: "#E1E0CC", fontFamily: "var(--font-almarai),sans-serif" },
                },
              ]}
            />
          </div>

          {/* Scroll-animated body text */}
          <div ref={scrollRef} className="max-w-2xl mx-auto">
            <p
              className="text-xs sm:text-sm md:text-base leading-relaxed"
              style={{ color: "#DEDBC8", fontFamily: "var(--font-almarai),sans-serif" }}
            >
              {chars.map((ch, i) => (
                <AnimatedChar
                  key={i}
                  char={ch}
                  index={i}
                  total={chars.length}
                  progress={scrollYProgress}
                />
              ))}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Features Section ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: "01",
    title: "AI Architecture.",
    Icon: Network,
    items: [
      "Describe any system in plain English",
      "Get a complete diagram instantly",
      "Iterative AI refinement on every prompt",
      "Supports microservices, monoliths & more",
    ],
  },
  {
    id: "02",
    title: "Smart Review.",
    Icon: GitBranch,
    items: [
      "AI-powered architecture analysis",
      "Detects bottlenecks and single points of failure",
      "Suggests best-practice improvements",
    ],
  },
  {
    id: "03",
    title: "Live Specs.",
    Icon: FileText,
    items: [
      "Generate full technical specs from diagrams",
      "Export as Markdown or PDF instantly",
      "Specs sync automatically on canvas changes",
    ],
  },
] as const

function FeatureCard({
  feature,
  index,
}: {
  feature: (typeof FEATURES)[number]
  index: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })
  const { Icon } = feature

  return (
    <motion.div
      ref={ref}
      className="rounded-2xl p-6 flex flex-col gap-5 min-h-[360px] lg:min-h-0 lg:h-full"
      style={{ backgroundColor: "#1A1A1A" }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay: (index + 1) * 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Icon tile */}
      <div
        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: "rgba(222,219,200,0.07)" }}
      >
        <Icon size={18} color="#DEDBC8" />
      </div>

      {/* Number + Title */}
      <div>
        <p
          className="text-[10px] mb-1"
          style={{ color: "rgba(225,224,204,0.3)", fontFamily: "var(--font-almarai),sans-serif" }}
        >
          {feature.id}
        </p>
        <h3
          className="text-base sm:text-lg font-medium"
          style={{ color: "#E1E0CC", fontFamily: "var(--font-almarai),sans-serif" }}
        >
          {feature.title}
        </h3>
      </div>

      {/* Checklist */}
      <ul className="flex flex-col gap-3 flex-1">
        {feature.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <Check
              size={13}
              className="mt-0.5 flex-shrink-0"
              style={{ color: "#DEDBC8" }}
            />
            <span
              className="text-xs sm:text-sm text-gray-400 leading-snug"
              style={{ fontFamily: "var(--font-almarai),sans-serif" }}
            >
              {item}
            </span>
          </li>
        ))}
      </ul>

      {/* Learn more */}
      <Link
        href="#"
        className="group flex items-center gap-1.5 text-xs sm:text-sm mt-auto transition-colors"
        style={{ color: "#DEDBC8", fontFamily: "var(--font-almarai),sans-serif" }}
      >
        Learn more
        <ArrowRight
          size={12}
          style={{ transform: "rotate(-45deg)" }}
          className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </Link>
    </motion.div>
  )
}

function FeaturesSection() {
  const canvasCardRef = useRef(null)
  const canvasInView = useInView(canvasCardRef, { once: true, margin: "-80px" })

  return (
    <section id="features" className="scroll-mt-20 min-h-screen bg-black relative px-4 md:px-8 py-20 md:py-32 overflow-hidden">
      {/* Noise background */}
      <div className="bg-noise absolute inset-0 opacity-[0.12] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">

        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <WordsPullUpMultiStyle
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-normal"
            segments={[
              {
                text: "Studio-grade workflows for visionary architects.",
                style: { color: "#E1E0CC", fontFamily: "var(--font-almarai),sans-serif" },
              },
              {
                text: "Built for pure clarity. Powered by intelligence.",
                className: "text-gray-500",
                style: { fontFamily: "var(--font-almarai),sans-serif" },
              },
            ]}
          />
        </div>

        {/* 4-column card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-2 lg:h-[480px]">

          {/* Canvas hero card */}
          <motion.div
            ref={canvasCardRef}
            className="relative rounded-2xl overflow-hidden min-h-[280px] md:min-h-[320px] lg:h-full"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={canvasInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="absolute inset-0 bg-black" />
            <NodeCanvas />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <p
                className="text-base sm:text-lg font-medium"
                style={{ color: "#E1E0CC", fontFamily: "var(--font-almarai),sans-serif" }}
              >
                Your design canvas.
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "rgba(225,224,204,0.5)", fontFamily: "var(--font-almarai),sans-serif" }}
              >
                Real-time collaborative. Always in sync.
              </p>
            </div>
          </motion.div>

          {/* Feature cards */}
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.id} feature={f} index={i} />
          ))}

        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="bg-black px-4 md:px-8 py-10"
      style={{ borderTop: "1px solid rgba(222,219,200,0.08)" }}
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="flex items-center gap-2">
          <ArchonLogo size={20} style={{ color: "#E1E0CC" }} />
          <span
            className="text-sm font-medium tracking-[0.2em]"
            style={{ color: "#E1E0CC", fontFamily: "var(--font-almarai),sans-serif" }}
          >
            ARCHON
          </span>
        </span>
        <p
          className="text-xs"
          style={{ color: "rgba(225,224,204,0.25)", fontFamily: "var(--font-almarai),sans-serif" }}
        >
          © 2026 Archon. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          {["Privacy", "Terms", "Docs"].map((l) => (
            <Link
              key={l}
              href="#"
              className="text-xs transition-colors"
              style={{ color: "rgba(225,224,204,0.35)", fontFamily: "var(--font-almarai),sans-serif" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E1E0CC")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(225,224,204,0.35)")}
            >
              {l}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function LandingPage() {
  return (
    <main
      className={`${almarai.variable} ${instrumentSerif.variable} bg-black min-h-screen overflow-x-hidden`}
    >
      <HeroSection />
      <AboutSection />
      <HowItWorksSection />
      <FeaturesSection />
      <StatsStrip />
      <CapabilitiesSection />
      <CTASection />
      <Footer />
    </main>
  )
}
