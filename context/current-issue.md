## Issues

### 1. Save Button in Workspace Navbar

Read the navbar component and the autosave hook before implementing.

The workspace navbar is missing a Save button. The autosave hook already exists and tracks saving/saved/error states — wire the button to it.

Add the Save button to the workspace navbar only. The navbar is shared with editor home so conditionally render the button based on workspace context — it must not appear on the editor home navbar.

Button behavior:

- default state: shows "Save"
- while saving: shows "Saving..."
- after successful save: shows "Saved" briefly then returns to "Save"
- on error: shows "Error" briefly then returns to "Save"
- clicking it triggers a manual save through the same save function the autosave hook uses
- disable the button while a save request is already in progress
- reuse the existing save status state instead of creating duplicate state

Also fix the canvas save API route.

Open:

```text
app/api/projects/[projectId]/canvas/route.ts