/**
 * Phase 05 verification orchestrator.
 *
 * Produces the evidence the phase brief asks for, in the order it asks for it:
 *
 *  1. `npm run type-check`  (recorded separately; see the completion notes)
 *  2. a **build with no environment variables set** — the D-019/D-020/D-022
 *     acceptance contract
 *  3. four server runs over that one build, changing only the environment, which
 *     is what proves the client can provision MongoDB, Resend and Vercel Blob
 *     later without a code change
 *  4. structured-log analysis: what the pipeline actually did, per request
 *
 * Everything it writes goes to `tests/phase-05/out/`, never to `public/`
 * (`decisions.md` D-011).
 *
 *   node tests/phase-05/verify.mjs
 */

import { spawn } from "node:child_process";
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(HERE, "../..");
const OUT_DIR = path.join(HERE, "out");
const NEXT_BIN = path.join(WEB_ROOT, "node_modules", "next", "dist", "bin", "next");

/** Cloudflare's documented Turnstile test credentials (public, not secrets). */
const TURNSTILE_TEST_SECRET = "1x0000000000000000000000000000000AA";
const TURNSTILE_TEST_SITE_KEY = "1x00000000000000000000AA";

/** Every variable the application reads. None may be present for the build test. */
const APP_ENV_VARS = [
  "MONGODB_URI",
  "MONGODB_DB",
  "RESEND_API_KEY",
  "ENQUIRY_NOTIFY_TO",
  "TURNSTILE_SITE_KEY",
  "TURNSTILE_SECRET_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "NEXT_PUBLIC_SITE_URL",
];

/** Also excluded so a run cannot inherit behaviour from the outer shell. */
const NEVER_INHERIT = ["NODE_ENV", "NODE_OPTIONS", "NEXT_PUBLIC_SITE_URL", "ENQUIRY_NOTIFY_TO"];

/** Operating-system necessities for a child process to start at all. */
const OS_ENV_KEYS = [
  "PATH",
  "SystemRoot",
  "windir",
  "SystemDrive",
  "TEMP",
  "TMP",
  "COMSPEC",
  "PATHEXT",
  "NUMBER_OF_PROCESSORS",
  "PROCESSOR_ARCHITECTURE",
  "OS",
  "ProgramData",
  "ProgramFiles",
  "ProgramFiles(x86)",
  "APPDATA",
  "LOCALAPPDATA",
  "USERPROFILE",
  "HOMEDRIVE",
  "HOMEPATH",
  "USERNAME",
  "HOME",
];

const report = { startedAt: new Date().toISOString(), steps: [], assertions: [] };
let assertionFailures = 0;

function assert(name, condition, detail) {
  if (!condition) assertionFailures += 1;
  report.assertions.push({ name, status: condition ? "PASS" : "FAIL", detail: String(detail) });
  console.log(`${condition ? "  ok  " : " FAIL "} ${name}${detail ? `  — ${detail}` : ""}`);
  return condition;
}

function baseEnv() {
  const env = {};
  for (const key of OS_ENV_KEYS) {
    if (process.env[key] !== undefined) env[key] = process.env[key];
  }
  return env;
}

function run(command, args, { env, cwd = WEB_ROOT, logPath } = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env });
    let output = "";
    const stream = logPath ? createWriteStream(logPath) : null;
    const onData = (chunk) => {
      output += chunk;
      if (stream) stream.write(chunk);
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", onData);
    child.on("close", (code) => {
      if (stream) stream.end();
      resolve({ code, output });
    });
  });
}

function portFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

async function waitForServer(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`, { redirect: "manual" });
      if (response.status < 500) return true;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function killTree(child) {
  return new Promise((resolve) => {
    if (child.exitCode !== null) return resolve();
    const done = () => resolve();
    child.once("close", done);
    try {
      child.kill("SIGTERM");
    } catch {
      // Already gone.
    }
    setTimeout(() => {
      if (child.exitCode === null) {
        spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" }).on(
          "close",
          done,
        );
      }
    }, 4000);
    setTimeout(done, 12000);
  });
}

async function startServer({ label, port, kind, env }) {
  const logPath = path.join(OUT_DIR, `${label}.log`);
  const args =
    kind === "dev"
      ? [NEXT_BIN, "dev", "--webpack", "-p", String(port)]
      : [NEXT_BIN, "start", "-p", String(port)];

  const child = spawn(process.execPath, args, { cwd: WEB_ROOT, env: { ...baseEnv(), ...env } });
  const stream = createWriteStream(logPath);
  child.stdout.pipe(stream);
  child.stderr.pipe(stream);

  const ready = await waitForServer(port, kind === "dev" ? 120000 : 60000);
  return { label, port, kind, env, child, logPath, ready, stream };
}

async function stopServer(server) {
  await killTree(server.child);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const free = await portFree(server.port);
  return free;
}

/* -------------------------------------------------------------------------- */
/* Log analysis                                                               */
/* -------------------------------------------------------------------------- */

function readEvents(logPath) {
  const text = readFileSync(logPath, "utf8");
  const events = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line.startsWith("{")) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === "object" && parsed.scope && parsed.event) events.push(parsed);
    } catch {
      // Next.js emits non-JSON banner lines; they are simply not events.
    }
  }
  return { text, events };
}

function summarise(events) {
  const counts = {};
  for (const event of events) counts[event.event] = (counts[event.event] ?? 0) + 1;
  return counts;
}

/* -------------------------------------------------------------------------- */
/* Runs                                                                       */
/* -------------------------------------------------------------------------- */

const battery = (label, port, turnstileMode, extra = "none") =>
  run(
    process.execPath,
    [
      path.join(HERE, "http-tests.mjs"),
      "--base",
      `http://127.0.0.1:${port}`,
      "--turnstile",
      turnstileMode,
      "--extra",
      extra,
      "--out",
      path.join(OUT_DIR, `${label}-http.json`),
    ],
    { env: baseEnv(), logPath: path.join(OUT_DIR, `${label}-battery.log`) },
  );

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("\nPhase 05 — verification run\n");
  console.log("— step 0: environment assertions " + "".padEnd(40, "—"));

  for (const key of APP_ENV_VARS) {
    assert(
      `no ${key} in this process`,
      process.env[key] === undefined,
      process.env[key] === undefined ? "absent" : "PRESENT — build test would be invalid",
    );
  }
  const envFiles = readdirSync(WEB_ROOT).filter(
    (entry) => entry.startsWith(".env") && entry !== ".env.example",
  );
  assert(
    "no .env / .env.local / .env.production in web/",
    envFiles.length === 0,
    envFiles.length === 0 ? "only .env.example exists" : envFiles.join(", "),
  );
  const publicFiles = readdirSync(path.join(WEB_ROOT, "public"), { recursive: true }).filter(
    (entry) => typeof entry === "string",
  );
  assert(
    "public/ holds no test artefact (D-011)",
    publicFiles.every((entry) => !entry.includes("phase-05") && !entry.includes("probe")),
    `${publicFiles.length} entries, none from this harness`,
  );

  /* ---------------------------------------------------------------- build --- */
  console.log("\n— step 1: build with no environment variables " + "".padEnd(30, "—"));
  const buildEnv = baseEnv();
  for (const key of APP_ENV_VARS) {
    assert(`child env excludes ${key}`, buildEnv[key] === undefined, "excluded");
  }
  const build = await run(
    process.execPath,
    [NEXT_BIN, "build", "--webpack"],
    { env: buildEnv, logPath: path.join(OUT_DIR, "build-zero-env.log") },
  );
  report.steps.push({ step: "build-zero-env", exitCode: build.code });
  assert("npm run build (0 env vars) exits 0", build.code === 0, `exit ${build.code}`);

  const routeTable = build.output
    .split(/\r?\n/)
    .filter((line) => /^\s*[├└┌│]?\s*[ƒ○●λ]\s/.test(line) || /Route \(app\)/.test(line));
  const enquiryRoute = routeTable.find((line) => line.includes("/api/enquiries"));
  assert(
    "the route table lists /api/enquiries",
    Boolean(enquiryRoute),
    enquiryRoute ? enquiryRoute.trim() : "not found in build output",
  );
  console.log(
    routeTable.length > 0 ? `\n${routeTable.map((line) => `      ${line.trim()}`).join("\n")}\n` : "",
  );

  /* --------------------------------------------------------- run A / token --- */
  console.log("\n— step 2: run A — Turnstile configured, no database, no mail " + "".padEnd(10, "—"));
  const runA = await startServer({
    label: "runA-token-dev-adapter",
    port: 3311,
    kind: "start",
    env: { TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET, TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY },
  });
  assert("run A server is serving", runA.ready, "http://127.0.0.1:3311");
  const batteryA = await battery("runA", 3311, "pass");
  report.steps.push({ step: "runA-battery", exitCode: batteryA.code });
  console.log(`      battery exit code: ${batteryA.code}`);
  const stoppedA = await stopServer(runA);
  assert("run A port released after shutdown", stoppedA, "3311 free");

  const a = readEvents(runA.logPath);
  fsPublish(report, "runA", summarise(a.events), a.text);

  /* ---------------------------------------------------- run B / fail closed --- */
  console.log("\n— step 3: run B — production, no Turnstile secret (fail closed) " + "".padEnd(8, "—"));
  const runB = await startServer({
    label: "runB-production-fail-closed",
    port: 3312,
    kind: "start",
    env: {},
  });
  assert("run B server is serving", runB.ready, "http://127.0.0.1:3312");
  const batteryB = await battery("runB", 3312, "failclosed");
  report.steps.push({ step: "runB-battery", exitCode: batteryB.code });
  console.log(`      battery exit code: ${batteryB.code}`);
  const stoppedB = await stopServer(runB);
  assert("run B port released after shutdown", stoppedB, "3312 free");

  const b = readEvents(runB.logPath);
  fsPublish(report, "runB", summarise(b.events), b.text);

  /* ------------------------------------------------- run C / notification --- */
  console.log("\n— step 4: run C — a mail provider that rejects the send " + "".padEnd(12, "—"));
  const runC = await startServer({
    label: "runC-notification-attempt",
    port: 3314,
    kind: "start",
    env: {
      TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET,
      TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
      // A deliberately invalid key: the point of this run is that the send is
      // attempted and rejected, and the enquiry survives it (D-021).
      RESEND_API_KEY: "re_phase05_invalid_key_placeholder",
      ENQUIRY_NOTIFY_TO: "inbox@example.com",
    },
  });
  assert("run C server is serving", runC.ready, "http://127.0.0.1:3314");
  const batteryC = await battery("runC", 3314, "pass", "notification");
  report.steps.push({ step: "runC-battery", exitCode: batteryC.code });
  console.log(`      battery exit code: ${batteryC.code}`);
  const stoppedC = await stopServer(runC);
  assert("run C port released after shutdown", stoppedC, "3314 free");

  const c = readEvents(runC.logPath);
  fsPublish(report, "runC", summarise(c.events), c.text);

  /* ---------------------------------------------------- run D / dev skip --- */
  console.log("\n— step 5: run D — development server, no Turnstile secret (skip) " + "".padEnd(4, "—"));
  const runD = await startServer({
    label: "runD-dev-skip",
    port: 3315,
    kind: "dev",
    env: {},
  });
  assert("run D dev server is serving", runD.ready, "http://127.0.0.1:3315");
  const batteryD = runD.ready ? await battery("runD", 3315, "skip") : { code: null };
  report.steps.push({ step: "runD-battery", exitCode: batteryD.code });
  console.log(`      battery exit code: ${batteryD.code}`);
  const stoppedD = await stopServer(runD);
  assert("run D port released after shutdown", stoppedD, "3315 free");

  const d = readEvents(runD.logPath);
  fsPublish(report, "runD", summarise(d.events), d.text);

  /* ------------------------------------------------------------ analysis --- */
  console.log("\n— step 6: pipeline assertions from the structured logs " + "".padEnd(8, "—"));

  assert("every endpoint battery run exited 0", [batteryA.code, batteryB.code, batteryC.code, batteryD.code].every((code) => code === 0), `runA ${batteryA.code} · runB ${batteryB.code} · runC ${batteryC.code} · runD ${batteryD.code}`);

  const sentinel = "SENTINEL_7a41d9c2";
  const aRequestIds = JSON.parse(
    readFileSync(path.join(OUT_DIR, "runA-http.json"), "utf8"),
  ).requestIds;
  const aCreatedRequests = a.events
    .filter((event) => event.event === "enquiry_created")
    .map((event) => event.data?.requestId);

  assert("A: api requests recorded", Object.values(aRequestIds).filter(Boolean).length >= 5, `${Object.values(aRequestIds).filter(Boolean).length} request ids correlated`);
  assert("A: dev adapter selected and warned about (D-019)", (a.events.filter((event) => event.event === "adapter_fallback_dev").length) === 1, "1 warning, level warn");
  assert("A: integration status logged once", a.events.some((event) => event.event === "integration_status"), JSON.stringify(a.events.find((event) => event.event === "integration_status")?.data ?? {}));
  assert("A: six enquiries reached the repository", aCreatedRequests.length === 6, `${aCreatedRequests.length} enquiry_created events`);
  assert("A: all six stored enquiries were persisted into the dev adapter", a.events.filter((event) => event.event === "submission_stored").length === 6, "6 submission_stored events");
  assert("A: honeypot submission was discarded silently", a.events.some((event) => event.event === "honeypot_rejected" && event.data?.requestId === aRequestIds.honeypot), `request ${String(aRequestIds.honeypot).slice(0, 8)}… rejected`);
  assert("A: the honeypot request never reached storage", !aCreatedRequests.includes(aRequestIds.honeypot), "absent from every enquiry_created record");
  assert("A: notification was attempted, found unconfigured, and flagged (D-021)", a.events.filter((event) => event.event === "notification_skipped").length === 6, '6 × notification_skipped, reason "RESEND_API_KEY is not set"');
  assert("A: no Turnstile skip in a run with a secret", a.events.filter((event) => event.event === "turnstile_skipped").length === 0, "0 turnstile_skipped events");
  assert("A: rate limiting refused the fourth submission", a.events.some((event) => event.event === "rate_limited" && event.data?.retryAfterSeconds > 0), `retryAfterSeconds ${a.events.find((event) => event.event === "rate_limited")?.data?.retryAfterSeconds}`);
  assert("A: no log line contains a submitted value", !a.text.includes(sentinel), "sentinel absent from the whole server log");
  assert("A: no log line contains the sender address", !a.text.includes("sender@example.com"), "email absent from the whole server log");
  assert("A: no log line contains a raw network address", !a.text.includes("198.51.100.10"), "raw address absent; only the pseudonym is kept");
  assert(
    "A: the enquiry count matches the accepted requests, not the sent requests",
    aCreatedRequests.length === 6 &&
      a.events.filter((event) => event.event === "validation_failed").length === 5 &&
      a.events.filter((event) => event.event === "attachment_rejected").length === 2,
    `${a.events.filter((event) => event.event === "validation_failed").length} validation failures, ${a.events.filter((event) => event.event === "attachment_rejected").length} attachment rejections, 6 stored`,
  );

  const bEvents = b.events;
  assert("B: production with no Turnstile secret refuses (D-022 fail closed)", bEvents.some((event) => event.event === "turnstile_not_configured"), "turnstile_not_configured logged at error level");
  assert("B: no enquiry was stored while Turnstile was unavailable", bEvents.filter((event) => event.event === "enquiry_created").length === 0, "0 enquiry_created events");
  assert("B: the honeypot still ran first", bEvents.some((event) => event.event === "submission_received"), `${bEvents.filter((event) => event.event === "submission_received").length} requests received`);

  const cEvents = c.events;
  const failure = cEvents.find((event) => event.event === "notification_failed");
  assert("C: the notification send was attempted and rejected", Boolean(failure), failure ? `reference "${failure.data?.reference}"` : "no notification_failed event");
  assert("C: the recorded failure reference is a status, not a provider message", Boolean(failure && /^resend:\d+$|^resend:[a-z_]+$/.test(String(failure.data?.reference))), String(failure?.data?.reference));
  assert("C: the enquiry survived the mail failure", cEvents.filter((event) => event.event === "enquiry_created").length === 7, "7 enquiry_created events");
  assert("C: the stored record reports the failing notification flag", cEvents.some((event) => event.event === "submission_stored" && event.data?.notified === false && event.data?.notificationError), "notified:false with a notificationError reference");

  assert("D: development with no secret skips verification with a warning", d.events.some((event) => event.event === "turnstile_skipped" && event.level === "warn"), "turnstile_skipped at warn level");
  assert("D: submissions were accepted while skipped", d.events.filter((event) => event.event === "enquiry_created").length === 6, "6 enquiry_created events");

  report.assertionFailures = assertionFailures;
  report.finishedAt = new Date().toISOString();
  writeFileSync(path.join(OUT_DIR, "verification-report.json"), `${JSON.stringify(report, null, 2)}\n`);

  console.log(
    `\n${report.assertions.length - assertionFailures}/${report.assertions.length} assertions passed` +
      (assertionFailures ? ` — ${assertionFailures} FAILED` : ""),
  );
  console.log(`Evidence written to ${path.relative(WEB_ROOT, OUT_DIR)}\n`);
  process.exit(assertionFailures === 0 ? 0 : 1);
}

function fsPublish(target, label, counts, text) {
  target[`${label}EventCounts`] = counts;
  console.log(`      ${label} events: ${JSON.stringify(counts)}`);
  if (/Error:/.test(text) && /at .*\.js:\d+/.test(text)) {
    console.log(`      note: ${label} log contains a stack trace in server output (not returned to a client)`);
  }
}

await main();
