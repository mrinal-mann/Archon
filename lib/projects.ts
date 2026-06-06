import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export type ProjectRole = "owner" | "collaborator";

export type ProjectSummary = {
  id: string;
  name: string;
  role: ProjectRole;
};

export type UserProjects = {
  owned: ProjectSummary[];
  shared: ProjectSummary[];
};

function primaryEmail(): Promise<string | undefined> {
  return currentUser().then((user) => {
    if (!user) return undefined;
    const primary = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId
    );
    return (primary ?? user.emailAddresses[0])?.emailAddress;
  });
}

/**
 * Server-side helper that loads the signed-in user's projects: the ones they
 * own and the ones shared with them through a collaborator invite (matched on
 * their email). Returns empty lists when unauthenticated.
 */
export async function getUserProjects(): Promise<UserProjects> {
  const { userId } = await auth();
  if (!userId) {
    return { owned: [], shared: [] };
  }

  const email = await primaryEmail();

  const [owned, shared] = await Promise.all([
    prisma.project.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    }),
    email
      ? prisma.project.findMany({
          where: { collaborators: { some: { email } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return {
    owned: owned.map((project) => ({
      id: project.id,
      name: project.name,
      role: "owner" as const,
    })),
    shared: shared.map((project) => ({
      id: project.id,
      name: project.name,
      role: "collaborator" as const,
    })),
  };
}
