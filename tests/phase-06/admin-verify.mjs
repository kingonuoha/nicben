/**
 * Phase 06 — the checks that need no server: the credentials-absent build, the
 * bundling proof, and the discoverability controls.
 *
 * Everything here is a measurement, printed with its exit code, so the phase's
 * "zero environment variables set" acceptance can be read rather than trusted:
 * `decisions.md` D-026 … D-030 were each chosen to preserve that property, and the
 * portal is the first surface where getting it wrong would mean a screen that throws
 * instead of a screen that refuses.
 *
 * Run: node tests/phase-06/admin-verify.mjs
 */

import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { PROJECT_ROOT, credentialsAbsentEnv, run, verifyAbsent, check, section, summary } from "./harness.mjs";

const env = credentialsAbsentEnv();
verifyAbsent(env);

section("Credentials-absent compile (zero environment variables)");
const build = await run("npm", ["run", "build"], { env });
check("npm run build exits 0 with no environment", build.code === 0, `exit ${build.code}`);
const routeLines = build.stdout
  .split(/\r?\n/)
  .filter((line) => /[├└│]\s*[○ƒ]\s*\/admin/.test(line))
  .map((line) => line.trim());
check("the build reports the portal's routes", routeLines.length >= 8, `${routeLines.length} admin routes`);
process.stdout.write(routeLines.map((line) => `     ${line}\n`).join(""));

const typeCheck = await run("npm", ["run", "type-check"], { env });
check("npm run type-check exits 0 with no environment", typeCheck.code === 0, `exit ${typeCheck.code}`);

const lint = await run("npx", ["eslint", ".", "--max-warnings", "0"], { env });
check("eslint exits 0 with --max-warnings 0 and no environment", lint.code === 0, `exit ${lint.code}`);

section("No credential material in the client bundles");
const staticDir = path.join(PROJECT_ROOT, ".next", "static");
const forbidden = ["$argon2", "ADMIN_PASSWORD_HASH", "ADMIN_SESSION_SECRET", "node:crypto", "@node-rs", "nicben_admin_session"];
const hits = [];

async function walk(directory) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolute);
      continue;
    }
    if (!/\.(js|mjs|json|txt|css)$/.test(entry.name)) continue;
    const contents = await readFile(absolute, "utf8");
    for (const needle of forbidden) {
      if (contents.includes(needle)) {
        hits.push({ file: path.relative(PROJECT_ROOT, absolute).split(path.sep).join("/"), needle });
      }
    }
  }
}

await walk(staticDir);
const bundleCount = (await readdir(staticDir, { recursive: true })).length;
process.stdout.write(`     scanned ${bundleCount} entries under .next/static\n`);
check("no credential marker reached the browser bundles", hits.length === 0, hits.length === 0 ? "0 matches" : JSON.stringify(hits.slice(0, 6)));

section("Discoverability controls (D-004)");
const header = await readFile(path.join(PROJECT_ROOT, "components", "layout", "Header.tsx"), "utf8");
const footer = await readFile(path.join(PROJECT_ROOT, "components", "layout", "Footer.tsx"), "utf8");
const sitemap = await readFile(path.join(PROJECT_ROOT, "app", "sitemap.ts"), "utf8");
const robots = await readFile(path.join(PROJECT_ROOT, "app", "robots.ts"), "utf8");

check("the public header does not link /admin", !/(href=["'{`])\/admin/.test(header));
check("the public footer does not link /admin", !/(href=["'{`])\/admin/.test(footer));
check("sitemap.xml does not list /admin", !/path: *"\/admin/.test(sitemap), "no /admin entry");
check("robots.txt still disallows /admin", /disallow: *\[[^\]]*"\/admin"/.test(robots), "disallow entry present");

const nextConfig = await readFile(path.join(PROJECT_ROOT, "next.config.mjs"), "utf8");
check(
  "every /admin response carries X-Robots-Tag (next.config.mjs)",
  nextConfig.includes("X-Robots-Tag") && nextConfig.includes("/api/admin/:path*"),
);

section("Harness hygiene (D-011)");
const publicDir = path.join(PROJECT_ROOT, "public");
let publicHarness = [];
async function scanPublic(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await scanPublic(absolute);
      continue;
    }
    if (/probe|harness|measure|cdp|admin-.*test/i.test(entry.name)) publicHarness.push(entry.name);
  }
}
await scanPublic(publicDir);
check("no measurement artefact lives under public/", publicHarness.length === 0, publicHarness.join(", ") || "clean");

const testsDir = path.join(PROJECT_ROOT, "tests");
const harnessFiles = (await readdir(path.join(testsDir, "phase-06"))).filter((name) => name.endsWith(".mjs"));
check("the phase 06 harnesses live under tests/", harnessFiles.length >= 4, harnessFiles.join(", "));
await stat(testsDir);

const outcome = summary();
// `process.exitCode` rather than `process.exit`: the latter can truncate the
// summary on a pipe, which would hide the very output this harness exists to produce.
process.exitCode = outcome.failed === 0 ? 0 : 1;
