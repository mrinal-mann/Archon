# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete

## Current Goal

- Auth feature from `context/features-specs/03-auth.md` is implemented.

## Completed

- Initialized shadcn/ui with Radix Nova preset for the Next.js Tailwind v4 app.
- Added shadcn/ui primitives: Button, Card, Input, Label, Select, Textarea, Badge, Avatar, Scrollarea, Dialog, and Tabs.
- Installed supporting dependencies including `lucide-react`, Radix UI, `clsx`, `tailwind-merge`, and `tw-animate-css`.
- Added `lib/utils.ts` with reusable `cn()` class merging helper.
- Configured `app/globals.css` and `app/layout.tsx` so shadcn components use dark theme tokens by default with no light-mode fallback.
- Updated `context/ui-context.md` to document the installed design system, dark tokens, typography, icons, and component conventions.
- Verified `npm.cmd run lint` and `npm.cmd run build` pass.
- Added `components/editor/editor-navbar.tsx` with a fixed-height three-section editor navbar and sidebar toggle icons.
- Added `components/editor/project-sidebar.tsx` with a floating, slide-in project sidebar, tabs, empty states, close action, and bottom `New Project` action.
- Confirmed the generated shadcn dialog primitives already provide the future dialog pattern pieces: title, description, and footer actions using theme tokens.
- Verified `npm.cmd run lint` and `npm.cmd run build` pass after the editor shell implementation.
- Installed `@clerk/nextjs` and `@clerk/ui` for authentication.
- Added Clerk sign-in/sign-up URL env vars to `.env`.
- Created `proxy.ts` at project root using `clerkMiddleware` and `createRouteMatcher`; all routes protected except `/sign-in` and `/sign-up`.
- Wrapped root layout with `ClerkProvider` using `@clerk/ui/themes` `dark` theme and CSS variable overrides (no hardcoded colors).
- Created `app/sign-in/[[...sign-in]]/page.tsx` and `app/sign-up/[[...sign-up]]/page.tsx` with a minimal two-panel layout: left info panel on large screens, Clerk form on right; form only on small screens.
- Updated `app/page.tsx` to redirect authenticated users to `/editor` and unauthenticated users to `/sign-in`.
- Added Clerk `UserButton` to the editor navbar right section.
- Verified `npm run build` passes.

## In Progress

- None.

## Next Up

- Await the next feature unit.

## Open Questions

- None.

## Architecture Decisions

- UI primitives use generated shadcn/ui components under `components/ui/`.
  These files should not be hand-edited after installation.
- Tailwind CSS v4 theming uses semantic CSS custom properties in
  `app/globals.css`; the application is dark-only by default.
- Editor chrome components live under `components/editor/` and are controlled
  by parent state so future editor screens can own sidebar behavior.
- Auth uses Clerk via `@clerk/nextjs`; middleware lives in `proxy.ts` (not
  `middleware.ts`) per project spec. Public routes are `/sign-in(.*)` and
  `/sign-up(.*)`; everything else is protected.
- Clerk appearance uses `theme: dark` from `@clerk/ui/themes` with CSS variable
  overrides mapped to the app's semantic tokens; no hardcoded colors.

## Session Notes

- 2026-05-10: Began `01-designs-system.md`; required context files and AGENTS.md were read before implementation.
- 2026-05-10: shadcn CLI generated `components.json`, `lib/utils.ts`, and requested `components/ui/*` primitives; generated UI files should remain unmodified.
- 2026-05-10: PowerShell blocks npm/npx `.ps1` shims on this machine; use `npm.cmd` and `npx.cmd` for commands.
- 2026-05-10: Began `02-editor.md`; required context files and AGENTS.md were read before implementation.
- 2026-05-10: Completed `02-editor.md`; editor navbar and project sidebar compile cleanly, and existing dialog primitives cover the future dialog pattern.
- 2026-05-17: Began `03-auth.md`; all required context files and AGENTS.md were read before implementation.
- 2026-05-17: `@clerk/ui/themes` dark theme uses `theme:` prop (not `baseTheme:`) inside `ClerkProvider` appearance; valid variable keys are `colorForeground`, `colorMutedForeground`, `colorInput`, etc.
- 2026-05-17: Completed `03-auth.md`; all routes protected, auth pages use CSS variables, `ClerkProvider` wraps root layout, `npm run build` passes.
