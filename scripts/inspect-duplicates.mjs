/**
 * Read-only diagnostic: prints logged-set entries that look duplicated
 * (same athlete, date, exercise and setNumber).
 *
 * Usage: node scripts/inspect-duplicates.mjs [date]
 */
import { MongoClient } from "mongodb";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

/** ids look like `ls-<ms epoch>-<random>` — pull the epoch out. */
function idTime(id) {
  const m = /^ls-(\d{13})-/.exec(String(id ?? ""));
  return m ? Number(m[1]) : null;
}

async function main() {
  loadEnvFile();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI environment variable.");
    process.exit(1);
  }
  const onlyDate = process.argv[2];
  const client = await MongoClient.connect(uri);
  try {
    const col = client.db("gym-tracker").collection("logged-sets");
    const docs = await col.find({}).toArray();
    let total = 0;
    let dupes = 0;
    let sameIdGroups = 0;
    let distinctIdGroups = 0;
    for (const doc of docs) {
      const entries = doc.entries ?? [];
      total += entries.length;
      const groups = new Map();
      for (const e of entries) {
        if (onlyDate && e.date !== onlyDate) continue;
        const key = `${e.date}|${e.exerciseName}|${e.setNumber}`;
        const arr = groups.get(key) ?? [];
        arr.push(e);
        groups.set(key, arr);
      }
      for (const [key, list] of groups) {
        if (list.length < 2) continue;
        dupes += list.length;
        const idSet = new Set(list.map((e) => e.id));
        if (idSet.size === 1) sameIdGroups++;
        else distinctIdGroups++;
        console.log(`\n${key}  (${list.length} entries)`);
        for (const e of list) {
          const t = idTime(e.id);
          console.log(
            `  id=${e.id}  createdAt=${t ? new Date(t).toISOString() : "n/a"}` +
              `  exerciseId=${e.exerciseId || "(none)"}` +
              `  ${e.unit === "time" ? `${e.weight}kg × ${e.duration}s` : `${e.weight}kg × ${e.reps} reps`}` +
              `  notes=${JSON.stringify(e.notes || "")}`
          );
        }
        const times = list.map(idTime).filter(Boolean).sort((a, b) => a - b);
        if (times.length > 1) {
          const gaps = times.slice(1).map((t, i) => `${t - times[i]}ms`);
          console.log(`  gaps between creations: ${gaps.join(", ")}`);
        }
        const exIds = new Set(list.map((e) => e.exerciseId || "(none)"));
        console.log(`  distinct exerciseIds: ${exIds.size}`);
      }
    }
    console.log(`\nChecked ${total} entries; ${dupes} involved in duplicates.`);
    console.log(
      `  identical id (double-post): ${sameIdGroups} groups — hidden by the API dedupe.\n` +
        `  different id (replayed day): ${distinctIdGroups} groups — still stored.`
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Inspect failed:", err?.message ?? err);
  process.exit(1);
});
