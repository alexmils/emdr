/**
 * Create or update a regular end-user with password.
 *
 * Usage:
 *   npx tsx scripts/seed-user.ts <email> <password> [name]
 */
import { config } from "dotenv";
config();

import { ensureSchemaReady } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import {
  createUser,
  getUserByEmail,
  setUserPassword,
} from "../lib/users";

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const name = process.argv[4];

  if (!email || !password) {
    console.error(
      "Usage: npx tsx scripts/seed-user.ts <email> <password> [name]"
    );
    process.exit(1);
  }

  await ensureSchemaReady();
  const passwordHash = await hashPassword(password);

  let user = await getUserByEmail(email);
  if (user) {
    await setUserPassword(user.id, passwordHash);
    user = (await getUserByEmail(email))!;
    console.log(`Updated password for ${user.email} (${user.role})`);
  } else {
    user = await createUser(email, name, "user");
    await setUserPassword(user.id, passwordHash);
    user = (await getUserByEmail(email))!;
    console.log(`Created user ${user.email} (${user.role})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
