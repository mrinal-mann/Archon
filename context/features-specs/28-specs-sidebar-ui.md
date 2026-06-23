Integrate spec generation results into the editor so users can view, preview, and download specs from the existing AI sidebar Specs tab.

### Implementation

1. Spec list

- in the right sidebar (Specs tab), show a list of specs for the current project
- fetch specs from the backend using the existing ProjectSpec API
- display:
  - `createdAt`
  - `filename`
- keep items simple and clickable

2. Preview modal

- open a modal when a spec is selected
- fetch the spec content through an existing endpoint (do not access Blob directly from the client)
- render content as Markdown
- include a close action and basic keyboard support

3. Download action

- add a download action for each spec (list item + modal)
- call the download endpoint
- let the browser handle the file download

### UI Details

- use existing sidebar layout, do not redesign
- use shadcn/ui components (`Dialog`, `ScrollArea`, `Button`)
- use existing colors and tokens from `global.css`
- keep the specs tab visually consistent with the AI Architect tab

### Additional Requirements

#### Specs API integration

Use the existing routes:

- `GET /api/projects/[projectId]/specs`
- `GET /api/projects/[projectId]/specs/[specId]`
- `GET /api/projects/[projectId]/specs/[specId]/download`

Do not access Vercel Blob directly from the client.

#### Loading states

- show a loading state while fetching the spec list
- show a loading state while fetching spec content
- disable download actions while loading
- show an empty state when no specs exist

#### Empty state

When no specs exist:

- show a file/spec icon
- show a short message:
  - "No specs generated yet"
- provide guidance:
  - "Generate a spec from the AI Architect tab"

#### Spec preview

- render Markdown safely
- support:
  - headings
  - lists
  - code blocks
  - tables
- use a scrollable container for long specs
- keep preview read-only

#### Realtime updates

- after a spec generation run completes, refresh the spec list automatically
- if the current project receives a new spec while the sidebar is open:
  - update the list without requiring a page refresh

Reuse existing realtime patterns already used in the project.

#### Error handling

Handle:

- spec list fetch failures
- spec content fetch failures
- download failures
- deleted or missing specs

Show lightweight error states without breaking the sidebar.

#### Performance

- fetch spec content only when a spec is opened
- do not preload full spec content for the entire list
- keep list payload limited to metadata only

### Scope Limits

- do not redesign the sidebar
- do not edit specs
- do not create spec version history
- do not access Blob directly from the browser
- do not add AI generation logic
- do not add spec sharing permissions

### Check When Done

- Specs tab lists project specs.
- Clicking a spec opens a preview modal.
- Markdown renders correctly.
- Download actions work through the API route.
- Empty, loading, and error states are handled.
- New specs appear automatically after generation.
- Blob storage remains server-only.
- `npm run build` passes.