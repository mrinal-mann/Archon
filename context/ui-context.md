# UI Context

## Theme

Dark only. The app uses shadcn/ui semantic theme tokens
backed by CSS custom properties in `app/globals.css`.
Default `:root` values are dark values, and the root HTML
element also carries the `dark` class so dark variants are
active consistently.

## Colors

All UI components should use shadcn semantic color tokens
through Tailwind utilities such as `bg-background`,
`text-foreground`, `bg-card`, `border-border`, and
`text-muted-foreground`.

| Role            | CSS Variable         | Value                        |
| --------------- | -------------------- | ---------------------------- |
| Page background | `--background`       | `oklch(0.145 0 0)`           |
| Surface         | `--card`             | `oklch(0.205 0 0)`           |
| Primary text    | `--foreground`       | `oklch(0.985 0 0)`           |
| Muted text      | `--muted-foreground` | `oklch(0.708 0 0)`           |
| Primary accent  | `--primary`          | `oklch(0.922 0 0)`           |
| Border          | `--border`           | `oklch(1 0 0 / 10%)`         |
| Error           | `--destructive`      | `oklch(0.704 0.191 22.216)`  |

## Typography

| Role      | Font       | Variable      |
| --------- | ---------- | ------------- |
| UI text   | Geist Sans | `--font-sans` |
| Code/mono | Geist Mono | `--font-mono` |

## Border Radius

| Context           | Class                    |
| ----------------- | ------------------------ |
| Inline / small UI | `rounded-sm` / `rounded-md` |
| Cards / panels    | `rounded-lg`             |
| Modals / overlays | `rounded-lg`             |

## Component Library

shadcn/ui on top of Tailwind CSS v4 using the Radix Nova
preset. Generated components live in `components/ui/` and
must not be hand-edited after installation; add future
registry components through the shadcn CLI. Shared class
merging lives in `lib/utils.ts` via `cn()`.

## Layout Patterns

- Use semantic theme utilities instead of hardcoded color values.
- Use generated shadcn primitives for common controls and overlays.
- Keep the application dark by default; do not introduce light-mode
  fallbacks unless the product scope changes.

## Icons

Lucide React. Stroke-based icons only. Use `size-4` for
inline icons and `size-5` for larger button icons.
