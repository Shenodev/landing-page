#!/usr/bin/env node
/**
 * Diagnostic validator for the favicon / SEO asset set.
 *
 * File checks (no server required):
 *   node scripts/verify-favicons.mjs
 *
 * HTTP route checks (requires a running server, e.g. `npm run dev`):
 *   node scripts/verify-favicons.mjs --base http://localhost:3000
 *
 * Exits non-zero on failure and prints detailed results.
 */

import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

const EXPECTED = [
  { url: "/favicon.ico", rel: "src/app/favicon.ico", mime: "image/x-icon", type: "ico" },
  { url: "/assets/favicon-48x48.png", rel: "assets/favicon-48x48.png", mime: "image/png", type: "png", size: 48, multipleOf48: true },
  { url: "/assets/favicon-96x96.png", rel: "assets/favicon-96x96.png", mime: "image/png", type: "png", size: 96, multipleOf48: true },
  { url: "/assets/favicon-144x144.png", rel: "assets/favicon-144x144.png", mime: "image/png", type: "png", size: 144, multipleOf48: true },
  { url: "/assets/favicon-192x192.png", rel: "assets/favicon-192x192.png", mime: "image/png", type: "png", size: 192, multipleOf48: true },
  { url: "/assets/favicon-512x512.png", rel: "assets/favicon-512x512.png", mime: "image/png", type: "png", size: 512 },
  { url: "/assets/apple-touch-icon.png", rel: "assets/apple-touch-icon.png", mime: "image/png", type: "png", size: 180 },
  { url: "/site.webmanifest", rel: "site.webmanifest", mime: "application/manifest+json", type: "manifest" },
];

const errors = [];
const info = [];
const pushErr = (url, msg) => errors.push(`${url} — ${msg}`);
const pushInfo = (url, msg) => info.push(`${url} — ${msg}`);

function checkPng(url, bytes, expectedSize, multipleOf48) {
  const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
  if (!bytes.subarray(0, 4).equals(PNG)) { pushErr(url, "missing PNG magic bytes"); return; }
  const w = bytes.readUInt32BE(16);
  const h = bytes.readUInt32BE(20);
  if (expectedSize && (w !== expectedSize || h !== expectedSize)) {
    pushErr(url, `expected ${expectedSize}x${expectedSize}, got ${w}x${h}`);
  } else if (w !== h) {
    pushErr(url, `not square: ${w}x${h}`);
  }
  if (multipleOf48 && (w % 48 !== 0 || h % 48 !== 0)) {
    pushErr(url, `dimensions not a multiple of 48 (${w}x${h})`);
  }
  pushInfo(url, `${w}x${h}`);
}

function checkIco(url, bytes) {
  if (bytes.length < 6) { pushErr(url, "file too small for ICO header"); return; }
  const type = bytes.readUInt16LE(2);
  const count = bytes.readUInt16LE(4);
  if (type !== 1) { pushErr(url, `type ${type} (expected 1 = image)`); return; }
  const sizes = [];
  for (let i = 0; i < count; i++) {
    const base = 6 + 16 * i;
    if (base + 16 > bytes.length) { pushErr(url, "header truncated"); return; }
    const s = bytes[base] || 256;
    const imgLen = bytes.readUInt32LE(base + 8);
    const imgOff = bytes.readUInt32LE(base + 12);
    sizes.push(`${s}x${s}`);
    if (imgOff + imgLen > bytes.length) { pushErr(url, "image data truncated"); return; }
    const png = bytes.subarray(imgOff, imgOff + 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    if (!png) pushErr(url, `entry ${s}x${s} not PNG-compressed`);
  }
  if (!sizes.includes("48x48")) pushErr(url, "missing 48x48 entry (Google requirement)");
  pushInfo(url, `entries: ${sizes.join(", ")}`);
}

async function checkManifest(url, bytes) {
  try {
    const json = JSON.parse(Buffer.from(bytes).toString("utf8"));
    if (!Array.isArray(json.icons) || json.icons.length === 0) { pushErr(url, "no icons array"); return; }
    for (const ic of json.icons) {
      const rel = String(ic.src || "").replace(/^\//, "");
      const p = path.join(PUBLIC, rel);
      try { await stat(p); } catch { pushErr(url, `missing referenced icon: ${ic.src}`); }
    }
    pushInfo(url, `${json.icons.length} icon(s) declared`);
  } catch (e) { pushErr(url, `invalid JSON: ${e.message}`); }
}

async function fileChecks() {
  for (const exp of EXPECTED) {
    const full = exp.rel.startsWith("src/") ? path.join(ROOT, exp.rel) : path.join(PUBLIC, exp.rel);
    let bytes;
    try { bytes = await readFile(full); } catch { pushErr(exp.url, "file missing"); continue; }
    if (exp.type === "png") checkPng(exp.url, bytes, exp.size, exp.multipleOf48);
    else if (exp.type === "ico") checkIco(exp.url, bytes);
    else if (exp.type === "manifest") await checkManifest(exp.url, bytes);
  }
}

async function httpChecks(base) {
  for (const exp of EXPECTED) {
    const url = `${base}${exp.url}`;
    try {
      const res = await fetch(url, { redirect: "manual" });
      if (res.status !== 200) { pushErr(url, `HTTP ${res.status}`); continue; }
      const ct = String(res.headers.get("content-type") || "");
      if (!ct.includes(exp.mime)) pushErr(url, `content-type ${ct} (expected ${exp.mime})`);
      else pushInfo(url, `HTTP 200 · content-type ${ct}`);
    } catch (e) { pushErr(url, `fetch failed: ${e.message}`); }
  }
}

async function main() {
  const idx = process.argv.indexOf("--base");
  const base = idx !== -1 ? process.argv[idx + 1] : null;

  await fileChecks();
  if (base) await httpChecks(base);

  console.log("\n--- Favicon Audit ---\n");
  for (const m of info) console.log(`  OK  ${m}`);
  for (const m of errors) console.error(`  ERR ${m}`);
  console.log(`\n${errors.length} error(s), ${info.length} ok(s)`);
  if (!base) console.log("  (HTTP route checks skipped — pass --base http://localhost:3000 to run them)\n");

  process.exitCode = errors.length > 0 ? 1 : 0;
}

main();