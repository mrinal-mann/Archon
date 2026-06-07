import "server-only";

import { Liveblocks } from "@liveblocks/node";

/**
 * Fixed cursor color palette. Colors are mapped deterministically from a user
 * id so the same user always renders with the same color across sessions.
 */
const CURSOR_PALETTE = [
  "#E5484D", // red
  "#E54D9F", // pink
  "#8E4EC6", // purple
  "#3E63DD", // blue
  "#0091FF", // sky
  "#12A594", // teal
  "#30A46C", // green
  "#FFB224", // amber
  "#F76B15", // orange
] as const;

/**
 * Deterministically maps a user id to a consistent color from the fixed
 * palette. The same id always resolves to the same color.
 */
export function getCursorColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % CURSOR_PALETTE.length;
  return CURSOR_PALETTE[index];
}

const globalForLiveblocks = globalThis as unknown as {
  liveblocks: Liveblocks | undefined;
};

/**
 * Cached Liveblocks node client. Reused across hot reloads in development so a
 * single instance is shared instead of creating one per request.
 */
export const liveblocks =
  globalForLiveblocks.liveblocks ??
  new Liveblocks({ secret: process.env.LIVEBLOCKS_SECRET_KEY ?? "" });

if (process.env.NODE_ENV !== "production") {
  globalForLiveblocks.liveblocks = liveblocks;
}
