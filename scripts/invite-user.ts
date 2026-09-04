/**
 * Create or invite a user from the command line.
 *
 * Usage (with .env loaded):
 *   npx tsx scripts/invite-user.ts user@example.com "Display Name"
 */
import { createUser, getUserByEmail } from "../lib/users";
import { createAuthToken } from "../lib/auth/tokens";
import { getAppUrl, sendTemplateEmail } from "../lib/email";

async function main() {
  const email = process.argv[2];
  const name = process.argv[3];

  if (!email) {
    console.error("Usage: npx tsx scripts/invite-user.ts <email> [name]");
    process.exit(1);
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    console.error(`User already exists: ${email}`);
    process.exit(1);
  }

  const user = await createUser(email, name);
  const raw = await createAuthToken(user.id, "invite");
  const createPasswordUrl = `${await getAppUrl(
    `/create-password?token=${encodeURIComponent(raw)}`
  )}`;

  await sendTemplateEmail(user.email, "welcome_invite", {
    name: user.name ?? user.email.split("@")[0],
    createPasswordUrl,
    expiresIn: "72 hours",
  });

  console.log(`Invited ${user.email}`);
  console.log(`Create-password link (dev): ${createPasswordUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
