import { getCursorColor, liveblocks } from "@/lib/liveblocks";
import { getCurrentIdentity, getProjectAccess } from "@/lib/project-access";
import { enrichOwner } from "@/lib/collaborators";

/**
 * Liveblocks authentication endpoint. The project id is used as the Liveblocks
 * room id, so the request must reference a project the user can access.
 *
 * Flow:
 * 1. require Clerk authentication
 * 2. verify project access via the shared access helper
 * 3. ensure the Liveblocks room exists (create only if missing)
 * 4. return a session token carrying the user's name, avatar, and cursor color
 */
export async function POST(req: Request) {
  const identity = await getCurrentIdentity();
  if (!identity) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const room = (body as { room?: unknown })?.room;
  if (typeof room !== "string" || room.length === 0) {
    return Response.json({ error: "Missing room" }, { status: 400 });
  }

  // The project id is the room id.
  const access = await getProjectAccess(room, identity);
  if (!access) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Ensure the room exists, creating it only when it is not there yet.
  try {
    await liveblocks.getRoom(room);
  } catch {
    await liveblocks.createRoom(room, { defaultAccesses: [] });
  }

  // Resolve the signed-in user's display name and avatar from Clerk.
  const profile = await enrichOwner(identity.userId);
  const cursorColor = getCursorColor(identity.userId);

  const session = liveblocks.prepareSession(identity.userId, {
    userInfo: {
      name: profile?.name ?? identity.email ?? "Anonymous",
      avatar: profile?.imageUrl ?? undefined,
      cursorColor,
    },
  });
  session.allow(room, session.FULL_ACCESS);

  const { status, body: token } = await session.authorize();
  return new Response(token, { status });
}
