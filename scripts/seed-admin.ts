/**
 * Seed platform admin and migrate orphan data.
 *
 * Usage:
 *   npx tsx scripts/seed-admin.ts [email] [password]
 */
import { config } from "dotenv";
config();

import { ensureSchemaReady } from "../lib/db";
import { hashPassword } from "../lib/auth/password";
import { upsertPlatformAdmin } from "../lib/users";
import {
  migrateLegacySettings,
  migrateOrphanDataToUser,
} from "../lib/rls-policies";
import { withRlsSession } from "../lib/rls";

async function main() {
  const email = process.argv[2] ?? "amilosavljevic09@gmail.com";
  const password = process.argv[3];

  if (!password) {
    console.error("Usage: npx tsx scripts/seed-admin.ts <email> <password>");
    process.exit(1);
  }

  await ensureSchemaReady();
  const passwordHash = await hashPassword(password);
  const admin = await upsertPlatformAdmin(
    email,
    passwordHash,
    "Platform Admin"
  );

  await withRlsSession(
    { userId: admin.id, role: "platform_admin" },
    async () => {
      await migrateOrphanDataToUser(admin.id);
      await migrateLegacySettings(admin.id);
    }
  );

  console.log(`Platform admin ready: ${admin.email} (${admin.role})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
