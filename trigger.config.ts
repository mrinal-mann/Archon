import { prismaExtension } from "@trigger.dev/build/extensions/prisma";
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  // Replace with your project ref (starts with `proj_`) from the Trigger.dev
  // dashboard. Running `npx trigger.dev@latest login` then `init` can fill this
  // in automatically.
  project: "proj_kmbymuaympwpcrwiwvqr",
  runtime: "node",
  dirs: ["trigger"],
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    // Prisma 7 with the `prisma-client` provider + `@prisma/adapter-pg`, so the
    // task uses the TypeScript client (no Rust engine). Modern mode marks
    // `@prisma/client` external; the generated client in `generated/prisma` is
    // produced by `prisma generate` and bundled with the deploy.
    extensions: [prismaExtension({ mode: "modern" })],
  },
  maxDuration: 3600,
});
