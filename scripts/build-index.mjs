// Regenerates index.json from games/*.json. `--check` exits 1 when index.json is stale.
// The Worker writes index.json with the same layout (see worker/src/merge.ts), so keep the two in step.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const gamesDir = join(root, "games");
const indexPath = join(root, "index.json");

export function buildIndex() {
  const games = readdirSync(gamesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const g = JSON.parse(readFileSync(join(gamesDir, f), "utf8"));
      const entry = { slug: g.slug, name: g.name };
      if (g.steamAppId != null) entry.steamAppId = g.steamAppId;
      if (g.msStoreId != null) entry.msStoreId = g.msStoreId;
      if (Array.isArray(g.aliases) && g.aliases.length) entry.aliases = [...g.aliases];
      return entry;
    })
    .sort((a, b) => (a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0));
  return JSON.stringify({ version: 1, games }, null, 2) + "\n";
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const next = buildIndex();
  if (process.argv.includes("--check")) {
    let current = "";
    try {
      current = readFileSync(indexPath, "utf8").replace(/\r\n/g, "\n");
    } catch {}
    if (current !== next) {
      console.error("index.json is out of date. Run: node scripts/build-index.mjs");
      process.exit(1);
    }
    console.log("index.json is up to date.");
  } else {
    writeFileSync(indexPath, next);
    console.log("Wrote index.json");
  }
}
