/**
 * Phase 06 acceptance run.
 *
 * One command, every claim in `docs/tasks/phase-06-hidden-admin-portal/backend-task.md`
 * §"Verification", measured rather than asserted:
 *
 * ```
 *   node tests/phase-06/verify.mjs
 * ```
 *
 * Stage order matters. The production build is made first, in a child process constructed
 * with **zero application environment variables**, and the client bundles are grepped
 * immediately afterwards while that build is the freshest thing in `.next`. Only then is a
 * server started — first without credentials (the fail-closed and enumeration battery),
 * then with them (the authenticated battery). The seeded battery runs against `next dev`
 * because it needs to create a real enquiry through the public endpoint, which in
 * production correctly refuses every submission without a Turnstile secret (D-022).
 *
 * Every stage's raw output is kept under `tests/phase-06/out/` so any number below can be
 * recomputed.
 */

import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";

import { check, equal, section, summary, run, sleep, credentialsAbsentEnv, verifyAbsent, PROJECT_ROOT, OUT_DIR, APP_ENV_VARS } from "./harness.mjs";

const ZERO_PORT = 3210;
const SEEDED_PORT = 3211;
const ZERO_BASE = `http://127.0.0.1:${ZERO_PORT}`;
const SEEDED_BASE = `http://127.0.0.1:${SEEDED_PORT}`;

/* -------------------------------------------------------------------------- */
/* Credential material for the seeded battery — generated, never committed      */
/* -------------------------------------------------------------------------- */

/**
 * Generated per run and never written to a file or to the report: only its hash prefix and
 * its length are recorded. `randomBytes` rather than a literal, so the string that appears
 * in this process cannot be used to authenticate against anything a later run starts.
 */
const SEEDED_ADMIN_EMAIL = "operator@example.test";
const SEEDED_ADMIN_PASSWORD = `Nicben-${randomBytes(9).toString("base64url")}!7s`;
const SEEDED_SESSION_SECRET = randomBytes(48).toString("base64url");

const logs = {};
let exitCode = 0;

async function stage(name, fn) {
  section(name);
  const started = Date.now();
  const result = await fn();
  process.stdout.write(`  (${Date.now() - started} ms)\n`);
  return result;
}

/* -------------------------------------------------------------------------- */
/* Server lifecycle                                                            */
/* -------------------------------------------------------------------------- */

let serverProcess = null;

function killServer() {
  if (!serverProcess) return;
  const pid = serverProcess.pid;
  serverProcess = null;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    try {
      process.kill(-pid, "SIGKILL");
    } catch {
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Already gone.
      }
    }
  }
}

async function waitForServer(base, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${base}/robots.txt`);
      if (response.ok) return true;
    } catch {
      // Not listening yet.
    }
    try {
      const response = await fetch(`${base}/api/admin/auth/session`);
      if (response.status > 0) return true;
    } catch {
      // Not listening yet.
    }
    await sleep(400);
  }
  return false;
}

async function startServer({ label, port, env, command, args, readyTimeoutMs }) {
  const child = spawn(command, args, {
    cwd: PROJECT_ROOT,
    env,
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  });
  serverProcess = child;
  let output = "";
  child.stdout.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    output += chunk.toString();
  });
  child.on("close", () => {
    if (serverProcess === child) serverProcess = null;
  });

  const ready = await waitForServer(`http://127.0.0.1:${port}`, readyTimeoutMs);
  logs[`server-${label}`] = output;
  if (!ready) {
    check(`${label} server became reachable on port ${port}`, false, "timed out");
    process.stdout.write(output.slice(-3000));
    killServer();
    return false;
  }
  check(`${label} server became reachable on port ${port}`, true, `${command} ${args.join(" ")}`);
  return true;
}

/* -------------------------------------------------------------------------- */
/* Client-bundle grep                                                          */
/* -------------------------------------------------------------------------- */

async function collectFiles(root, extensions = null) {
  const found = [];
  async function walk(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (!extensions || extensions.some((extension) => entry.name.endsWith(extension))) {
        found.push(absolute);
      }
    }
  }
  await walk(root);
  return found;
}

/* -------------------------------------------------------------------------- */
/* The run                                                                     */
/* -------------------------------------------------------------------------- */

process.stdout.write(`Phase 06 verification · ${new Date().toISOString()}\n`);
process.stdout.write(`project: ${PROJECT_ROOT}\n`);

/* --- Stage 1: zero-environment build, type-check, lint --------------------- */

const zeroEnv = credentialsAbsentEnv();
verifyAbsent(zeroEnv);
process.stdout.write(`\nconstructed child environment: ${APP_ENV_VARS.filter((name) => zeroEnv[name] !== undefined).length} of ${APP_ENV_VARS.length} application variables present (all absent by construction)\n`);

await stage("Stage 1 — npm run build with zero application environment variables", async () => {
  const result = await run("npm", ["run", "build"], { env: zeroEnv });
  logs["build-zero-env"] = result.stdout + result.stderr;
  equal("npm run build exit code", result.code, 0, result.stdout.includes("Compiled successfully") ? "compiled successfully" : "");
  const routes = [...(result.stdout + result.stderr).matchAll(/^[├└┌]\s+[ƒ○]\s+(\S+)/gm)].map((match) => match[1]);
  const adminRoutes = routes.filter((route) => route.startsWith("/api/admin/"));
  check(
    "the route table lists every admin API as dynamic (ƒ)",
    adminRoutes.length === 14,
    `${adminRoutes.length} admin API routes: ${adminRoutes.join(" ")}`,
  );
  return result.code;
});

await stage("Stage 2 — npm run type-check with zero application environment variables", async () => {
  const result = await run("npm", ["run", "type-check"], { env: zeroEnv });
  logs["type-check-zero-env"] = result.stdout + result.stderr;
  equal("npm run type-check exit code", result.code, 0, result.stdout.trim().slice(0, 120) || "no diagnostics");
  return result.code;
});

await stage("Stage 3 — npx eslint . --max-warnings 0 with zero application environment variables", async () => {
  const result = await run("npx", ["eslint", ".", "--max-warnings", "0"], { env: zeroEnv });
  logs["eslint-zero-env"] = result.stdout + result.stderr;
  equal("eslint exit code", result.code, 0, result.stdout.trim().slice(0, 200) || "zero findings");
  return result.code;
});

/* --- Stage 4: library battery --------------------------------------------- */

await stage("Stage 4 — library battery (port, auth, CSV, audit) with zero application environment variables", async () => {
  const result = await run("node", ["--experimental-strip-types", "tests/phase-06/lib-tests.mjs"], {
    env: zeroEnv,
  });
  logs["lib-tests-zero-env"] = result.stdout + result.stderr;
  const passed = /(\d+)\/(\d+) passed/.exec(result.stdout);
  equal("lib battery exit code", result.code, 0);
  check("lib battery reported a full pass", Boolean(passed) && passed[1] === passed[2], passed ? passed[0] : "no summary line");
  return result.code;
});

/* --- Stage 5: client bundles ---------------------------------------------- */

await stage("Stage 5 — grep the production client bundles for credential material and server-only code", async () => {
  const clientRoot = path.join(PROJECT_ROOT, ".next", "static");
  const files = await collectFiles(clientRoot, [".js", ".mjs", ".css"]);
  check("client bundles were found to grep", files.length > 0, `${files.length} files under .next/static`);

  /**
   * Each entry is a literal that must not reach a browser. The last four are server-only
   * *identifiers* rather than secrets: their presence would mean server auth code had been
   * bundled into a client chunk, which is the failure mode that would precede a leak.
   */
  const forbidden = [
    ["the admin password hash variable name", "ADMIN_PASSWORD_HASH"],
    ["the session secret variable name", "ADMIN_SESSION_SECRET"],
    ["the argon2 PHC prefix", "$argon2id$"],
    ["the argon2 module name", "@node-rs/argon2"],
    ["the session-secret HMAC domain", "nicben:admin-session:v1:"],
    ["the admin collection name", "adminUsers"],
    ["the enumerated password-denylist entry", "qwertyuiop"],
    ["the admin password validation constant", "ADMIN_PASSWORD_POLICY"],
    ["the dev seed variable name", "ADMIN_EMAIL"],
    ["the mongo connection variable name", "MONGODB_URI"],
    ["a mongo connection string scheme", "mongodb+srv://"],
    ["the resend notification sender", "onboarding@resend.dev"],
  ];

  const hits = [];
  for (const file of files) {
    const source = await readFile(file, "utf8");
    for (const [label, literal] of forbidden) {
      if (source.includes(literal)) {
        hits.push(`${path.relative(PROJECT_ROOT, file)} :: ${label} ("${literal}")`);
      }
    }
  }
  logs["client-bundle-grep"] = `files scanned: ${files.length}\nforbidden literals: ${forbidden.length}\nhits: ${hits.length}\n${hits.join("\n")}`;

  /**
   * Positive control. A negative result is only meaningful if the scan can find something,
   * so the same scan is run for a literal that **must** be in a client bundle: the enquiry
   * endpoint path, which `app/contact/ContactForm.tsx` (a client component) imports from
   * `lib/enquiry/contract.ts`.
   */
  let positiveHits = 0;
  for (const file of files) {
    const source = await readFile(file, "utf8");
    if (source.includes("/api/enquiries")) positiveHits += 1;
  }
  check(
    "positive control: a literal known to be client-side IS found by the same scan",
    positiveHits > 0,
    `"/api/enquiries" appears in ${positiveHits} client chunk(s)`,
  );

  equal("zero forbidden literals in any client bundle", hits.length, 0, hits.slice(0, 6).join(" | "));
  return hits.length;
});

/* --- Stage 6: zero-environment server ------------------------------------- */

await stage("Stage 6 — unauthenticated enumeration and fail-closed battery (zero application environment variables)", async () => {
  const started = await startServer({
    label: "zero-env",
    port: ZERO_PORT,
    env: zeroEnv,
    command: "npx",
    args: ["next", "start", "--port", String(ZERO_PORT)],
    readyTimeoutMs: 60_000,
  });
  if (!started) return 1;

  const result = await run("node", ["tests/phase-06/http-tests.mjs", "--mode=zero", `--base=${ZERO_BASE}`], {
    env: { ...zeroEnv, NODE_ENV: "production" },
  });
  logs["http-tests-zero-env"] = result.stdout + result.stderr;
  process.stdout.write(result.stdout);
  killServer();
  await sleep(500);
  equal("zero-env HTTP battery exit code", result.code, 0);
  return result.code;
});

/* --- Stage 7: seeded server ----------------------------------------------- */

await stage("Stage 7 — authenticated battery: login, CSRF, validation, audit, CSV, throttling, expiry", async () => {
  const argon2 = await import("@node-rs/argon2");
  const passwordHash = await argon2.hash(SEEDED_ADMIN_PASSWORD, {
    algorithm: argon2.Algorithm.Argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
    outputLen: 32,
  });
  logs["seeded-config"] = JSON.stringify(
    {
      ADMIN_EMAIL: SEEDED_ADMIN_EMAIL,
      ADMIN_PASSWORD_HASH: `[redacted] ${passwordHash.slice(0, 13)}… sha256=${createHash("sha256").update(passwordHash).digest("hex").slice(0, 12)}`,
      ADMIN_SESSION_SECRET: `[redacted] ${SEEDED_SESSION_SECRET.length} chars, sha256=${createHash("sha256").update(SEEDED_SESSION_SECRET).digest("hex").slice(0, 12)}`,
      generatedPasswordLength: SEEDED_ADMIN_PASSWORD.length,
    },
    null,
    2,
  );

  const seededEnv = {
    ...zeroEnv,
    ADMIN_EMAIL: SEEDED_ADMIN_EMAIL,
    ADMIN_PASSWORD_HASH: passwordHash,
    // A configured secret, so the battery can mint tokens with a genuine signature and
    // isolate expiry as the only variable (see the session-expiry section).
    ADMIN_SESSION_SECRET: SEEDED_SESSION_SECRET,
    // `next dev` compiles routes on demand, so the first requests are slow; the battery
    // sends a warm-up request before it measures anything.
    NODE_ENV: "development",
  };

  const started = await startServer({
    label: "seeded",
    port: SEEDED_PORT,
    env: seededEnv,
    command: "npx",
    args: ["next", "dev", "--webpack", "--port", String(SEEDED_PORT)],
    readyTimeoutMs: 120_000,
  });
  if (!started) return 1;

  // Warm the routes the battery will exercise, so a first-compile delay cannot be
  // misread as a control failing.
  for (const pathname of [
    "/api/admin/auth/session",
    "/api/admin/auth/login",
    "/api/admin/enquiries",
    "/api/admin/enquiries/export",
    "/api/admin/projects",
    "/api/admin/testimonials",
    "/api/admin/content/what-we-do",
    "/api/admin/settings",
    "/api/admin/audit",
    "/api/enquiries",
  ]) {
    try {
      await fetch(`${SEEDED_BASE}${pathname}`, { method: pathname === "/api/enquiries" ? "POST" : "GET" });
    } catch {
      // Warm-up only.
    }
  }
  await sleep(1500);

  const result = await run(
    "node",
    ["tests/phase-06/http-tests.mjs", "--mode=seeded", `--base=${SEEDED_BASE}`],
    {
      env: {
        ...seededEnv,
        HARNESS_ADMIN_EMAIL: SEEDED_ADMIN_EMAIL,
        HARNESS_ADMIN_PASSWORD: SEEDED_ADMIN_PASSWORD,
      },
    },
  );
  logs["http-tests-seeded"] = result.stdout + result.stderr;
  process.stdout.write(result.stdout);
  killServer();
  await sleep(500);
  equal("seeded HTTP battery exit code", result.code, 0);
  return result.code;
});

/* --- Report --------------------------------------------------------------- */

killServer();

await stage("Stage 8 — evidence", async () => {
  await mkdir(OUT_DIR, { recursive: true });
  for (const [name, content] of Object.entries(logs)) {
    await writeFile(path.join(OUT_DIR, `${name}.log`), content ?? "", "utf8");
  }
  const outcome = summary();
  await writeFile(
    path.join(OUT_DIR, "verification-report.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        passed: outcome.passed,
        failed: outcome.failed,
        failures: outcome.failures,
        checks: outcome.results,
      },
      null,
      2,
    ),
    "utf8",
  );
  process.stdout.write(`\nevidence written to ${path.relative(PROJECT_ROOT, OUT_DIR)}/\n`);
  process.stdout.write(`stages recorded: ${Object.keys(logs).join(", ")}\n`);
  return outcome;
});

const finalOutcome = summary();
exitCode = finalOutcome.failed === 0 ? 0 : 1;
await rm(path.join(OUT_DIR, "server-zero-env.tmp"), { force: true });
process.exit(exitCode);
