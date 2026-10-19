/**
 * Phase 06 — runner for the admin **page** verification.
 *
 * `admin-pages-tests.mjs` is a test battery; it needs a server. This script owns the
 * server lifecycle so a run is one command and the environment is explicit:
 *
 * - `zero`   — every application variable removed from the child's environment
 *              (`harness.mjs` `credentialsAbsentEnv`), which is the state D-028 was
 *              written for;
 * - `seeded` — the three admin variables present, plus Cloudflare Turnstile's
 *              published "always passes" **test** key pair so the public enquiry
 *              endpoint can be exercised from a production build. Those two values
 *              are Cloudflare's documented test credentials, not secrets, and they
 *              exist precisely so a local run can post through Turnstile.
 *
 * Run:
 *   node tests/phase-06/admin-run.mjs --mode=zero
 *   node tests/phase-06/admin-run.mjs --mode=seeded
 */

import { spawn } from "node:child_process";

import { PROJECT_ROOT, credentialsAbsentEnv, sleep, verifyAbsent } from "./harness.mjs";

const args = new Map(
  process.argv
    .slice(2)
    .filter((value) => value.startsWith("--"))
    .map((value) => {
      const [key, ...rest] = value.replace(/^--/, "").split("=");
      return [key, rest.join("=") || "true"];
    }),
);

const MODE = args.get("mode") ?? "zero";
const PORT = Number(args.get("port") ?? (MODE === "seeded" ? 3221 : 3220));
const BASE = `http://127.0.0.1:${PORT}`;

const HARNESS_EMAIL = "operator@example.test";
const HARNESS_PASSWORD = "Harness-Password-2026!";

function run(command, commandArgs, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, commandArgs, {
      cwd: PROJECT_ROOT,
      env: options.env ?? process.env,
      shell: process.platform === "win32",
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("close", (code) => resolve({ code, stdout, stderr }));
  });
}

async function hashPassword(password) {
  const result = await run("node", ["scripts/hash-admin-password.mjs"], {
    env: { ...process.env, NICBEN_ADMIN_PASSWORD: password },
  });
  if (result.code !== 0) {
    throw new Error(`hash-admin-password.mjs failed:\n${result.stdout}\n${result.stderr}`);
  }
  const match = /\$argon2id\$[^\s'"]+/.exec(result.stdout);
  if (!match) throw new Error(`no argon2id hash in the script output:\n${result.stdout}`);
  return match[0];
}

async function waitForServer(timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    // A stale listener on the port would answer the readiness probe and the battery
    // would then run against a build that is not the one under test. Fail here instead.
    if (serverLog.includes("EADDRINUSE")) {
      throw new Error(
        `port ${PORT} is already in use — a previous run left a server listening. Stop it and retry.`,
      );
    }
    try {
      const response = await fetch(`${BASE}/admin/login`, { redirect: "manual" });
      if (response.status > 0) return true;
    } catch {
      // Not listening yet.
    }
    await sleep(500);
  }
  return false;
}

let server;
let serverLog = "";

try {
  let env;
  if (MODE === "zero") {
    env = credentialsAbsentEnv();
    verifyAbsent(env);
  } else if (MODE === "seeded") {
    const hash = await hashPassword(HARNESS_PASSWORD);
    env = {
      ...process.env,
      ADMIN_EMAIL: HARNESS_EMAIL,
      ADMIN_PASSWORD_HASH: hash,
      ADMIN_SESSION_SECRET: "harness-session-secret-not-a-real-credential-0000000000",
      // Cloudflare's documented test pair: the secret always passes.
      TURNSTILE_SITE_KEY: "1x00000000000000000000AA",
      TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA",
    };
    process.stdout.write(`  seeded: ADMIN_PASSWORD_HASH=${hash.slice(0, 24)}… (length ${hash.length})\n`);
  } else {
    throw new Error(`unknown mode: ${MODE}`);
  }

  process.stdout.write(`  starting \`next start\` on ${PORT} (${MODE} mode)\n`);
  server = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", String(PORT)], {
    cwd: PROJECT_ROOT,
    env,
    shell: process.platform === "win32",
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => {
    serverLog += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    serverLog += chunk.toString();
  });

  if (!(await waitForServer())) {
    process.stderr.write(`server did not become ready:\n${serverLog}\n`);
    process.exit(1);
  }

  const result = await run(
    "node",
    ["tests/phase-06/admin-pages-tests.mjs", `--mode=${MODE}`, `--base=${BASE}`],
    {
      env: {
        ...process.env,
        HARNESS_ADMIN_EMAIL: HARNESS_EMAIL,
        HARNESS_ADMIN_PASSWORD: HARNESS_PASSWORD,
      },
    },
  );

  process.stdout.write(result.stdout);
  if (result.stderr.length > 0) process.stderr.write(result.stderr);

  process.stdout.write("\n  ── server log (last 20 lines) ──\n");
  for (const line of serverLog.split(/\r?\n/).filter(Boolean).slice(-20)) {
    process.stdout.write(`  ${line}\n`);
  }

  // Set the exit code rather than calling `process.exit()`: the latter terminates
  // immediately, so the `finally` below would never run and the server would survive the
  // run, holding the port and silently serving a stale build to the next one.
  process.exitCode = result.code ?? 1;
} finally {
  if (server && !server.killed) {
    // On Windows the child is `npx.cmd`, so killing the spawned process leaves the
    // real server listening and the next run fails with EADDRINUSE. `/T` kills the
    // tree and `/F` is required because a listening server ignores a polite signal.
    if (process.platform === "win32" && typeof server.pid === "number") {
      await run("taskkill", ["/PID", String(server.pid), "/T", "/F"]).catch(() => undefined);
    } else {
      server.kill();
    }
  }
}
