// CI gate for every PR: schema, file name matches slug, https only, no duplicate URLs or
// section titles within a game, no store id shared by two games.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(readFileSync(join(root, "schema", "game.schema.json"), "utf8"));
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const check = ajv.compile(schema);

// Must match normalizeUrl in worker/src/validate.ts so the Worker and CI agree on duplicates.
function normalizeUrl(raw) {
  const u = new URL(raw);
  u.hash = "";
  let s = u.toString();
  if (u.pathname !== "/" && s.endsWith("/") && !u.search) s = s.slice(0, -1);
  return s;
}

const errors = [];
const storeIds = new Map();
const gamesDir = join(root, "games");

for (const file of readdirSync(gamesDir).filter((f) => f.endsWith(".json")).sort()) {
  const where = `games/${file}`;
  let game;
  try {
    game = JSON.parse(readFileSync(join(gamesDir, file), "utf8"));
  } catch (e) {
    errors.push(`${where}: invalid JSON (${e.message})`);
    continue;
  }
  if (!check(game)) {
    for (const err of check.errors) errors.push(`${where}${err.instancePath}: ${err.message}`);
    continue;
  }
  if (file !== `${game.slug}.json`) errors.push(`${where}: file name must be ${game.slug}.json`);

  for (const key of ["steamAppId", "msStoreId"]) {
    if (game[key] == null) continue;
    const id = `${key}:${game[key]}`;
    if (storeIds.has(id)) errors.push(`${where}: ${key} ${game[key]} already used by ${storeIds.get(id)}`);
    else storeIds.set(id, where);
  }

  const titles = new Set();
  const urls = new Set();
  for (const section of game.sections) {
    const t = section.title.trim().toLowerCase();
    if (titles.has(t)) errors.push(`${where}: duplicate section "${section.title}"`);
    titles.add(t);
    for (const r of section.resources) {
      let u;
      try {
        u = new URL(r.url);
      } catch {
        errors.push(`${where}: bad URL ${r.url}`);
        continue;
      }
      if (u.protocol !== "https:") errors.push(`${where}: URL must be https: ${r.url}`);
      if (u.username || u.password) errors.push(`${where}: URL must not carry credentials: ${r.url}`);
      const n = normalizeUrl(r.url);
      if (urls.has(n)) errors.push(`${where}: duplicate URL ${r.url}`);
      urls.add(n);
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error(e);
  process.exit(1);
}
console.log("All game files valid.");
