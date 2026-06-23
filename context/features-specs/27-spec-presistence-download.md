Persist generated specs with Vercel Blob and Prisma, then add a secure download route so users can retrieve their generated spec files.

### Implementation

1. ProjectSpec model

Ensure a `ProjectSpec` Prisma model exists with:

- `id`
- `projectId` (relation to Project)
- `filePath` (Blob URL or path)
- `createdAt`

Use this model for metadata only. The actual spec content should live in Vercel Blob.

2. Save generated spec

After a spec is generated:

- upload the Markdown content to Vercel Blob
- store the Blob URL/path in `ProjectSpec.filePath`
- link the record to the correct project
- follow the same metadata + blob pattern used for canvas persistence

3. Download route

Create a route like:

`GET /api/projects/[projectId]/specs/[specId]/download`

It should:

- authenticate the user
- verify access to the project
- verify the spec belongs to that project
- fetch the file using `ProjectSpec.filePath`
- return it as a downloadable Markdown file
- handle not found and forbidden cases properly

### Additional Requirements

#### Spec metadata

Store:

- `id`
- `projectId`
- `filePath`
- `createdAt`

Add:

- index on `projectId`
- descending sort by `createdAt` when listing specs

#### Blob storage pattern

- store spec files as `.md`
- generate deterministic file names:
  - `project-{projectId}/spec-{specId}.md`
- set content type to `text/markdown`
- use Vercel Blob best practices already used for canvas storage

#### Save flow integration

When `generateSpec` completes:

- upload Markdown to Blob
- create `ProjectSpec` record
- attach resulting `specId` to task output metadata
- publish a completion status message with the generated spec ID

#### Access control

- authenticate every download request
- verify project membership/ownership
- verify spec belongs to project
- never expose raw Blob URLs directly to the client
- always proxy downloads through the API route

#### Download response

Return headers:

- `Content-Type: text/markdown`
- `Content-Disposition: attachment; filename="<generated-name>.md"`

#### Error handling

Handle:

- missing spec record
- missing Blob file
- project access denied
- malformed IDs
- Blob fetch failures

Return proper HTTP status codes.

#### Logging

Log:

- spec creation
- spec download
- download failures

Include:

- projectId
- specId
- userId

Do not log spec content.

### Future Compatibility

Structure the model so future fields can be added easily:

- `title`
- `version`
- `createdBy`
- `blobSize`
- `generationRunId`

Do not implement these fields yet.

### Scope Limits

- do not add frontend or UI logic
- do not store spec content in Prisma
- do not expose Blob URLs without access checks
- do not modify existing canvas persistence
- do not implement spec editing
- do not implement spec version history yet

### Check When Done

- Generated specs are uploaded to Vercel Blob.
- `ProjectSpec` records are created in Prisma.
- Download route enforces authentication and project access.
- Downloaded files return valid Markdown.
- Blob URLs remain private behind the API route.
- Spec generation automatically persists completed specs.
- Error cases return correct status codes.
- `npm run build` passes.