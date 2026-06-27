# UI Context

## Theme

Dark only. The app uses shadcn/ui semantic theme tokens
backed by CSS custom properties in `app/globals.css`.
Default `:root` values are dark values, and the root HTML
element also carries the `dark` class so dark variants are
active consistently.

## Colors

All UI components (editor, canvas, dialogs, AI sidebar) use shadcn semantic
color tokens through Tailwind utilities such as `bg-background`,
`text-foreground`, `bg-card`, `border-border`, and
`text-muted-foreground`. The token values use the **Archon cream-on-black**
palette so the authenticated app matches the landing brand — changing these
variables re-themes the entire app without editing components.

| Role            | CSS Variable         | Value                        |
| --------------- | -------------------- | ---------------------------- |
| Page background | `--background`       | `#0a0a0a` (near-black)       |
| Surface         | `--card`             | `#141413`                    |
| Primary text    | `--foreground`       | `#e1e0cc` (cream)            |
| Muted text      | `--muted-foreground` | `#9d9c8d` (warm gray)        |
| Primary accent  | `--primary`          | `#dedbc8` (cream)            |
| On-accent text  | `--primary-foreground` | `#0a0a0a`                  |
| Border          | `--border`           | `rgba(222,219,200,0.12)`     |
| Error           | `--destructive`      | `oklch(0.704 0.191 22.216)`  |

The Clerk auth UI is themed to match via `ClerkProvider` appearance variables
in `app/layout.tsx` (`colorPrimary: #dedbc8`, `colorForeground: #e1e0cc`,
`colorBackground: #141413`).

## Landing Page Color System

The public landing page (`app/page.tsx` → `components/landing/landing-page.tsx`)
uses a cinematic warm-cream-on-black palette, separate from the editor's
semantic tokens. All landing colors are applied via inline styles to avoid
polluting the editor theme.

| Role                    | Hex value    | Usage                                      |
| ----------------------- | ------------ | ------------------------------------------ |
| Landing primary accent  | `#DEDBC8`    | Buttons, icons, labels, checklist checks   |
| Landing primary text    | `#E1E0CC`    | All headings, hero title, card titles      |
| Landing bg — hero       | `#000000`    | Full-black hero container                  |
| Landing bg — about card | `#0D0D0D`    | About section card background              |
| Landing bg — feat cards | `#1A1A1A`    | Features section card backgrounds          |
| Landing text muted      | `rgba(225,224,204,0.6)` | Description text, secondary copy |
| Landing text dimmed     | `rgba(225,224,204,0.25)` | Footer, timestamps                 |

## Typography

### Editor / App
| Role      | Font       | Variable      |
| --------- | ---------- | ------------- |
| UI text   | Geist Sans | `--font-sans` |
| Code/mono | Geist Mono | `--font-mono` |

### Landing Page
Fonts loaded via `next/font/google` at the component level in
`components/landing/landing-page.tsx`. Variables are scoped to the `<main>`
wrapper element.

| Role             | Font             | CSS Variable              | Weights          |
| ---------------- | ---------------- | ------------------------- | ---------------- |
| Primary / all UI | Almarai          | `--font-almarai`          | 300, 400, 700, 800 |
| Italic accent    | Instrument Serif | `--font-instrument-serif` | 400 italic only  |

The global landing font applies via `fontFamily: "var(--font-almarai),sans-serif"` on
all text elements. Instrument Serif italic is used only for accent phrases
inside `WordsPullUpMultiStyle` (e.g. "your AI systems architect.").

## Noise Textures

Two SVG fractal-noise CSS utilities in `app/globals.css`:

| Class            | baseFrequency | numOctaves | Used in                                  |
| ---------------- | ------------- | ---------- | ---------------------------------------- |
| `.noise-overlay` | 0.85          | 3          | Hero section — `mix-blend-overlay`       |
| `.bg-noise`      | 0.90          | 4          | Features section — subtle BG texture     |

## Border Radius

| Context           | Class                    |
| ----------------- | ------------------------ |
| Inline / small UI | `rounded-sm` / `rounded-md` |
| Cards / panels    | `rounded-lg`             |
| Modals / overlays | `rounded-lg`             |
| Landing cards     | `rounded-2xl` / `rounded-3xl` |

## Component Library

shadcn/ui on top of Tailwind CSS v4 using the Radix Nova
preset. Generated components live in `components/ui/` and
must not be hand-edited after installation; add future
registry components through the shadcn CLI. Shared class
merging lives in `lib/utils.ts` via `cn()`.

## Layout Patterns

- Use semantic theme utilities in the editor; do not introduce hardcoded hex values there.
- Landing page components use inline styles with the landing palette above.
- Keep the application dark by default; do not introduce light-mode
  fallbacks unless the product scope changes.

## Icons

Lucide React. Stroke-based icons only. Use `size-4` for
inline icons and `size-5` for larger button icons.
