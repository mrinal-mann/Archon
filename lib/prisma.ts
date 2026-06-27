import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

/**
 * pg / pg-connection-string v3 will change the meaning of the `sslmode` aliases
 * `prefer`, `require`, and `verify-ca` (today they are all treated as
 * `verify-full`). Pin them to `verify-full` explicitly so the connection keeps
 * the exact same behavior and security guarantees it has now, and the
 * deprecation warning stops surfacing in the dev overlay.
 */
function pinSslMode(url: string | undefined): string | undefined {
  if (!url) return url;
  return url.replace(
    /([?&]sslmode=)(prefer|require|verify-ca)\b/gi,
    "$1verify-full",
  );
}

function createPrismaClient() {
  if (connectionString?.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: connectionString });
  }

  const adapter = new PrismaPg({ connectionString: pinSslMode(connectionString) });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Error fragments that indicate a transient connection failure rather than a
 * real query error. Prisma Postgres (and other serverless databases) pause when
 * idle, so the first query while the database cold-starts fails with one of
 * these before the connection becomes available.
 */
const TRANSIENT_DB_ERROR_FRAGMENTS = [
  "Failed to connect to upstream database",
  "Can't reach database server",
  "Connection terminated",
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
];

function isTransientDbError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return TRANSIENT_DB_ERROR_FRAGMENTS.some((fragment) =>
    message.includes(fragment),
  );
}

/**
 * Runs a database query, retrying with a short backoff when it fails with a
 * transient connection error (e.g. an idle Prisma Postgres database cold
 * starting). Non-transient errors and exhausted retries are rethrown so real
 * failures still surface.
 */
export async function withDbRetry<T>(
  query: () => Promise<T>,
  retries = 4,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await query();
    } catch (error) {
      lastError = error;
      if (!isTransientDbError(error) || attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
    }
  }
  throw lastError;
}
