import { clerkClient } from "@clerk/nextjs/server";

export type Collaborator = {
  email: string;
  name: string | null;
  imageUrl: string | null;
};

/**
 * Resolves a single Clerk user (the project owner) by user id into the same
 * shape as a collaborator. Returns null when the lookup fails.
 */
export async function enrichOwner(
  userId: string
): Promise<Collaborator | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    const fullName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    const name = fullName || user.username || null;

    const primary = user.emailAddresses.find(
      (address) => address.id === user.primaryEmailAddressId
    );
    const email =
      (primary ?? user.emailAddresses[0])?.emailAddress ?? "";

    return { email, name, imageUrl: user.hasImage ? user.imageUrl : null };
  } catch {
    return null;
  }
}

/**
 * Enriches collaborator emails with display name and avatar from Clerk using
 * the Clerk Backend API. Emails that do not match a Clerk user fall back to
 * the email only (name and imageUrl null). Order of the input emails is
 * preserved in the result.
 */
export async function enrichCollaborators(
  emails: string[]
): Promise<Collaborator[]> {
  if (emails.length === 0) return [];

  const byEmail = new Map<
    string,
    { name: string | null; imageUrl: string | null }
  >();

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      emailAddress: emails,
      limit: 500,
    });

    for (const user of users) {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();
      const name = fullName || user.username || null;
      const imageUrl = user.hasImage ? user.imageUrl : null;

      for (const address of user.emailAddresses) {
        byEmail.set(address.emailAddress.toLowerCase(), { name, imageUrl });
      }
    }
  } catch {
    // If the Clerk lookup fails, fall back to email-only for every entry.
  }

  return emails.map((email) => {
    const match = byEmail.get(email.toLowerCase());
    return {
      email,
      name: match?.name ?? null,
      imageUrl: match?.imageUrl ?? null,
    };
  });
}
