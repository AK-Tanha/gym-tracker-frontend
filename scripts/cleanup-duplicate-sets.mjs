/**
 * Removes duplicate logged sets, keeping the FIRST log of each group.
 *
 * A group is one (date, exercise, setNumber) within a single athlete document.
 * "First" = earliest creation time parsed out of the `ls-<ms>-<rand>` id,
 * falling back to array position when the id carries no timestamp.
 *
 * Usage:
 *   node scripts/cleanup-duplicate-sets.mjs           # dry run (no writes)
 *   node scripts/cleanup-duplicate-sets.mjs --apply   # perform the cleanup
 *
 * Removed entries are written to a JSON backup before anything is deleted.
 */
import { MongoClient } from "mongodb";
import { readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APPLY = process.argv.includes("--apply");

function loadEnvFile() {
  const envPath = join(__dirname, "..", ".env.local");
  try {
    const contents = readFileSync(envPath, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      process.env[key] ??= value;
    }
  } catch {
    console.error("Could not read .env.local — set MONGODB_URI manually.");
  }
}

/** `ls-<ms epoch>-<random>` → ms, or null for ids from older builds. */
function idTime(id) {
  const m = /^ls-(\d{13})-/.exec(String(id ?? ""));
  return m ? Number(m[1]) : null;
}

function groupKey(e) {
  return `${e.date}|${e.exerciseId || e.exerciseName || "(unknown)"}|${e.setNumber}`;
}

function describe(e) {
  const t = idTime(e.id);
  const value =
    e.unit === "time" ? `${e.weight}kg × ${e.duration}s` : `${e.weight}kg × ${e.reps} reps`;
  return `${e.id}  ${t ? new Date(t).toISOString() : "no timestamp"}  ${value}`;
}

async function main() {
  loadEnvFile();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI environment variable.");
    process.exit(1);
  }

  const client = await MongoClient.connect(uri);
  try {
    const col = client.db("gym-tracker").collection("logged-sets");
    const docs = await col.find({}).toArray();

    let totalGroups = 0;
    let removed = 0;
    const backup = [];

    for (const doc of docs) {
      const entries = doc.entries ?? [];
      const groups = new Map();
      entries.forEach((e, idx) => {
        const key = groupKey(e);
        const arr = groups.get(key) ?? [];
        arr.push({ entry: e, idx });
        groups.set(key, arr);
      });

      const dropIdx = new Set();
      for (const [key, list] of groups) {
        if (list.length < 2) continue;
        totalGroups++;
        const ordered = [...list].sort((a, b) => {
          const ta = idTime(a.entry.id) ?? Number.MAX_SAFE_INTEGER;
          const tb = idTime(b.entry.id) ?? Number.MAX_SAFE_INTEGER;
          return ta - tb || a.idx - b.idx;
        });
        const keep = ordered[0];
        const drop = ordered.slice(1);
        console.log(`\n${key}  → keep 1, drop ${drop.length}`);
        console.log(`  KEEP  ${describe(keep.entry)}`);
        for (const d of drop) {
          dropIdx.add(d.idx);
          backup.push({ group: key, ...d.entry });
          console.log(`  DROP  ${describe(d.entry)}`);
        }
        removed += drop.length;
      }

      if (APPLY && dropIdx.size > 0) {
        const cleaned = entries.filter((_, i) => !dropIdx.has(i));
        await col.updateOne({ _id: doc._id }, { $set: { entries: cleaned } });
        console.log(
          `\n${doc._id}: ${entries.length} → ${cleaned.length} entries (${dropIdx.size} removed)`
        );
      }
    }

    if (backup.length > 0) {
      const path = join(tmpdir(), `duplicate-sets-backup-${Date.now()}.json`);
      writeFileSync(path, JSON.stringify(backup, null, 2));
      console.log(`\nBackup of removed entries: ${path}`);
    }

    console.log(
      `\n${totalGroups} duplicate groups, ${removed} rows to remove.` +
        (APPLY ? " APPLIED." : " DRY RUN — nothing written. Re-run with --apply.")
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Cleanup failed:", err?.message ?? err);
  process.exit(1);
});
