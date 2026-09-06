/**
 * One-off migration: move global (non-scoped) data to per-user scoped document IDs.
 *
 * Collections migrated: logged-sets, programs, profile
 *
 * Usage:
 *   node scripts/migrate-legacy-data.mjs
 */
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvFile() {
  const envPath = join(__dirname, "..", ".env.local");
  try {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq === -1) continue;
      process.env[t.slice(0, eq).trim()] ??= t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  } catch {
    console.error("Could not read .env.local — set MONGODB_URI manually.");
  }
}

loadEnvFile();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI environment variable.");
  process.exit(1);
}

const SCOPED_COLLECTIONS = ["logged-sets", "programs", "profile"];

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("gym-tracker");
    const users = await db.collection("users").find({ role: { $ne: "superadmin" } }).toArray();

    if (users.length === 0) {
      console.log("No athlete users found — nothing to migrate.");
      return;
    }

    for (const colName of SCOPED_COLLECTIONS) {
      const col = db.collection(colName);
      const legacyDoc = await col.findOne({ _id: colName });
      if (!legacyDoc) {
        console.log(`[${colName}] No legacy document — skipping.`);
        continue;
      }

      const targetId = `${colName}:${users[0].id}`;
      const existing = await col.findOne({ _id: targetId });

      if (existing) {
        console.log(`[${colName}] Scoped doc ${targetId} already exists — removing legacy.`);
        await col.deleteOne({ _id: colName });
        continue;
      }

      const { _id, ...rest } = legacyDoc;
      await col.insertOne({ _id: targetId, ...rest });
      await col.deleteOne({ _id: colName });
      console.log(`[${colName}] Migrated ${colName} → ${targetId}`);
    }

    console.log("\nMigration complete.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
