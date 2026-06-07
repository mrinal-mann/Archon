# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- Complete

## Current Goal

- Liveblocks-backed React Flow base canvas
  (`context/features-specs/11-base-canvas.md`).

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
- Added editor home screen with centered heading, description, and `New Project` button (`app/editor/page.tsx`).
- Created `hooks/use-project-dialog.ts` managing dialog state, form name, live slug, and loading state.
- Created `components/editor/project-dialogs.tsx` with `CreateProjectDialog` (name input + live slug preview), `RenameProjectDialog` (prefilled, auto-focuses, Enter submits), and `DeleteProjectDialog` (destructive confirm, no input).
- Updated `components/editor/project-sidebar.tsx`: project items for owned/shared, rename/delete actions shown only for owned projects, mobile backdrop scrim (`lg:hidden`) that closes sidebar on tap.
- Wired all dialog triggers: editor home `New Project`, sidebar `New Project` → Create; sidebar rename/delete icons → respective dialogs.
- Verified `npm run build` passes with no TypeScript or lint errors.
- Added `prisma/models/project.prisma` with the `ProjectStatus` enum (`DRAFT`, `ARCHIVED`), `Project` model (ownerId → Clerk user, name, optional description, status, `canvasJsonPath`, timestamps, indexes on `ownerId` and `createdAt`), and `ProjectCollaborator` model (project relation with cascade delete, email, createdAt, unique `[projectId, email]`, indexes on `email` and `[projectId, createdAt]`).
- Added `lib/prisma.ts` as a cached singleton: branches on `DATABASE_URL` — `prisma+postgres://` uses Accelerate (`accelerateUrl`), otherwise direct `@prisma/adapter-pg`; caches on `global` outside production.
- Ran first migration `20260606140113_init_project_models` and generated the client to `generated/prisma`.
- Verified `npm run build` passes.
- Added `app/api/projects/route.ts` with `GET` (list current user's projects, scoped by `ownerId`, ordered by `createdAt` desc) and `POST` (create; defaults missing/blank name to `Untitled Project`, uses schema's `cuid()` id strategy, returns `201`).
- Added `app/api/projects/[projectId]/route.ts` with `PATCH` (rename) and `DELETE`; both load the project, enforce owner check, and use Next 16 async `params`.
- All routes return `401` when unauthenticated; non-owner mutations return `403`; missing projects return `404`; rename with a blank/invalid name returns `400`.
- Backend-only; no UI wiring per spec.
- Verified `npm run build` passes.
- Added `lib/projects.ts` server data helper (`getUserProjects`): loads owned projects by `ownerId` and shared projects via `ProjectCollaborator` matched on the Clerk user's primary email (`currentUser()`), both ordered by `createdAt` desc; returns `{ owned, shared }` tagged with role.
- Converted `app/editor/page.tsx` to a server component that fetches projects via the helper and passes them to the new client `components/editor/editor-home.tsx`; no client-side fetching on initial load.
- Replaced `hooks/use-project-dialog.ts` with `hooks/use-project-actions.ts`: manages dialog state plus real create/rename/delete mutations. Create generates a short suffix, slugifies the name into a room ID (`slug-suffix`), `POST /api/projects` with that id, then navigates to `/editor/[projectId]`. Rename calls `PATCH` then `router.refresh()`. Delete calls `DELETE`, redirects to `/editor` if the active workspace was deleted, otherwise `router.refresh()`.
- Updated `POST /api/projects` to accept an optional `id` so the project id stays aligned with the Liveblocks room id; falls back to the schema's `cuid()` default when absent.
- Wired sidebar and dialogs to the hook; create dialog shows the room ID preview, rename pre-fills the current name, delete shows the project name. Removed mock project data.
- Verified `npm run build` passes.
- Added `lib/project-access.ts` with `getCurrentIdentity()` (Clerk `userId` + primary email, null when unauthenticated) and `getProjectAccess(projectId, identity)` (returns the project + role for an owner or email-matched collaborator, else null).
- Added `components/editor/access-denied.tsx`: centered layout, lock icon, short message, and a `Back to editor` link to `/editor`.
- Built `app/editor/[roomId]/page.tsx` as a server component: unauthenticated users `redirect("/sign-in")`, missing or unauthorized projects render `AccessDenied`, otherwise it loads the user's projects and renders the workspace shell.
- Added `components/editor/editor-workspace.tsx` client shell: navbar shows the project name with share + AI-toggle actions, floating `ProjectSidebar` on the left with the current room highlighted, a central canvas placeholder (`bg-background`, centered message) filling the remaining space, and a toggleable right placeholder for the future AI chat. Project mutations run through `useProjectActions({ activeProjectId })`.
- Extended `components/editor/editor-navbar.tsx` with an optional `actions` slot (rendered before `UserButton`).
- Updated `components/editor/project-sidebar.tsx`: project items are now `next/link` links to `/editor/[id]` and accept `activeProjectId` to highlight the current room (`aria-current`, accent background, medium weight).
- Verified `npm run build` passes with the `/editor/[roomId]` route registered and no TypeScript errors.
- Added `lib/collaborators.ts` with `enrichCollaborators(emails)`: looks up the emails via the Clerk Backend API (`clerkClient().users.getUserList({ emailAddress })`) and returns `{ email, name, imageUrl }` per email, preserving input order and falling back to email-only when no Clerk user matches or the lookup fails. No local user table.
- Added `app/api/projects/[projectId]/collaborators/route.ts`: `GET` lists collaborators (owner or collaborator, via `getProjectAccess`) enriched through Clerk; `POST` invites by email (owner-only, validated, idempotent `upsert` on `projectId_email`); `DELETE` removes by `?email=` query (owner-only). Returns `401`/`403`/`404`/`400` consistently and enforces ownership server-side for invite/remove.
- Added `components/editor/share-dialog.tsx`: copy-link row with temporary `Copied!` feedback for all roles; owners get an invite-by-email field and per-collaborator remove buttons; collaborators see the list read-only. Collaborator rows show Clerk avatar + name with email fallback. Loads the list on open and shows loading/empty/error states.
- Wired the navbar `Share` button in `components/editor/editor-workspace.tsx` to open the dialog; threaded `role` from the page through to set `isOwner`. Updated `app/editor/[roomId]/page.tsx` to pass `role={access.role}`.
- Verified `npm run build` passes with the `/api/projects/[projectId]/collaborators` route registered and no TypeScript errors.
- Replaced the workspace canvas placeholder with a Liveblocks-backed React Flow canvas: shared types in `types/canvas.ts`, a `CanvasRoom` client wrapper (provider + room + suspense + error fallback), and a `Canvas` component using `useLiveblocksFlow` (suspense, empty initial state) rendering loose connections, `fitView`, dot background, and a minimap. `npm run build` passes.

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
- Prisma uses the multi-file schema folder (`prisma/`); models live in
  `prisma/models/*.prisma`. The `prisma-client` generator emits to
  `generated/prisma`; the app imports the client only through the
  `lib/prisma.ts` singleton, never the generated path directly.

## Session Notes

- 2026-05-10: Began `01-designs-system.md`; required context files and AGENTS.md were read before implementation.
- 2026-05-10: shadcn CLI generated `components.json`, `lib/utils.ts`, and requested `components/ui/*` primitives; generated UI files should remain unmodified.
- 2026-05-10: PowerShell blocks npm/npx `.ps1` shims on this machine; use `npm.cmd` and `npx.cmd` for commands.
- 2026-05-10: Began `02-editor.md`; required context files and AGENTS.md were read before implementation.
- 2026-05-10: Completed `02-editor.md`; editor navbar and project sidebar compile cleanly, and existing dialog primitives cover the future dialog pattern.
- 2026-05-17: Began `03-auth.md`; all required context files and AGENTS.md were read before implementation.
- 2026-05-17: `@clerk/ui/themes` dark theme uses `theme:` prop (not `baseTheme:`) inside `ClerkProvider` appearance; valid variable keys are `colorForeground`, `colorMutedForeground`, `colorInput`, etc.
- 2026-05-17: Completed `03-auth.md`; all routes protected, auth pages use CSS variables, `ClerkProvider` wraps root layout, `npm run build` passes.
- 2026-05-24: Began `04-project-dialog.md`; all required context files and AGENTS.md were read before implementation.
- 2026-05-24: Completed `04-project-dialog.md`; editor home screen, three dialogs, sidebar actions, and mobile backdrop all implemented with mock data only; `npm run build` passes.
- 2026-06-06: Began `05-prisma.md`; all required context files were read before implementation.
- 2026-06-06: The Prisma 7 `prisma-client` generator accepts either `{ adapter }` or `{ accelerateUrl }` in the client constructor, so the Accelerate branch needs no `@prisma/extension-accelerate` package.
- 2026-06-06: Active `DATABASE_URL` is a direct `postgres://` (Prisma Postgres pooled), so the live path uses the `@prisma/adapter-pg` adapter branch.
- 2026-06-06: Completed `05-prisma.md`; models, singleton, and first migration are in place; `npm run build` passes.
- 2026-06-06: Began `06-project-apis.md`; all required context files were read before implementation.
- 2026-06-06: Route handlers use `const { userId } = await auth()` from `@clerk/nextjs/server` and the `prisma` singleton; Next 16 route `params` is a Promise and must be awaited.
- 2026-06-06: Completed `06-project-apis.md`; list/create/rename/delete routes exist, owner checks enforced, 401/403 handled, backend-only; `npm run build` passes.
- 2026-06-06: Began `07-wire-editor-home.md`; all required context files were read before implementation.
- 2026-06-06: Shared projects are resolved by the Clerk user's email against `ProjectCollaborator`, so the data helper uses `currentUser()` (not just `auth()`) to read the primary email.
- 2026-06-06: Project id is now set from the client-generated room id (`slug-suffix`) on create to keep the project id and Liveblocks room id aligned; `POST /api/projects` accepts an optional `id` and falls back to `cuid()`.
- 2026-06-06: Completed `07-wire-editor-home.md`; editor home is a server component fed by `lib/projects.ts`, mutations run through `hooks/use-project-actions.ts`, dialogs/sidebar wired to real data, `npm run build` passes.
- 2026-06-06: Began `08-editor-workspace-shell.md`; all required context files were read before implementation.
- 2026-06-06: Access checks live in `lib/project-access.ts` (outside the page); the collaborator lookup uses the `projectId_email` compound-unique index. The floating `ProjectSidebar` is reused as-is, so the canvas spans full width with the sidebar overlaying on open.
- 2026-06-06: Completed `08-editor-workspace-shell.md`; `/editor/[roomId]` is a server component with auth redirect + `AccessDenied`, the workspace shell renders with current project context, no canvas/Liveblocks/AI/sharing behavior yet, `npm run build` passes.
- 2026-06-06: Began `09-share-dialog.md`; all required context files were read before implementation.
- 2026-06-06: Clerk enrichment uses `await clerkClient()` then `users.getUserList({ emailAddress, limit: 500 })`; emails are matched case-insensitively against every Clerk email address, with email-only fallback when unmatched. Collaborators remain stored only in `ProjectCollaborator` (no local user table).
- 2026-06-06: Collaborator removal is keyed by the `?email=` query param on `DELETE` (no separate collaborator-id route); invite uses an idempotent `upsert` so re-inviting is a no-op. The share dialog reuses the read access from `getProjectAccess` for listing and enforces owner-only invite/remove server-side.
- 2026-06-06: Completed `09-share-dialog.md`; share dialog opens from the workspace navbar, owners can invite/remove collaborators, collaborators get read-only access, names/avatars load from Clerk when available, `npm run build` passes.
- 2026-06-06: UI revision to match the provided mockup — `GET /collaborators` now also returns the Clerk-enriched `owner` (via new `enrichOwner(userId)`); the dialog renders a single "People with access" list (owner first) with `Owner`/`Collaborator` outline badges and a "{n} total" count, plus a "Workspace link" card with a "Copy link" button. Owner row has no remove action. Badges use theme tokens (no hardcoded teal) to respect the dark-only design system.
- 2026-06-07: Began `10-liveblock-setup.md`; all required context files were read before implementation.
- 2026-06-07: Installed `@liveblocks/node` (server SDK was missing; the React/client packages were already present). Added a `LIVEBLOCKS_SECRET_KEY` placeholder to `.env` (must be replaced with a real Liveblocks secret).
- 2026-06-07: Configured `liveblocks.config.ts` types — `Presence` ({ cursor: {x,y} | null, isThinking }) and `UserMeta` ({ id, info: { name, avatar?, cursorColor } }). Liveblocks' built-in `IUserInfo` types `avatar?: string`, so the avatar field is optional/string-only (not `string | null`); the auth route passes `undefined` when there is no Clerk avatar.
- 2026-06-07: Added `lib/liveblocks.ts` — `server-only` module exporting a cached `Liveblocks` node client (cached on `globalThis` outside production) and `getCursorColor(userId)`, a deterministic hash → fixed 9-color palette mapper.
- 2026-06-07: Added `app/api/liveblocks-auth/route.ts` (`POST`) — requires Clerk auth (401), reads `room` from the body and treats it as the project id, verifies access via `getProjectAccess` (403 when unauthorized), ensures the room exists via `getRoom`/`createRoom` (create only if missing), then issues a `prepareSession` token with `FULL_ACCESS` carrying the Clerk name, avatar, and generated cursor color.
- 2026-06-07: Completed `10-liveblock-setup.md`; `npm run build` passes with the `/api/liveblocks-auth` route registered.
- Added shared canvas types in `types/canvas.ts`: `CanvasNodeShape`, `CanvasNodeData` ({ label, color, shape }), `CanvasEdgeData`, the `canvasNode`/`canvasEdge` type constants, and `CanvasNode`/`CanvasEdge` React Flow types.
- Added `components/editor/canvas/canvas.tsx`: the React Flow canvas wired to Liveblocks via `useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true })` with empty initial nodes/edges; renders `ReactFlow` with loose connection mode, `fitView`, dot-pattern `Background`, and `MiniMap`. Imports `@xyflow/react` and `@liveblocks/react-flow` styles.
- Added `components/editor/canvas/canvas-room.tsx`: client wrapper setting up `LiveblocksProvider` (authEndpoint `/api/liveblocks-auth`), `RoomProvider` (current room id, initial presence `{ cursor: null, isThinking: false }`), `ClientSideSuspense` with a loading state, and a class-based error boundary that renders a connection-error fallback.
- Wired `components/editor/editor-workspace.tsx` to render `<CanvasRoom roomId={project.id} />` in place of the canvas placeholder (main is now `relative` and fills remaining space).
- Per scope limits: no controls, no custom node/edge rendering, no persistence, no AI behavior yet.
- Typed the Liveblocks `Storage` tree in `liveblocks.config.ts`: added `flow?: LiveblocksFlow<CanvasNode, CanvasEdge>` (default `"flow"` storage key used by `useLiveblocksFlow`). Kept it optional so `RoomProvider` does not require `initialStorage` — the hook creates the flow lazily from its `initial` option.
- Set `colorMode="dark"` on `ReactFlow` so the canvas controls/background match the dark-only theme.
- Removed the `MiniMap` per user request (deviates from `11-base-canvas.md`, which listed it as required); canvas now renders only the dot-pattern background.
- Verified `npm run build` passes.
