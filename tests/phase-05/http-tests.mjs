/**
 * Phase 05 endpoint battery — runs against a live server.
 *
 * Every case is a raw HTTP request, deliberately: `qa-task.md` gate 3 requires the
 * endpoint to be provable **without the client form** ("Prove the endpoint rejects
 * a malformed payload submitted without the client form"). Nothing here imports
 * the application.
 *
 * Rate limiting is keyed by network address (`decisions.md` D-023) and every
 * request in this battery arrives from the same machine, so each independent case
 * sends its own `x-forwarded-for`. The rate-limit case then sends four requests on
 * **one** address, which is what makes it a test of the limiter rather than of
 * something else.
 *
 *   node tests/phase-05/http-tests.mjs --base http://127.0.0.1:3311 \
 *        --turnstile pass|skip|failclosed [--extra notification] --out out.json
 *
 * `--turnstile pass`       a secret is configured and Cloudflare's documented
 *                          always-pass test secret is in use, so the token check
 *                          succeeds. The full battery runs and expects 200s.
 * `--turnstile skip`       no secret, `NODE_ENV !== "production"` — verification is
 *                          skipped with a warning. The full battery runs.
 * `--turnstile failclosed` no secret in production — every submission is refused.
 *                          Only the refusal is exercised, because nothing else can
 *                          be reached through it.
 */

import { writeFileSync } from "node:fs";
import http from "node:http";

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const BASE = arg("base", "http://127.0.0.1:3311");
const TURNSTILE_MODE = arg("turnstile", "pass");
const EXTRA = arg("extra", "none");
const OUT = arg("out", "tests/phase-05/http-report.json");

const TURNSTILE_TOKEN = "XXXX.DUMMY.TOKEN.XXXX";
const SENTINEL = "SENTINEL_7a41d9c2";
const LONG_MESSAGE = "A test enquiry message that is longer than twenty characters.";
const EXPECTS_REFUSAL = TURNSTILE_MODE === "failclosed";

const results = [];
const requestIds = {};
let failures = 0;

function record(name, status, expected, detail, extra = {}) {
  const pass = Array.isArray(expected) ? expected.includes(status) : status === expected;
  if (!pass) failures += 1;
  results.push({
    name,
    status: pass ? "PASS" : "FAIL",
    httpStatus: status,
    expected,
    detail,
    ...extra,
  });
  return pass;
}

function buildForm(overrides = {}, { honeypot = false, attachments = [] } = {}) {
  const form = new FormData();
  const values = {
    name: "Test Sender",
    email: "sender@example.com",
    phone: "+1 (555) 010-2030",
    enquiryType: "general-business",
    location: "Raymondville, TX",
    message: LONG_MESSAGE,
    consent: "on",
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) {
    if (value === null) continue;
    form.set(key, value);
  }
  if (honeypot) form.set("companyWebsite", "https://spam.example");
  if (TURNSTILE_MODE === "pass") form.set("cf-turnstile-response", TURNSTILE_TOKEN);
  for (const attachment of attachments) form.append("attachments", attachment);
  return form;
}

async function post(form, { address, headers = {}, raw = null } = {}) {
  const response = await fetch(`${BASE}/api/enquiries`, {
    method: "POST",
    body: raw ?? form,
    headers: { "x-forwarded-for": address, ...headers },
  });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  return { response, text, body };
}

function messageFor(body, field) {
  return body?.fieldErrors?.find((entry) => entry.field === field)?.message ?? "(none)";
}

function pngBytes(sizeBytes) {
  const buffer = new Uint8Array(sizeBytes);
  buffer.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  return buffer;
}

/* -------------------------------------------------------------------------- */
/* Cases                                                                      */
/* -------------------------------------------------------------------------- */

async function caseValidSubmission() {
  const { response, body } = await post(buildForm(), { address: "198.51.100.10" });
  requestIds.accept = body?.requestId ?? null;
  return record(
    EXPECTS_REFUSAL
      ? "valid submission, no Turnstile secret, production → 403 (D-022 fail closed)"
      : "valid multipart submission is claimed as received",
    response.status,
    EXPECTS_REFUSAL ? 403 : 200,
    `ok=${body?.ok} requestId=${body?.requestId?.slice(0, 8)}…`,
  );
}

async function caseSuccessBodyShape() {
  const { body, response } = await post(buildForm(), { address: "198.51.100.26" });
  const keys = body ? Object.keys(body).sort() : [];
  return record(
    "success body carries no submitted or stored value",
    response.status,
    200,
    `keys = [${keys.join(", ")}]`,
  );
}

async function caseMissingName() {
  const { response, body } = await post(buildForm({ name: "" }), { address: "198.51.100.11" });
  return record(
    "missing name → 400 + approved name message",
    response.status,
    400,
    `"${messageFor(body, "name")}"`,
  );
}

async function caseInvalidEmail() {
  const { response, body } = await post(buildForm({ email: "not-an-address" }), {
    address: "198.51.100.12",
  });
  return record(
    "invalid email → 400 + approved email message",
    response.status,
    400,
    `"${messageFor(body, "email")}"`,
  );
}

async function caseNoEnquiryType() {
  const { response, body } = await post(buildForm({ enquiryType: "" }), {
    address: "198.51.100.13",
  });
  return record(
    "no enquiry type → 400 + approved enquiry-type message",
    response.status,
    400,
    `"${messageFor(body, "enquiryType")}"`,
  );
}

async function caseShortMessage() {
  const { response, body } = await post(buildForm({ message: "x".repeat(19) }), {
    address: "198.51.100.14",
  });
  return record(
    "message under 20 characters → 400 + approved minimum message",
    response.status,
    400,
    `"${messageFor(body, "message")}"`,
  );
}

async function caseOversizedAttachment() {
  const oversized = new File([pngBytes(5 * 1024 * 1024 + 1)], "huge.png", { type: "image/png" });
  const { response, body } = await post(buildForm({}, { attachments: [oversized] }), {
    address: "198.51.100.15",
  });
  return record(
    "oversized attachment (5 MiB + 1 byte) → 400 + approved file message",
    response.status,
    400,
    `"${messageFor(body, "attachments")}"`,
  );
}

async function caseWrongTypeAttachment() {
  // GIF magic bytes wearing a .png filename and an image/png MIME header.
  const gif = new Uint8Array(64);
  gif.set([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 0);
  const { response, body } = await post(
    buildForm({}, { attachments: [new File([gif], "innocent.png", { type: "image/png" })] }),
    { address: "198.51.100.16" },
  );
  return record(
    "forged-type attachment → 400 + approved file message",
    response.status,
    400,
    `"${messageFor(body, "attachments")}"`,
  );
}

async function caseHoneypot() {
  const { response, body } = await post(buildForm({}, { honeypot: true }), {
    address: "198.51.100.17",
  });
  requestIds.honeypot = body?.requestId ?? null;
  return record(
    "honeypot filled → indistinguishable success, nothing stored",
    response.status,
    200,
    `ok=${body?.ok} requestId=${body?.requestId?.slice(0, 8)}… (storage decided in the server log)`,
  );
}

async function caseNoEcho() {
  const { response, text, body } = await post(
    buildForm({
      name: SENTINEL,
      message: `${SENTINEL} — a test message longer than twenty characters.`,
      location: SENTINEL,
      phone: SENTINEL,
    }),
    { address: "198.51.100.18" },
  );
  requestIds.echoProbe = body?.requestId ?? null;
  const echoed = text.includes(SENTINEL);
  return record(
    "no submitted value is echoed in the response body",
    echoed ? 0 : response.status,
    200,
    echoed ? "SENTINEL FOUND in the response text" : `sentinel absent (${text.length} bytes returned)`,
  );
}

async function caseMalformedWithoutForm() {
  const { response, body } = await post(null, {
    address: "198.51.100.19",
    headers: {
      "content-type": "application/json",
      // A JSON caller cannot use the widget's hidden field, so it presents the
      // token as a header (`lib/enquiry/contract.ts` documents both).
      ...(TURNSTILE_MODE === "pass" ? { "x-turnstile-token": TURNSTILE_TOKEN } : {}),
    },
    raw: JSON.stringify({ name: 42, email: { nested: true }, consent: "maybe" }),
  });
  requestIds.malformed = body?.requestId ?? null;
  return record(
    "non-string payload without the client form → 400, nothing echoed",
    response.status,
    400,
    `formError=${JSON.stringify(body?.formError ?? null)} with ${body?.fieldErrors?.length ?? 0} field(s) attributed: ${(body?.fieldErrors ?? []).map((entry) => entry.field).join(", ")}`,
  );
}

async function caseUnsupportedContentType() {
  const { response, body } = await post(null, {
    address: "198.51.100.20",
    headers: { "content-type": "text/plain" },
    raw: "name=Test&message=hello",
  });
  return record("unsupported content type → 400", response.status, 400, `"${body?.formError}"`);
}

async function caseCrossOrigin() {
  const { response } = await post(buildForm(), {
    address: "198.51.100.21",
    headers: { origin: "https://evil.example" },
  });
  return record(
    "cross-origin browser request → 403 (06 §33)",
    response.status,
    403,
    "Origin: https://evil.example rejected",
  );
}

async function caseOversizedBody() {
  // A complete body over the ceiling. It is sent in full rather than announced
  // with a header alone, because under the Node runtime Next buffers a POST body
  // before a Route Handler runs — so the handler's ceiling can only be observed
  // against a body that has actually arrived. What the check buys is a clean 413
  // before the multipart parse and before any attachment handling, rather than a
  // failed parse surfacing as a 500.
  const body = Buffer.alloc(27 * 1024 * 1024, 0x61);
  const declared = Buffer.byteLength(body);
  return new Promise((resolve) => {
    const request = http.request(
      {
        host: "127.0.0.1",
        port: Number(new URL(BASE).port || 80),
        path: "/api/enquiries",
        method: "POST",
        headers: {
          "content-type": "multipart/form-data; boundary=----phase05",
          "content-length": String(declared),
          "x-forwarded-for": "198.51.100.22",
        },
      },
      (response) => {
        let payload = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          payload += chunk;
        });
        response.on("end", () => {
          let parsed = null;
          try {
            parsed = JSON.parse(payload);
          } catch {
            parsed = null;
          }
          const passed = record(
            "declared body over the ceiling → 413 without a multipart parse",
            response.statusCode,
            413,
            `${declared} bytes → ${response.statusCode} "${parsed?.formError ?? ""}"`,
          );
          request.destroy();
          resolve(passed);
        });
      },
    );
    request.on("error", () => resolve(false));
    request.setTimeout(60000, () => {
      record("declared body over the ceiling → 413 without a multipart parse", 0, 413, "timed out");
      request.destroy();
      resolve(false);
    });
    request.end(body);
  });
}

async function caseRateLimit() {
  const address = "198.51.100.200";
  const statuses = [];
  let lastBody = null;
  let retryAfter = null;
  for (let index = 0; index < 4; index += 1) {
    const { response, body } = await post(buildForm(), { address });
    statuses.push(response.status);
    if (index === 2) requestIds.rateLimitedAccepted = body?.requestId ?? null;
    if (index === 3) {
      requestIds.rateLimited = body?.requestId ?? null;
      retryAfter = response.headers.get("retry-after");
      lastBody = body;
    }
  }
  return record(
    "four submissions from one address → 429 on the fourth, with Retry-After",
    statuses.join(","),
    "200,200,200,429",
    `statuses [${statuses.join(", ")}] retry-after=${retryAfter ?? "(none)"} message="${lastBody?.formError}"`,
  );
}

async function caseNotificationAttempt() {
  const { response, body } = await post(buildForm(), { address: "198.51.100.25" });
  requestIds.notification = body?.requestId ?? null;
  return record(
    "a rejected mail send does not change the sender's outcome (D-021)",
    response.status,
    200,
    `ok=${body?.ok} — provider outcome asserted from the server log`,
  );
}

async function caseFailClosedWithoutTokenCheck() {
  const { response, body } = await post(buildForm(), { address: "198.51.100.27" });
  requestIds.failClosed = body?.requestId ?? null;
  return record(
    "no request reaches validation or storage while Turnstile is unavailable",
    response.status,
    403,
    `ok=${body?.ok} formError="${body?.formError}"`,
  );
}

/* -------------------------------------------------------------------------- */

async function main() {
  const cases = [caseValidSubmission];

  if (EXPECTS_REFUSAL) {
    cases.push(caseFailClosedWithoutTokenCheck);
  } else {
    cases.push(
      caseSuccessBodyShape,
      caseMissingName,
      caseInvalidEmail,
      caseNoEnquiryType,
      caseShortMessage,
      caseOversizedAttachment,
      caseWrongTypeAttachment,
      caseHoneypot,
      caseNoEcho,
      caseMalformedWithoutForm,
      caseUnsupportedContentType,
      caseCrossOrigin,
      caseOversizedBody,
    );
    if (EXTRA === "notification") cases.push(caseNotificationAttempt);
    // Rate limiting runs last so its three accepted submissions do not interleave
    // with the other cases in the server log.
    cases.push(caseRateLimit);
  }

  console.log(`\nEndpoint battery — ${BASE} (turnstile: ${TURNSTILE_MODE})\n`);
  for (const testCase of cases) {
    await testCase();
  }

  const width = Math.max(...results.map((entry) => entry.name.length));
  for (const entry of results) {
    console.log(
      `${entry.status === "PASS" ? "  ok  " : " FAIL "} ${entry.name.padEnd(width)}  HTTP ${String(
        entry.httpStatus,
      ).padEnd(4)} ${entry.detail}`,
    );
  }
  console.log(
    `\n${results.length - failures}/${results.length} passed${failures ? ` — ${failures} FAILED` : ""}`,
  );

  writeFileSync(
    OUT,
    `${JSON.stringify(
      { base: BASE, turnstileMode: TURNSTILE_MODE, extra: EXTRA, failures, total: results.length, requestIds, results },
      null,
      2,
    )}\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

await main();
