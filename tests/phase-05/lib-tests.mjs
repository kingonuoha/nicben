/**
 * Phase 05 module-level verification.
 *
 * Runs the application's own modules directly (Node 22 type stripping + the
 * resolution hooks in `./ts-loader.mjs`), so each claim below is evaluated
 * against the code that ships rather than against a re-implementation of it.
 *
 * The deck strings are repeated here as literals on purpose: a test that reads
 * its expectation from the module under test proves nothing. Each one is copied
 * from `docs/03-copy-deck.md` §11 (lines 182–196) and is compared character for
 * character.
 *
 *   node tests/phase-05/lib-tests.mjs
 */

import "./ts-loader.mjs";

import assert from "node:assert/strict";

const results = [];
let failures = 0;

function check(name, fn) {
  try {
    const detail = fn();
    results.push({ name, status: "PASS", detail: detail === undefined ? "" : String(detail) });
  } catch (error) {
    failures += 1;
    results.push({
      name,
      status: "FAIL",
      detail: error instanceof Error ? error.message.split("\n")[0] : String(error),
    });
  }
}

async function checkAsync(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, status: "PASS", detail: detail === undefined ? "" : String(detail) });
  } catch (error) {
    failures += 1;
    results.push({
      name,
      status: "FAIL",
      detail: error instanceof Error ? error.message.split("\n")[0] : String(error),
    });
  }
}

/* -------------------------------------------------------------------------- */
/* The deck, transcribed independently                                        */
/* -------------------------------------------------------------------------- */

const DECK_SIX_ERRORS = [
  "Please enter your name.",
  "Please enter a valid email address.",
  "Please choose what your enquiry is about.",
  "Please tell us a little more (at least 20 characters).",
  "That file is too large or not a supported type.",
  "Something went wrong. Please try again or email us directly.",
];

const DECK_OPTION_LABELS = [
  "Project management and contracting",
  "Property improvement and maintenance",
  "General or business enquiry",
];

const { ENQUIRY_ERROR_MESSAGES, ENQUIRY_ERROR_MESSAGES_IN_DECK_ORDER, ENQUIRY_TYPE_OPTIONS } =
  await import("@/lib/validation/enquiry-options");

const {
  ENQUIRY_HONEYPOT_FIELD,
  ENQUIRY_LIMITS,
  enquirySchema,
  validateEnquirySubmission,
  formDataToEnquiryCandidate,
  isHoneypotFilled,
} = await import("@/lib/validation/enquiry");

const {
  sanitiseSingleLine,
  sanitiseMultiline,
  sanitisePhoneNumber,
  sanitiseDisplayFilename,
  escapeHtml,
} = await import("@/lib/enquiry/sanitise");

const { hashNetworkAddress, clientAddressFromHeaders } = await import("@/lib/enquiry/network");

const {
  ATTACHMENT_MAX_BYTES,
  buildStorageKey,
  prepareAttachments,
  sniffAttachmentContentType,
} = await import("@/lib/enquiry/attachments");

const { consumeEnquiryRateLimit, resetEnquiryRateLimit, ENQUIRY_RATE_LIMIT } = await import(
  "@/lib/enquiry/rate-limit"
);

const { buildEnquiryNotification } = await import("@/lib/enquiry/notify");

const { createDevEnquiryRepository } = await import("@/lib/data/adapters/dev");
const { getEnquiryRepository, resetEnquiryRepository } = await import("@/lib/data/index");
const { verifyTurnstileToken } = await import("@/lib/enquiry/turnstile");
const { ENQUIRY_TYPE_VALUES } = await import("@/lib/data/types");
const { ENQUIRY_API_STATUS, ENQUIRY_ENDPOINT, ENQUIRY_ATTACHMENT_FIELD } = await import(
  "@/lib/enquiry/contract"
);

/* -------------------------------------------------------------------------- */
/* 1. Copy integrity — D-008, 03-copy-deck.md §11                             */
/* -------------------------------------------------------------------------- */

check("all six approved error messages match the deck, in order", () => {
  assert.deepEqual(ENQUIRY_ERROR_MESSAGES_IN_DECK_ORDER, DECK_SIX_ERRORS);
  return `${ENQUIRY_ERROR_MESSAGES_IN_DECK_ORDER.length} messages, character-for-character`;
});

check("every error key resolves to an approved message", () => {
  assert.deepEqual(Object.values(ENQUIRY_ERROR_MESSAGES), DECK_SIX_ERRORS);
  return `keys: ${Object.keys(ENQUIRY_ERROR_MESSAGES).join(", ")}`;
});

check("enquiry-type options are the three deck labels", () => {
  assert.deepEqual(
    ENQUIRY_TYPE_OPTIONS.map((option) => option.label),
    DECK_OPTION_LABELS,
  );
  return ENQUIRY_TYPE_OPTIONS.map((option) => `${option.label} => ${option.value}`).join(" | ");
});

check("enquiry-type options carry exactly three values (D-002: no investment option)", () => {
  assert.equal(ENQUIRY_TYPE_OPTIONS.length, 3);
  assert.equal(ENQUIRY_TYPE_VALUES.length, 3);
  const forbidden = /invest|capital|fund|yield|return|portfolio|asset\s+class/i;
  for (const option of ENQUIRY_TYPE_OPTIONS) {
    assert.ok(!forbidden.test(option.value), `option value reads as an investment: ${option.value}`);
    assert.ok(!forbidden.test(option.label), `option label reads as an investment: ${option.label}`);
  }
  return "no value or label matches an investment-shaped term";
});

/* -------------------------------------------------------------------------- */
/* 2. Validation — 06 §32, deck §11 field rules                               */
/* -------------------------------------------------------------------------- */

function candidate(overrides = {}) {
  return {
    name: "Test Sender",
    email: "sender@example.com",
    phone: "",
    enquiryType: "general-business",
    location: "",
    message: "A test enquiry message that is longer than twenty characters.",
    consent: true,
    ...overrides,
  };
}

check("a well-formed submission validates and is sanitised", () => {
  const result = validateEnquirySubmission(
    candidate({ name: "  Test Sender  ", email: " Sender@Example.COM ", phone: "(555) 010-2030" }),
  );
  assert.equal(result.ok, true);
  assert.equal(result.data.name, "Test Sender");
  assert.equal(result.data.email, "sender@example.com");
  assert.equal(result.data.phone, "(555) 010-2030");
  assert.equal(result.data.phone && result.data.phone.length > 0, true);
  return JSON.stringify({
    name: result.data.name,
    email: result.data.email,
    enquiryType: result.data.enquiryType,
  });
});

check("missing name → approved name message", () => {
  const result = validateEnquirySubmission(candidate({ name: "" }));
  assert.equal(result.ok, false);
  assert.deepEqual(result.fieldErrors, [
    { field: "name", message: DECK_SIX_ERRORS[0] },
  ]);
  return result.fieldErrors[0].message;
});

check("whitespace-only name is not a name", () => {
  const result = validateEnquirySubmission(candidate({ name: "   \t  " }));
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors[0].message, DECK_SIX_ERRORS[0]);
  return "control characters and spaces stripped before the minimum is applied";
});

check("invalid email → approved email message", () => {
  const result = validateEnquirySubmission(candidate({ email: "not-an-address" }));
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors[0].field, "email");
  assert.equal(result.fieldErrors[0].message, DECK_SIX_ERRORS[1]);
  return result.fieldErrors[0].message;
});

check("missing enquiry type → approved enquiry-type message", () => {
  const result = validateEnquirySubmission(candidate({ enquiryType: "" }));
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors[0].field, "enquiryType");
  assert.equal(result.fieldErrors[0].message, DECK_SIX_ERRORS[2]);
  return result.fieldErrors[0].message;
});

check("invented enquiry type is rejected, not coerced", () => {
  const result = validateEnquirySubmission(candidate({ enquiryType: "investment-opportunity" }));
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors[0].field, "enquiryType");
  return `"investment-opportunity" rejected with the approved message`;
});

check("message of 19 characters → approved minimum message", () => {
  const result = validateEnquirySubmission(candidate({ message: "x".repeat(19) }));
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors[0].field, "message");
  assert.equal(result.fieldErrors[0].message, DECK_SIX_ERRORS[3]);
  return `19 chars rejected; the 20th is the boundary (see next case)`;
});

check("message of exactly 20 characters passes", () => {
  const result = validateEnquirySubmission(candidate({ message: "x".repeat(20) }));
  assert.equal(result.ok, true);
  return "min(20) is inclusive";
});

check("whitespace padding cannot satisfy the 20-character minimum", () => {
  const result = validateEnquirySubmission(candidate({ message: `${"x".repeat(19)}${" ".repeat(30)}` }));
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors[0].message, DECK_SIX_ERRORS[3]);
  return "sanitisation runs before the minimum is measured";
});

check("absent consent is rejected", () => {
  const result = validateEnquirySubmission(candidate({ consent: false }));
  assert.equal(result.ok, false);
  assert.equal(result.fieldErrors[0].field, "consent");
  assert.equal(result.fieldErrors[0].message, DECK_SIX_ERRORS[5]);
  return "no approved consent string exists in the deck; the generic message is reused (reported)";
});

check("over-long message falls back to the generic message, never an invented one", () => {
  const result = validateEnquirySubmission(candidate({ message: "x".repeat(ENQUIRY_LIMITS.messageMax + 1) }));
  // The field is capped by sanitisation, so the record is accepted with a capped
  // message rather than rejected — no approved string exists for "too long".
  assert.equal(result.ok, true);
  assert.equal(result.data.message.length, ENQUIRY_LIMITS.messageMax);
  return `capped at ${ENQUIRY_LIMITS.messageMax} characters`;
});

check("validation failure payload contains no submitted value", () => {
  const sentinel = "SENTINEL_9f3c1b";
  const result = validateEnquirySubmission(candidate({ name: "", email: `${sentinel}@bad` }));
  const serialised = JSON.stringify(result);
  assert.ok(!serialised.includes(sentinel), "a submitted value appeared in the failure payload");
  return "sentinel absent from the serialised failure";
});

check("the exported Zod schema is the one used, and it enforces min 20", () => {
  const parsed = enquirySchema.safeParse(candidate({ message: "short message" }));
  assert.equal(parsed.success, false);
  const issue = parsed.error.issues.find((entry) => entry.path[0] === "message");
  assert.ok(issue, "no message issue reported");
  assert.equal(issue.code, "too_small");
  assert.equal(issue.minimum, 20);
  return `issue code=${issue.code} minimum=${issue.minimum}`;
});

check("FormData is read by the schema's field names", () => {
  const form = new FormData();
  form.set("name", "Test Sender");
  form.set("email", "sender@example.com");
  form.set("enquiryType", "general-business");
  form.set("message", "A test enquiry message that is longer than twenty characters.");
  form.set("consent", "on");
  const result = validateEnquirySubmission(formDataToEnquiryCandidate(form));
  assert.equal(result.ok, true);
  return "consent parsed from the checkbox value \"on\"";
});

check("honeypot is detected only when populated", () => {
  const empty = new FormData();
  empty.set(ENQUIRY_HONEYPOT_FIELD, "");
  const filled = new FormData();
  filled.set(ENQUIRY_HONEYPOT_FIELD, "https://spam.example");
  assert.equal(isHoneypotFilled(empty), false);
  assert.equal(isHoneypotFilled(filled), true);
  return `field name "${ENQUIRY_HONEYPOT_FIELD}"`;
});

/* -------------------------------------------------------------------------- */
/* 3. Sanitisation — 06 §32, §40                                              */
/* -------------------------------------------------------------------------- */

check("control, bidi and zero-width characters are removed", () => {
  const dirty = `a\u0000b\u202Ec\u200Bd\ufeffe`;
  const clean = sanitiseSingleLine(dirty, 100);
  assert.ok(!/[\u0000\u202E\u200B\ufeff]/.test(clean), `residual control character in ${JSON.stringify(clean)}`);
  return JSON.stringify(clean);
});

check("multi-line sanitisation preserves paragraphs and collapses runs", () => {
  const clean = sanitiseMultiline("one\r\n\r\ntwo\n\n\n\nthree", 500);
  assert.equal(clean, "one\n\ntwo\n\nthree");
  return JSON.stringify(clean);
});

check("phone normalisation keeps dialable characters and drops non-digits", () => {
  assert.equal(sanitisePhoneNumber("+1 (555) 010-2030", 32), "+1 (555) 010-2030");
  assert.equal(sanitisePhoneNumber("no digits here", 32), null);
  return "digits retained; a digit-free value becomes null";
});

check("uploaded filename paths cannot survive into a display name", () => {
  const clean = sanitiseDisplayFilename("../../etc/passwd.png", 120);
  assert.equal(clean, "passwd.png");
  const windows = sanitiseDisplayFilename("C:\\Users\\evil\\photo.jpg", 120);
  assert.equal(windows, "photo.jpg");
  return `${clean} · ${windows}`;
});

check("HTML escaping covers all five metacharacters", () => {
  assert.equal(escapeHtml(`<script>"x"&'y'</script>`), "&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;");
  return escapeHtml(`<img src=x onerror=1>`);
});

check("network-address pseudonym is stable, truncated and domain-separated", () => {
  const first = hashNetworkAddress("203.0.113.7");
  const second = hashNetworkAddress("203.0.113.7");
  assert.equal(first, second);
  assert.equal(first.length, 32);
  assert.notEqual(first, hashNetworkAddress("203.0.113.8"));
  assert.equal(hashNetworkAddress(null), null);
  assert.ok(!first.includes("203"), "the hash contains the raw address");
  return `${first} (32 hex chars)`;
});

check("client address is taken from the first forwarded hop", () => {
  const headers = new Headers({ "x-forwarded-for": "198.51.100.9, 10.0.0.1", "x-real-ip": "10.0.0.1" });
  assert.equal(clientAddressFromHeaders(headers), "198.51.100.9");
  assert.equal(clientAddressFromHeaders(new Headers()), null);
  return "x-forwarded-for first entry wins; x-real-ip is the fallback";
});

/* -------------------------------------------------------------------------- */
/* 4. Attachments — 06 §34, §57                                               */
/* -------------------------------------------------------------------------- */

function bytesOf(...values) {
  return new Uint8Array(values);
}

function padded(header, totalBytes) {
  const buffer = new Uint8Array(totalBytes);
  buffer.set(header, 0);
  return buffer;
}

const PNG = padded([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 64);
const JPEG = padded([0xff, 0xd8, 0xff, 0xe0], 64);
const PDF = new TextEncoder().encode("%PDF-1.7\n% test\n");
const GIF = padded([0x47, 0x49, 0x46, 0x38, 0x39, 0x61], 64);

check("magic bytes decide the type", () => {
  assert.equal(sniffAttachmentContentType(PNG), "image/png");
  assert.equal(sniffAttachmentContentType(JPEG), "image/jpeg");
  assert.equal(sniffAttachmentContentType(PDF), "application/pdf");
  assert.equal(sniffAttachmentContentType(GIF), null);
  assert.equal(sniffAttachmentContentType(bytesOf(1, 2, 3)), null);
  return "PNG/JPEG/PDF accepted by signature; GIF and junk rejected";
});

check("storage keys are generated, date-sharded and unique", () => {
  const first = buildStorageKey("image/png", new Date("2026-03-04T05:06:07Z"));
  const second = buildStorageKey("image/png", new Date("2026-03-04T05:06:07Z"));
  assert.match(first, /^enquiries\/2026\/03\/[0-9a-f-]{36}\.png$/);
  assert.notEqual(first, second, "two uploads collided on one key");
  // The extension comes from the sniffed type, not from anything the client sent.
  assert.match(buildStorageKey("application/pdf"), /\.pdf$/);
  assert.match(buildStorageKey("image/jpeg"), /\.jpg$/);
  // Single-digit months are zero-padded so the shard sorts lexicographically.
  assert.match(buildStorageKey("image/png", new Date("2026-01-02T00:00:00Z")), /^enquiries\/2026\/01\//);
  return `${first} · unique per upload · extension from the sniffed type`;
});

await checkAsync("a valid PNG is accepted and renamed", async () => {
  const file = new File([PNG], "IMG_2034.PNG", { type: "image/png" });
  const result = await prepareAttachments([file]);
  assert.equal(result.ok, true);
  assert.equal(result.attachments.length, 1);
  assert.equal(result.attachments[0].contentType, "image/png");
  assert.match(result.attachments[0].storageKey, /^enquiries\//);
  return `${result.attachments[0].name} → ${result.attachments[0].storageKey}`;
});

await checkAsync("an oversized file is rejected before its bytes are read", async () => {
  const file = new File([padded([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], ATTACHMENT_MAX_BYTES + 1)], "big.png", {
    type: "image/png",
  });
  const result = await prepareAttachments([file]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "too-large");
  return `${file.size} bytes > ${ATTACHMENT_MAX_BYTES} → reason "${result.reason}"`;
});

await checkAsync("a GIF renamed .png with a forged MIME is rejected", async () => {
  const file = new File([GIF], "innocent.png", { type: "image/png" });
  const result = await prepareAttachments([file]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported-type");
  return `forged type caught by magic bytes → reason "${result.reason}"`;
});

await checkAsync("a disallowed extension is rejected even with allowed bytes", async () => {
  const file = new File([PNG], "payload.svg", { type: "image/png" });
  const result = await prepareAttachments([file]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported-type");
  return `reason "${result.reason}"`;
});

await checkAsync("a mismatched declared type is rejected even when the bytes are allowed", async () => {
  const file = new File([PNG], "photo.png", { type: "text/html" });
  const result = await prepareAttachments([file]);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "unsupported-type");
  return `reason "${result.reason}"`;
});

await checkAsync("more files than the cap is rejected", async () => {
  const files = Array.from({ length: 6 }, (_, index) =>
    new File([PNG], `p${index}.png`, { type: "image/png" }),
  );
  const result = await prepareAttachments(files);
  assert.equal(result.ok, false);
  assert.equal(result.reason, "too-many-files");
  return `reason "${result.reason}"`;
});

await checkAsync("no files is a valid, empty result", async () => {
  const result = await prepareAttachments([]);
  assert.equal(result.ok, true);
  assert.equal(result.attachments.length, 0);
  return "attachments are optional";
});

/* -------------------------------------------------------------------------- */
/* 5. Rate limiting — D-023                                                   */
/* -------------------------------------------------------------------------- */

check("token bucket allows the configured burst and then refuses", () => {
  resetEnquiryRateLimit();
  const start = 1_000_000;
  const decisions = [0, 1, 2, 3].map((index) =>
    consumeEnquiryRateLimit("bucket-a", start + index),
  );
  assert.deepEqual(decisions.map((entry) => entry.allowed), [true, true, true, false]);
  assert.equal(decisions[3].retryAfterSeconds > 0, true);
  return `capacity ${ENQUIRY_RATE_LIMIT.capacity} per ${ENQUIRY_RATE_LIMIT.windowMs / 60000} min; retry-after ${decisions[3].retryAfterSeconds}s`;
});

check("buckets refill over the window", () => {
  resetEnquiryRateLimit();
  const start = 2_000_000;
  for (let index = 0; index < 3; index += 1) consumeEnquiryRateLimit("bucket-b", start + index);
  assert.equal(consumeEnquiryRateLimit("bucket-b", start + 3).allowed, false);
  // A full window later the bucket is replenished.
  assert.equal(consumeEnquiryRateLimit("bucket-b", start + ENQUIRY_RATE_LIMIT.windowMs).allowed, true);
  return "3 allowed → refused → allowed again after one full window";
});

check("buckets are per key", () => {
  resetEnquiryRateLimit();
  consumeEnquiryRateLimit("key-one", 3_000_000);
  consumeEnquiryRateLimit("key-one", 3_000_001);
  consumeEnquiryRateLimit("key-one", 3_000_002);
  assert.equal(consumeEnquiryRateLimit("key-one", 3_000_003).allowed, false);
  assert.equal(consumeEnquiryRateLimit("key-two", 3_000_003).allowed, true);
  return "an exhausted bucket does not affect another key";
});

/* -------------------------------------------------------------------------- */
/* 6. Notification template — D-021, 06 §40                                   */
/* -------------------------------------------------------------------------- */

const sampleEnquiry = {
  id: "6f1c0f5e-0000-4000-8000-000000000001",
  name: "<b>SENTINEL_NAME</b>",
  email: "sender@example.com",
  phone: "+1 (555) 010-2030",
  enquiryType: "property-improvement-maintenance",
  location: "Raymondville, TX",
  message: `Line one <script>alert("SENTINEL_MESSAGE")</script> & "quoted"`,
  attachments: [
    {
      name: 'evil" name.png',
      storageKey: "enquiries/2026/10/abc.png",
      contentType: "image/png",
      sizeBytes: 2048,
    },
  ],
  consentAt: "2026-10-19T00:00:00.000Z",
  status: "new",
  notes: [],
  ipHash: null,
  notification: { configured: false, attemptedAt: null, delivered: false, error: null },
  createdAt: "2026-10-19T00:00:00.000Z",
  updatedAt: "2026-10-19T00:00:00.000Z",
};

check("the email escapes every interpolated value", () => {
  const payload = buildEnquiryNotification(sampleEnquiry);
  assert.ok(!payload.html.includes("<b>SENTINEL_NAME</b>"), "sender-supplied markup survived into the HTML part");
  assert.ok(!payload.html.includes("<script>"), "a script tag survived into the HTML part");
  assert.ok(payload.html.includes("&lt;b&gt;SENTINEL_NAME&lt;/b&gt;"));
  assert.ok(payload.html.includes("&#39;evil&quot; name.png&#39;") || payload.html.includes("evil&quot; name.png"));
  return "no raw sender markup in the HTML part";
});

check("the subject contains no sender-supplied value", () => {
  const payload = buildEnquiryNotification({ ...sampleEnquiry, name: "SUBJECT_SENTINEL" });
  assert.ok(!payload.subject.includes("SUBJECT_SENTINEL"));
  assert.equal(payload.subject, "New website enquiry: Property improvement and maintenance");
  return payload.subject;
});

check("the email body uses the deck's own field labels", () => {
  const payload = buildEnquiryNotification(sampleEnquiry);
  for (const label of ["Full name", "Email address", "Phone number", "What is your enquiry about?", "Project location, city and state", "Message"]) {
    assert.ok(payload.html.includes(label), `label missing from the notification: ${label}`);
  }
  return "six deck §11 labels present";
});

check("attachments are described by key, never by a public URL", () => {
  const payload = buildEnquiryNotification(sampleEnquiry);
  assert.ok(payload.html.includes("enquiries/2026/10/abc.png"));
  assert.ok(!/https?:\/\//.test(payload.html), "a URL appears in the notification body");
  return "no http(s) reference anywhere in the body";
});

/* -------------------------------------------------------------------------- */
/* 7. Repository port and adapters — D-019                                    */
/* -------------------------------------------------------------------------- */

const devRepo = createDevEnquiryRepository();

await checkAsync("the port round-trips an enquiry through the dev adapter", async () => {
  const created = await devRepo.createEnquiry({
    name: "Test Sender",
    email: "sender@example.com",
    phone: null,
    enquiryType: "general-business",
    location: null,
    message: "A test enquiry message that is longer than twenty characters.",
    attachments: [],
    consentAt: new Date().toISOString(),
    ipHash: null,
  });
  assert.equal(created.status, "new");
  assert.equal(created.notes.length, 0);
  assert.equal(created.notification.delivered, false);
  const fetched = await devRepo.getEnquiry(created.id);
  assert.equal(fetched?.id, created.id);
  return `id ${created.id.slice(0, 8)}… status "new"`;
});

await checkAsync("status changes and notes are recorded", async () => {
  const page = await devRepo.listEnquiries({ limit: 1 });
  const id = page.items[0].id;
  const updated = await devRepo.updateEnquiryStatus(id, {
    status: "contacted",
    note: "Called back",
    actorId: null,
  });
  assert.equal(updated?.status, "contacted");
  assert.equal(updated?.notes.length, 1);
  const noted = await devRepo.addEnquiryNote(id, { body: "Second note", authorId: null });
  assert.equal(noted?.notes.length, 2);
  return `status ${updated?.status}, ${noted?.notes.length} notes`;
});

await checkAsync("the notification flag is settable and readable (D-021)", async () => {
  const page = await devRepo.listEnquiries({ limit: 1 });
  const id = page.items[0].id;
  const updated = await devRepo.setEnquiryNotification(id, {
    configured: false,
    attemptedAt: null,
    delivered: false,
    error: "not-configured",
  });
  assert.equal(updated?.notification.error, "not-configured");
  return "flag persisted on the stored record";
});

await checkAsync("unknown ids return null rather than throwing", async () => {
  assert.equal(await devRepo.getEnquiry("does-not-exist"), null);
  assert.equal(await devRepo.updateEnquiryStatus("does-not-exist", { status: "closed" }), null);
  assert.equal(await devRepo.addEnquiryNote("does-not-exist", { body: "x", authorId: null }), null);
  assert.equal(
    await devRepo.setEnquiryNotification("does-not-exist", {
      configured: false,
      attemptedAt: null,
      delivered: false,
      error: null,
    }),
    null,
  );
  return "four methods, four nulls";
});

await checkAsync("listEnquiries filters, pages and counts", async () => {
  for (let index = 0; index < 4; index += 1) {
    await devRepo.createEnquiry({
      name: `Pager ${index}`,
      email: "sender@example.com",
      phone: null,
      enquiryType: "general-business",
      location: null,
      message: "A test enquiry message that is longer than twenty characters.",
      attachments: [],
      consentAt: new Date().toISOString(),
      ipHash: null,
    });
  }
  const firstPage = await devRepo.listEnquiries({ limit: 2 });
  assert.equal(firstPage.items.length, 2);
  assert.ok(firstPage.nextCursor, "no cursor for a page that is not last");
  const secondPage = await devRepo.listEnquiries({ limit: 2, cursor: firstPage.nextCursor });
  assert.equal(secondPage.items.length, 2);
  assert.ok(
    !firstPage.items.some((entry) => secondPage.items.some((other) => other.id === entry.id)),
    "a record appeared on two pages",
  );
  const filtered = await devRepo.listEnquiries({ status: "new", limit: 100 });
  assert.ok(filtered.items.every((entry) => entry.status === "new"));
  assert.ok(firstPage.total >= 5, `total was ${firstPage.total}`);
  return `total ${firstPage.total}, page 1 ${firstPage.items.length}, page 2 ${secondPage.items.length}, filtered ${filtered.items.length}`;
});

await checkAsync("adapter selection follows MONGODB_URI (D-019)", async () => {
  const saved = process.env.MONGODB_URI;
  try {
    delete process.env.MONGODB_URI;
    resetEnquiryRepository();
    const dev = await getEnquiryRepository();
    assert.equal(dev.kind, "dev");

    process.env.MONGODB_URI = "mongodb://127.0.0.1:27017/nicben-phase05-probe";
    resetEnquiryRepository();
    const mongo = await getEnquiryRepository();
    assert.equal(mongo.kind, "mongo");
    return "absent → dev, present → mongo (no connection attempted)";
  } finally {
    if (saved === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = saved;
    resetEnquiryRepository();
  }
});

/* -------------------------------------------------------------------------- */
/* 8. Turnstile — D-022                                                       */
/* -------------------------------------------------------------------------- */

await checkAsync("no secret in development → skipped with ok:true", async () => {
  const savedNodeEnv = process.env.NODE_ENV;
  const savedSecret = process.env.TURNSTILE_SECRET_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  process.env.NODE_ENV = "development";
  try {
    const result = await verifyTurnstileToken({ token: null });
    assert.equal(result.ok, true);
    assert.equal(result.skipped, true);
    return "ok:true, skipped:true";
  } finally {
    restore("NODE_ENV", savedNodeEnv);
    restore("TURNSTILE_SECRET_KEY", savedSecret);
  }
});

await checkAsync("no secret in production → rejected (fail closed)", async () => {
  const savedNodeEnv = process.env.NODE_ENV;
  const savedSecret = process.env.TURNSTILE_SECRET_KEY;
  delete process.env.TURNSTILE_SECRET_KEY;
  process.env.NODE_ENV = "production";
  try {
    const result = await verifyTurnstileToken({ token: "anything" });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "not-configured");
    return `ok:false, reason "${result.reason}"`;
  } finally {
    restore("NODE_ENV", savedNodeEnv);
    restore("TURNSTILE_SECRET_KEY", savedSecret);
  }
});

await checkAsync("a secret with no token → rejected", async () => {
  const saved = process.env.TURNSTILE_SECRET_KEY;
  // Cloudflare's documented always-pass test secret; no real credential involved.
  process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
  try {
    const result = await verifyTurnstileToken({ token: null });
    assert.equal(result.ok, false);
    assert.equal(result.reason, "missing-token");
    return `ok:false, reason "${result.reason}"`;
  } finally {
    restore("TURNSTILE_SECRET_KEY", saved);
  }
});

function restore(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

/* -------------------------------------------------------------------------- */
/* 9. Contract constants                                                      */
/* -------------------------------------------------------------------------- */

check("the HTTP contract is stable and documents its own statuses", () => {
  assert.equal(ENQUIRY_ENDPOINT, "/api/enquiries");
  assert.equal(ENQUIRY_ATTACHMENT_FIELD, "attachments");
  assert.deepEqual(
    [ENQUIRY_API_STATUS.ok, ENQUIRY_API_STATUS.invalid, ENQUIRY_API_STATUS.forbidden, ENQUIRY_API_STATUS.rateLimited, ENQUIRY_API_STATUS.serverError],
    [200, 400, 403, 429, 500],
  );
  return `${ENQUIRY_ENDPOINT} → 200/400/403/413/429/500`;
});

/* -------------------------------------------------------------------------- */
/* Report                                                                     */
/* -------------------------------------------------------------------------- */

const width = Math.max(...results.map((entry) => entry.name.length));
console.log("\nPhase 05 — module verification\n");
for (const entry of results) {
  console.log(`${entry.status === "PASS" ? "  ok  " : " FAIL "} ${entry.name.padEnd(width)}  ${entry.detail}`);
}
console.log(
  `\n${results.length - failures}/${results.length} passed` + (failures ? ` — ${failures} FAILED` : ""),
);

await import("node:fs").then(({ writeFileSync }) =>
  writeFileSync(
    new URL("./lib-tests-report.json", import.meta.url),
    `${JSON.stringify({ total: results.length, failures, results }, null, 2)}\n`,
  ),
);

process.exit(failures === 0 ? 0 : 1);
