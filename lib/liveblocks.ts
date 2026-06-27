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
 * Builds (and caches) the Liveblocks node client on first use. The secret is
 * read here — at call time — rather than at module load so that importing this
 * module has no side effects.
 *
 * This matters during Trigger.dev deploys: the indexer imports every task file
 * (which transitively import this module) to discover tasks, and that happens
 * before runtime env vars are injected. Constructing the client eagerly threw
 * "Secret keys must start with 'sk_'" and aborted the deploy.
 */
function getLiveblocks(): Liveblocks {
  const cached = globalForLiveblocks.liveblocks;
  if (cached) return cached;

  const secret = process.env.LIVEBLOCKS_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "LIVEBLOCKS_SECRET_KEY is not set. Add it to this environment's variables (e.g. the Trigger.dev Production environment).",
    );
  }

  const client = new Liveblocks({ secret });
  // Cache across hot reloads in dev / warm task runs so a single instance is
  // reused instead of creating one per request.
  globalForLiveblocks.liveblocks = client;
  return client;
}

/**
 * Lazy proxy around the Liveblocks node client. Importing this module never
 * constructs the client; the real instance is created on the first property
 * access (a method call), at runtime, when the secret is available.
 */
export const liveblocks = new Proxy({} as Liveblocks, {
  get(_target, prop, receiver) {
    const client = getLiveblocks();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
