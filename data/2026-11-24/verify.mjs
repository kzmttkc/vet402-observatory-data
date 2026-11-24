// Recompute vet402 day roots from this directory.
// root = sha256((prevRoot or "genesis") + "\n" + day file bytes)
// No dependencies. Exit 0 when every sealed day recomputes and links and SHA256SUMS matches.
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, acc);
    else acc.push(relative(root, abs).split("\\").join("/"));
  }
  return acc;
}

function sha256(buf) {
  return createHash("sha256").update(buf).digest("hex");
}

function dayRoot(prevRoot, bytes) {
  return createHash("sha256").update(prevRoot ?? "genesis").update("\n").update(bytes).digest("hex");
}

function failPath(rel) {
  if (rel.startsWith("/") || rel.split("/").includes("..")) return false;
  return true;
}

let checksumsOk = true;
const sumsText = readFileSync(join(root, "SHA256SUMS"), "utf8");
const listed = new Set();
for (const line of sumsText.split("\n")) {
  if (!line) continue;
  const match = /^([0-9a-f]{64})  (.+)$/.exec(line);
  if (!match || !failPath(match[2])) {
    console.log("FAIL SHA256SUMS");
    checksumsOk = false;
    continue;
  }
  listed.add(match[2]);
  const got = sha256(readFileSync(join(root, match[2])));
  if (got !== match[1]) {
    console.log("FAIL " + match[2]);
    checksumsOk = false;
  }
}
for (const rel of walk(root, []).filter((p) => p !== "SHA256SUMS" && p !== "manifest.json").sort()) {
  if (!listed.has(rel)) {
    console.log("FAIL " + rel);
    checksumsOk = false;
  }
}

const anchorsDoc = JSON.parse(readFileSync(join(root, "anchors.json"), "utf8"));
if (!anchorsDoc || !Array.isArray(anchorsDoc.anchors)) {
  console.log("FAIL anchors.json");
  process.exit(1);
}
const rows = anchorsDoc.anchors.slice().sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
const indexDoc = JSON.parse(readFileSync(join(root, "days", "index.json"), "utf8"));
const table = indexDoc && indexDoc.days && typeof indexDoc.days === "object" ? indexDoc.days : {};
let ok = 0;
let drift = 0;
let fail = 0;
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const meta = table[row.day] || null;
  const source = meta && typeof meta.source === "string" ? meta.source : null;
  const linked = i === 0 ? true : row.prevRoot === rows[i - 1].rootHash;
  let bytes = null;
  try {
    bytes = readFileSync(join(root, "days", row.day + ".json"));
  } catch {
    bytes = null;
  }
  const recomputed = bytes ? dayRoot(row.prevRoot ?? null, bytes) : null;
  const matches = bytes !== null && recomputed === row.rootHash && linked;
  if (source === "current") {
    console.log(row.day + " drift (source=current)");
    drift++;
    continue;
  }
  if (source === "sealed" && matches) {
    console.log(row.day + " ok");
    ok++;
    continue;
  }
  console.log(row.day + " FAIL");
  fail++;
}
console.log("summary ok=" + ok + " drift=" + drift + " fail=" + fail);
process.exit(checksumsOk && fail === 0 ? 0 : 1);
