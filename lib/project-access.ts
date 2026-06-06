import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import type { ProjectRole } from "@/lib/projects";

export type CurrentIdentity = {
  userId: string;
  email: string | undefined;
};

/**
 * Resolves the signed-in Clerk user's id and primary email address. Returns
 * null when there is no authenticated user.
 */
export async function getCurrentIdentity(): Promise<CurrentIdentity | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const primary = user?.emailAddresses.find(
    (address) => address.id === user.primaryEmailAddressId
  );
  const email = (primary ?? user?.emailAddresses[0])?.emailAddress;

  return { userId, email };
}

export type ProjectAccess = {
  project: { id: string; name: string };
  role: ProjectRole;
};

/**
 * Checks whether the given identity can access a project, either as its owner
 * or as an invited collaborator (matched on email). Returns the project plus
 * the user's role, or null when the project does not exist or is not shared
 * with the user.
 */
export async function getProjectAccess(
  projectId: string,
  identity: CurrentIdentity
): Promise<ProjectAccess | null> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) return null;

  if (project.ownerId === identity.userId) {
    return { project: { id: project.id, name: project.name }, role: "owner" };
  }

  if (identity.email) {
    const collaborator = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_email: { projectId, email: identity.email },
      },
    });
    if (collaborator) {
      return {
        project: { id: project.id, name: project.name },
        role: "collaborator",
      };
    }
  }

  return null;
}
