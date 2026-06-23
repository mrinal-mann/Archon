Create the backend flow for AI-powered spec generation: API route, Trigger.dev task, token route, and run ownership tracking.

### Implementation

1. Spec trigger route

Create or update `POST /api/ai/spec`.

It should:

- accept `roomId`, `chatHistory`, `nodes`, and `edges`
- authenticate the current user
- resolve project access from `roomId`
- trigger the `generate-spec` task
- save a `TaskRun` record for ownership/access control
- return the Trigger.dev `runId`

Do not trust a client-supplied `projectId`.

2. Spec token route

Create or update `POST /api/ai/spec/token`.

It should:

- accept `runId`
- authenticate the current user
- verify the `TaskRun` belongs to the user
- issue a Trigger.dev public access token scoped to that run
- set token expiration to 1 hour
- return the token to the client

3. Spec generation task

Create or update `trigger/generate-spec.ts`.

Define a `generateSpec` task that:

- accepts `projectId`, `roomId`, `chatHistory`, `nodes`, and `edges`
- validates input with Zod
- uses Gemini through `@ai-sdk/google`
- generates a Markdown technical spec from the canvas and chat context
- updates run metadata/status for realtime tracking
- returns the generated spec content as task output

Follow the existing Trigger.dev task patterns in the codebase for retries, logging, and error handling.

### Additional Requirements

#### Input validation

- validate all route payloads with Zod
- enforce maximum sizes for:
  - chat history
  - node count
  - edge count
- reject malformed canvas data before starting a task

#### Ownership and access control

- verify room access before triggering generation
- verify project ownership through the existing authorization flow
- ensure users can only request tokens for their own runs
- never expose internal Trigger.dev credentials to the client

#### Run tracking

- create a `TaskRun` record immediately after scheduling the task
- store:
  - `runId`
  - `projectId`
  - `userId`
  - task type (`spec`)
  - status
  - timestamps

- update status during task execution:
  - queued
  - running
  - completed
  - failed

#### Realtime status integration

- publish progress updates to `ai-status-feed`
- emit status events:
  - queued
  - analyzing canvas
  - generating spec
  - completed
  - failed

- include optional status text for display in the sidebar

#### Spec output

- return Markdown only
- include:
  - overview
  - architecture summary
  - components/services
  - data flow
  - implementation recommendations

- keep output deterministic and structured

#### Error handling

- catch AI provider failures
- catch validation failures
- catch task execution failures
- update task status before exiting
- publish failure status to `ai-status-feed`

#### Logging

- log task start
- log task completion
- log task failures
- include:
  - projectId
  - roomId
  - runId

- avoid logging full prompts or generated spec content

### Scope Limits

- Do not add frontend logic
- Do not create spec editor UI
- Do not persist specs yet
- Do not generate files or downloads
- Do not modify canvas state
- Do not update nodes or edges
- Do not create a second task tracking system

### Check When Done

- `POST /api/ai/spec` triggers a background task.
- `POST /api/ai/spec/token` returns a run-scoped public token.
- Ownership checks work correctly.
- `generateSpec` validates input with Zod.
- Gemini generates Markdown spec output.
- Task status updates are published in realtime.
- Failures update task status correctly.
- `TaskRun` records are stored and updated.
- `npm run build` passes.