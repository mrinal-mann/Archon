// Define Liveblocks types for your application
// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
import type { LiveList } from "@liveblocks/client";
import type { LiveblocksFlow } from "@liveblocks/react-flow";

import type { AiPresence, CanvasEdge, CanvasNode } from "@/types/canvas";
import type { AiChatMessage, AiStatusFeedMessage } from "@/types/tasks";

declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Real-time cursor coordinates, null when the cursor leaves the canvas.
      cursor: { x: number; y: number } | null;
      // Whether the user is currently waiting on an AI response.
      thinking: boolean;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // The collaborative React Flow diagram, synced by useLiveblocksFlow
      // under the default "flow" storage key. Optional because the hook
      // creates it lazily from its `initial` option, so RoomProvider does
      // not need to supply `initialStorage`.
      flow?: LiveblocksFlow<CanvasNode, CanvasEdge>;
      // AI design-agent presence + status feed, published by the background
      // task so all participants see the same live progress. Optional because
      // it only exists once a design run has touched the room.
      ai?: AiPresence;
      // Shared AI status feed: the single most recent status message, visible
      // to everyone in the room. Generic across design + spec generation.
      // Optional because it only exists once an AI flow has published to it.
      "ai-status-feed"?: AiStatusFeedMessage;
      // Realtime room chat feed: an ordered list of human-authored messages,
      // separate from the AI status feed. Optional because it is created lazily
      // on the first message sent in the room.
      "ai-chat"?: LiveList<AiChatMessage>;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        // Display name shown next to the user's cursor and avatar.
        name: string;
        // Avatar image URL, omitted when the user has no avatar.
        avatar?: string;
        // Deterministic cursor color derived from the user id.
        cursorColor: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};
      // Example has two events, using a union
      // | { type: "PLAY" } 
      // | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      // Example, attaching coordinates to a thread
      // x: number;
      // y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      // title: string;
      // url: string;
    };
  }
}

export {};
