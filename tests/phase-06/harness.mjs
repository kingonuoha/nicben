/**
 * Shared helpers for the Phase 06 harness.
 *
 * Not part of the application (`decisions.md` D-011): everything under `tests/` is excluded
 * from the served tree and from the build.
 */

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const OUT_DIR = path.join(PROJECT_ROOT, "tests", "phase-06", "out");

/** Every environment variable the application reads. Used to construct a credentials-absent child. */
export const APP_ENV_VARS = [
  "MONGODB_URI",
  "MONGODB_DB",
  "RESEND_API_KEY",
  "ENQUIRY_NOTIFY_TO",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "NEXT_PUBLIC_SITE_URL",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD_HASH",
  "ADMIN_SESSION_SECRET",
];

/**
 * An environment with every application variable removed, and the Node/Next test-affecting
 * ones removed too, so "the build passed" cannot be explained by an inherited setting.
 *
 * `NICBEN_ADMIN_PASSWORD` is also removed: the provisioning script reads it.
 */
export function credentialsAbsentEnv(extra = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (APP_ENV_VARS.includes(key)) continue;
    if (key === "NODE_ENV" || key === "NODE_OPTIONS" || key === "NICBEN_ADMIN_PASSWORD") continue;
    env[key] = value;
  }
  return { ...env, ...extra };
}

export function verifyAbsent(env) {
  const present = APP_ENV_VARS.filter((name) => env[name] !== undefined);
  if (present.length > 0) {
    throw new Error(`constructed child environment still carries: ${present.join(", ")}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Assertions                                                                  */
/* -------------------------------------------------------------------------- */

let passed = 0;
const failures = [];
export const results = [];

/**
 * Assert and record. Every check is reported, not just the failures, so the raw output can
 * be read as the sequence of measurements it is.
 */
export function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    results.push({ ok: true, name, detail });
    process.stdout.write(`  ok   ${name.padEnd(74)} ${detail}\n`);
  } else {
    failures.push({ name, detail });
    results.push({ ok: false, name, detail });
    process.stdout.write(`  FAIL ${name.padEnd(74)} ${detail}\n`);
  }
  return Boolean(condition);
}

export function equal(name, actual, expected, detail = "") {
  return check(
    name,
    Object.is(actual, expected),
    `${detail}${detail ? " · " : ""}got ${JSON.stringify(actual)} want ${JSON.stringify(expected)}`,
  );
}

export function section(title) {
  process.stdout.write(`\n── ${title} ${"─".repeat(Math.max(0, 72 - title.length))}\n`);
}

export function summary() {
  process.stdout.write(`\n${passed}/${passed + failures.length} passed\n`);
  return { passed, failed: failures.length, failures, results };
}

/* -------------------------------------------------------------------------- */
/* Processes                                                                   */
/* -------------------------------------------------------------------------- */

export function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd ?? PROJECT_ROOT,
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

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
