#!/usr/bin/env node
/**
 * `hash-admin-password.mjs` — generate an argon2id hash for `ADMIN_PASSWORD_HASH`.
 *
 * Usage
 * -----
 * ```
 *   # interactive: the password is typed and never echoed
 *   node scripts/hash-admin-password.mjs
 *
 *   # non-interactive (CI, a scripted provisioning step)
 *   NICBEN_ADMIN_PASSWORD='…' node scripts/hash-admin-password.mjs
 * ```
 *
 * It prints the hash and nothing else. The password is never written to a file, never
 * logged, and never included in an error message.
 *
 * Why this is a plain `.mjs` script
 * ---------------------------------
 * It is an operator tool, not application code. It therefore does not go through the
 * repository port (`decisions.md` D-019 governs the running application, and this script
 * only derives a value an operator then stores). It has no database access at all — the
 * production provisioning path, including the collection and document shape, is in
 * `web/docs/admin-provisioning.md`.
 *
 * Parameter set: the same constant as `lib/auth/password.ts` (19 MiB, t=2, p=1, argon2id,
 * 32-byte output — the OWASP-recommended configuration). If those parameters change there,
 * this script is the second place to change them, which is why the policy check imports
 * nothing from the application: a script that cannot run because the application does not
 * compile is not a usable recovery tool.
 */

import { createInterface } from "node:readline";
import process from "node:process";

const ARGON2_PARAMS = {
  algorithm: 2, // argon2id
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

/** Mirrors `ADMIN_PASSWORD_POLICY` in `lib/auth/password.ts`. See the header comment. */
const POLICY = {
  minLength: 12,
  maxLength: 200,
  denied: [
    "admin",
    "administrator",
    "nicben",
    "nicbenadmin",
    "password",
    "password1234",
    "changeme",
    "letmein",
    "qwertyuiop",
    "123456789012",
  ],
};

function fail(message) {
  process.stderr.write(`hash-admin-password: ${message}\n`);
  process.exit(1);
}

function policyViolations(password) {
  const violations = [];
  if (password.length < POLICY.minLength) {
    violations.push(`must be at least ${POLICY.minLength} characters`);
  }
  if (password.length > POLICY.maxLength) {
    violations.push(`must be at most ${POLICY.maxLength} characters`);
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    violations.push("must contain at least one non-alphanumeric character");
  }
  if (!/[0-9]/.test(password)) {
    violations.push("must contain at least one digit");
  }
  if (POLICY.denied.includes(password.trim().toLowerCase())) {
    violations.push("is a well-known password");
  }
  return violations;
}

async function readPasswordFromTty() {
  const rl = createInterface({ input: process.stdin, output: process.stderr, terminal: true });
  // Suppress echo so the password does not appear on screen or in a terminal scrollback
  // buffer. The terminal's own `readline` echo is what is being turned off; this is a
  // convenience, not a security control.
  const originalWrite = rl._writeToOutput;
  rl._writeToOutput = function quiet(stringToWrite) {
    if (stringToWrite.includes("\n") || stringToWrite.includes("\r")) {
      originalWrite.call(rl, stringToWrite);
    }
  };
  try {
    return await new Promise((resolve) => {
      rl.question("Admin password (not echoed): ", (answer) => resolve(answer));
    });
  } finally {
    rl.close();
  }
}

async function main() {
  let argon2;
  try {
    argon2 = await import("@node-rs/argon2");
  } catch (error) {
    fail(
      `@node-rs/argon2 could not be loaded (${error instanceof Error ? error.name : "unknown"}). ` +
        "Run `npm install` in web/ and retry.",
    );
  }

  const fromEnv = process.env.NICBEN_ADMIN_PASSWORD;
  const password = fromEnv !== undefined ? fromEnv : await readPasswordFromTty();

  if (typeof password !== "string" || password.length === 0) {
    fail("no password supplied");
  }

  const violations = policyViolations(password);
  if (violations.length > 0) {
    fail(`password rejected by policy: ${violations.join("; ")}`);
  }

  const hash = await argon2.hash(password, ARGON2_PARAMS);

  process.stdout.write(
    [
      "# Copy the value below into ADMIN_PASSWORD_HASH (in .env.local, never in .env.example).",
      "# The hash is credential material: treat it exactly as you would the password.",
      "",
      hash,
      "",
    ].join("\n"),
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.name : "unknown error");
});
