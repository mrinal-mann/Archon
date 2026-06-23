Wire up the AI sidebar so users can submit design prompts, track AI run status in real time, and reflect AI-driven canvas updates through Liveblocks.

### Implementation

1. Submit from AI sidebar

- On submit:
  - push the user message to the `ai-chat` feed
  - call `POST /api/ai/design` with `{ prompt, roomId }`
  - read `{ runId, publicToken }` from the response
  - store `runId` and `publicToken` in local state

2. Run status tracking

- Use `useRealtimeRun(runId, { accessToken: publicToken })`
- While the run is active:
  - disable the chat input
  - show a loading state (spinner in the button is enough)
- When the run completes:
  - push a final AI message to `ai-chat`
  - reset loading + run state

3. Canvas updates (realtime)

- Do not manually update nodes/edges
- Rely on Liveblocks (`useLiveblocksFlow`) to reflect changes in real time
- AI updates to nodes, edges, and presence should appear automatically

4. Status display

- Read the latest message from `ai-status-feed`
- Show a compact status strip above the input only when a run is active

### UI Details

- Use existing design tokens from `global.css` (do not introduce new colors)
- Follow `ui-context.md` for layout and visual consistency

#### Chat bubbles

- User messages:
  - right aligned
  - existing user bubble styling

- AI messages:
  - left aligned
  - existing assistant bubble styling

- Status messages:
  - do not render inside chat bubbles
  - remain in the status strip only

## Additional Requirements

### Run lifecycle

- Only allow one active design run per sidebar instance.
- Ignore stale updates from previous runs.
- Clear active run state on success, failure, or cancellation.
- Persist `runId` only for the currently active request.

### Error handling

- If `POST /api/ai/design` fails:
  - restore input immediately
  - show an inline error message
  - do not create an AI chat message

- If realtime tracking fails:
  - keep the run active
  - show a reconnecting state
  - resume tracking automatically when possible

- If the run ends with an error:
  - push an AI error message into `ai-chat`
  - update `ai-status-feed`
  - re-enable the input

### AI chat integration

- Push the user's prompt into `ai-chat` immediately before triggering the run.
- Push assistant messages into `ai-chat` only when they originate from completed AI work.
- Preserve message ordering across reconnects.
- Continue using the existing chat schema from Unit 25.

### Status feed integration

- Subscribe to `ai-status-feed` through the shared status hook.
- Show:
  - queued
  - running
  - completed
  - error

- Ignore unrelated feed messages from older runs.

### Presence integration

- Read AI presence from the shared presence state.
- Reflect:
  - `thinking: true`
  - cursor updates
  - active task state

- Do not introduce a separate AI state store.

### Liveblocks integration

- Do not manually mutate React Flow state.
- Do not bypass collaborative canvas utilities.
- All canvas updates must arrive through the existing Liveblocks synchronization flow.

## Scope Limits

- don't change the canvas architecture
- don't introduce a new state system
- don't bypass existing Liveblocks flow utilities
- don't add a second chat implementation
- don't manually sync canvas updates outside Liveblocks

## Check When Done

- Users can submit prompts from the AI sidebar.
- Design runs start through `POST /api/ai/design`.
- Realtime run tracking updates the UI.
- AI chat messages appear in `ai-chat`.
- AI status appears from `ai-status-feed`.
- Canvas changes arrive through Liveblocks automatically.
- Input locking behaves correctly during active runs.
- Errors recover gracefully.
- `npm run build` passes