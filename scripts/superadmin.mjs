/**
 * One-off CLI to create or promote a superadmin directly in MongoDB.
 *
 * Usage:
 *   npm run superadmin -- email@example.com
 *   npm run superadmin -- email@example.com --promote            # promote existing user, keep password
 *   npm run superadmin -- "Name" email@example.com "password123" # create new admin with password
 *
 * Examples:
 *   npm run superadmin -- hello@example.com
 *     => if user exists, promote to superadmin
 *     => if not, fail (use --create or pass a name + password to create one)
 */
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
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

async function main() {
  const args = process.argv.slice(2);
  const flagIdx = args.findIndex((a) => a === "--promote");
  const promote = flagIdx !== -1;
  const positional = args.filter((a) => !a.startsWith("--"));

  if (positional.length < 1 || positional.length > 3) {
    console.error(`
Usage:
  npm run superadmin -- email
  npm run superadmin -- email --promote
  npm run superadmin -- "Name" email "password"
`);
    process.exit(1);
  }

  loadEnvFile();

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI environment variable.");
    process.exit(1);
  }

  let name, email, password;
  if (positional.length === 1) {
    email = positional[0].toLowerCase();
  } else if (positional.length === 2) {
    name = positional[0];
    email = positional[1].toLowerCase();
  } else {
    name = positional[0];
    email = positional[1].toLowerCase();
    password = positional[2];
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("gym-tracker");
    const users = db.collection("users");

    const existing = await users.findOne({ email });

    if (existing) {
      if (!promote) {
        if (password) {
          const passwordHash = await bcrypt.hash(password, 10);
          await users.updateOne({ email }, { $set: { role: "superadmin", passwordHash } });
          console.log(`Promoted "${email}" to superadmin and updated password.`);
        } else {
          await users.updateOne({ email }, { $set: { role: "superadmin" } });
          console.log(`Promoted "${email}" to superadmin.`);
        }
      } else {
        await users.updateOne({ email }, { $set: { role: "superadmin" } });
        console.log(`Promoted "${email}" to superadmin (password unchanged).`);
      }
      return;
    }

    if (!name || !password) {
      console.error(`No account exists for "${email}".`);
      console.error(`Create one with: npm run superadmin -- "Name" ${email} "password123"`);
      process.exit(1);
    }

    const initials = name
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();

    const passwordHash = await bcrypt.hash(password, 10);
    await users.insertOne({
      id: `u-${Math.random().toString(36).slice(2, 10)}`,
      email,
      name: name.trim(),
      initials,
      passwordHash,
      units: "kg",
      role: "superadmin",
      memberSince: new Date().toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      }),
    });

    console.log(`Created superadmin "${name}" (${email}).`);
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});