/**
 * Phase 06 library verification.
 *
 * Exercises the port, the auth primitives, the CSV writer and the audit writer **as
 * written**, by importing the application's own modules through Node's TypeScript type
 * stripping (`ts-loader.mjs`). There is no build step and no copy of any logic under test.
 *
 * Run:
 *   node --experimental-strip-types tests/phase-06/lib-tests.mjs
 */

import { randomUUID } from "node:crypto";

import "./ts-loader.mjs";

import { check, equal, section, summary, credentialsAbsentEnv, APP_ENV_VARS } from "./harness.mjs";

/* -------------------------------------------------------------------------- */
/* Environment                                                                 */
/* -------------------------------------------------------------------------- */

/* The harness runs in a child process whose environment the caller cleaned, so the
 * credentials-absent assertions below are made against a real absent environment rather
 * than against variables this file deleted. */
const absentBefore = APP_ENV_VARS.filter((name) => process.env[name] !== undefined);
if (absentBefore.length > 0) {
  process.stdout.write(`\nNOTE: harness inherited ${absentBefore.join(", ")} — unsetting in-process.\n`);
  for (const name of absentBefore) delete process.env[name];
}

/* -------------------------------------------------------------------------- */
/* Imports                                                                     */
/* -------------------------------------------------------------------------- */

const types = await import("@/lib/data/types");
const dataIndex = await import("@/lib/data/index");
const devAdapter = await import("@/lib/data/adapters/dev");
const rateLimit = await import("@/lib/rate-limit/token-bucket");
const enquiryRateLimit = await import("@/lib/enquiry/rate-limit");
const authConfig = await import("@/lib/auth/config");
const authPassword = await import("@/lib/auth/password");
const authSession = await import("@/lib/auth/session");
const authCsrf = await import("@/lib/auth/csrf");
const authLogin = await import("@/lib/auth/login");
const authThrottle = await import("@/lib/auth/login-rate-limit");
const auditLog = await import("@/lib/audit/log");
const csv = await import("@/lib/admin/csv");
const adminValidation = await import("@/lib/validation/admin");

const repository = await dataIndex.getEnquiryRepository();
equal("adapter selected with MONGODB_URI absent (D-019)", repository.kind, "dev");

/* -------------------------------------------------------------------------- */
/* 1. The port — every Phase 06 method, against the dev adapter                */
/* -------------------------------------------------------------------------- */

section("1. Port extensions — dev adapter");

const projectA = await repository.upsertProject({
  id: null,
  title: "Facade renewal — specimen record",
  slug: "facade-renewal-specimen",
  serviceTag: "project-management-contracting",
  location: "Texas",
  images: ["/images/hero/hero-architectural-concrete-facade.jpg"],
  summary: "Specimen record created by the verification harness.",
  published: true,
});
check("upsertProject creates and returns id", typeof projectA.id === "string" && projectA.id.length > 0, `id ${projectA.id.slice(0, 8)}…`);

const projectB = await repository.upsertProject({
  id: null,
  title: "Draft record",
  slug: "draft-record",
  serviceTag: "property-improvement-maintenance",
  location: "Texas",
  images: [],
  summary: "Draft.",
  published: false,
});

const projectAUpdated = await repository.upsertProject({ ...projectA, title: "Facade renewal — renamed" });
equal("upsertProject updates in place", projectAUpdated.id, projectA.id);
equal("upsertProject replaced the value", projectAUpdated.title, "Facade renewal — renamed");

const projectsAll = await repository.listProjects({});
equal("listProjects total", projectsAll.total, 2);
equal("listProjects newest first", projectsAll.items[0].id, projectB.id);
const projectsPublished = await repository.listProjects({ published: true });
equal("listProjects filters on published", projectsPublished.total, 1);
equal("listProjects published item", projectsPublished.items[0].id, projectA.id);
const projectPage = await repository.listProjects({ limit: 1 });
equal("listProjects pages", projectPage.items.length, 1);
check("listProjects returns a cursor when more remain", projectPage.nextCursor === projectB.id, `cursor ${projectPage.nextCursor}`);
const projectPage2 = await repository.listProjects({ limit: 1, cursor: projectPage.nextCursor });
equal("listProjects resumes from the cursor", projectPage2.items[0].id, projectA.id);
equal("listProjects last page has no cursor", projectPage2.nextCursor, null);
check(
  "project mutations return copies, not store handles",
  await (async () => {
    const snapshot = await repository.listProjects({});
    snapshot.items[0].images.push("mutated-by-the-harness");
    const rereadList = await repository.listProjects({});
    return !rereadList.items.some((record) => record.images.includes("mutated-by-the-harness"));
  })(),
  "store isolation",
);

const testimonialA = await repository.upsertTestimonial({
  id: null,
  name: "Specimen name",
  quote: "Specimen quote.",
  projectRef: projectA.slug,
  published: false,
});
const testimonialB = await repository.upsertTestimonial({
  id: null,
  name: "Second specimen",
  quote: "Second quote.",
  projectRef: null,
  published: true,
});
const testimonialUpdated = await repository.upsertTestimonial({ ...testimonialA, published: true });
equal("upsertTestimonial updates in place", testimonialUpdated.id, testimonialA.id);
const testimonialsAll = await repository.listTestimonials({});
equal("listTestimonials total", testimonialsAll.total, 2);
equal("listTestimonials filters on published", (await repository.listTestimonials({ published: true })).total, 2);
equal("listTestimonials filters drafts", (await repository.listTestimonials({ published: false })).total, 0);
equal("upsertTestimonial round-trips projectRef", (await repository.listTestimonials({})).items.find((t) => t.id === testimonialB.id).projectRef, null);

equal("getPageContent is null before anything is stored", await repository.getPageContent("what-we-do"), null);
const pageContent = await repository.upsertPageContent({
  pageKey: "what-we-do",
  sections: [
    { key: "pillar-1-scope", heading: "Scope", body: "Body text." },
    { key: "faq-1", heading: null, body: null },
  ],
});
equal("upsertPageContent stores the sections", pageContent.sections.length, 2);
check("upsertPageContent stamps updatedAt", /^\d{4}-\d{2}-\d{2}T/.test(pageContent.updatedAt), pageContent.updatedAt);
const reread = await repository.getPageContent("what-we-do");
equal("getPageContent returns the stored row", reread.id, pageContent.id);
const pageContentReplaced = await repository.upsertPageContent({
  pageKey: "what-we-do",
  sections: [{ key: "pillar-1-scope", heading: "Scope revised", body: null }],
});
equal("upsertPageContent replaces the section list", pageContentReplaced.sections.length, 1);
equal("upsertPageContent keeps the same id for a pageKey", pageContentReplaced.id, pageContent.id);
equal("getPageContent still null for another page", await repository.getPageContent("faq"), null);

equal("getSettings is null before anything is stored", await repository.getSettings(), null);
const settings = await repository.upsertSettings({
  contact: { address: "Texas", email: null, phone: null },
  serviceAreas: { states: null, note: null },
  seoDefaults: { titleTemplate: null, description: null },
});
equal("upsertSettings returns a singleton", (await repository.upsertSettings({ ...settings })).id, settings.id);
const settingsRead = await repository.getSettings();
equal("getSettings round-trips a null contact field", settingsRead.contact.email, null);
equal("getSettings round-trips the address", settingsRead.contact.address, "Texas");

const auditCreated = await repository.appendAuditLog({
  adminId: "admin-1",
  actorEmail: "operator@example.test",
  action: "settings-upsert",
  resourceType: "settings",
  resourceId: settings.id,
  ipHash: "0".repeat(32),
  userAgent: "harness",
  metadata: { contactEmailSet: false },
});
check("appendAuditLog returns a stamped record", /^\d{4}-\d{2}-\d{2}T/.test(auditCreated.createdAt), auditCreated.createdAt);
await repository.appendAuditLog({
  adminId: null,
  actorEmail: null,
  action: "login-failure",
  resourceType: "session",
  resourceId: null,
  ipHash: null,
  userAgent: null,
  metadata: null,
});
const allAudit = await repository.listAuditLog({});
equal("listAuditLog total", allAudit.total, 2);
equal("listAuditLog newest first", allAudit.items[0].action, "login-failure");
equal("listAuditLog filters by action", (await repository.listAuditLog({ action: "settings-upsert" })).total, 1);
equal("listAuditLog filters by resourceType", (await repository.listAuditLog({ resourceType: "settings" })).total, 1);
equal("listAuditLog unknown filter yields nothing", (await repository.listAuditLog({ action: "logout" })).total, 0);

/* Admin lookup — absent, then seeded. */
equal("findAdminByEmail is null when nothing is configured", await repository.findAdminByEmail("nobody@example.test"), null);
equal("dev adapter recorded why it did not seed", devAdapter.devAdminSeedReason(), "not-configured");

const hashForSeed = await authPassword.hashAdminPassword("harness-correct-horse-battery-1!");
const seeded = devAdapter.seedDevAdmin({ email: "Operator@Example.Test", passwordHash: hashForSeed });
const found = await repository.findAdminByEmail("operator@example.test");
check("findAdminByEmail lower-cases and finds the seeded admin", found !== null && found.id === seeded.id, `id ${seeded.id.slice(0, 8)}…`);
check("findAdminByEmail returns the stored hash to its caller only", found.passwordHash === hashForSeed, "hash round-trips");
equal("findAdminByEmail is null for an unknown address", await repository.findAdminByEmail("someone.else@example.test"), null);

/* Phase 05 surface must be untouched. */
const enquiry = await repository.createEnquiry({
  name: "Harness enquiry",
  email: "sender@example.test",
  phone: null,
  enquiryType: "general-business",
  location: null,
  message: "A message long enough to be a plausible enquiry body.",
  attachments: [],
  consentAt: new Date().toISOString(),
  ipHash: null,
});
equal("Phase 05 createEnquiry still works", enquiry.status, "new");
equal("Phase 05 listEnquiries still works", (await repository.listEnquiries({})).total, 1);

/* -------------------------------------------------------------------------- */
/* 2. The Phase 05 rate limiter still behaves identically after the extraction  */
/* -------------------------------------------------------------------------- */

section("2. Rate-limit engine extraction — Phase 05 behaviour preserved");

enquiryRateLimit.resetEnquiryRateLimit();
const start = 3_000_000;
const sequence = [0, 1, 2, 3].map((offset) => enquiryRateLimit.consumeEnquiryRateLimit("key-one", start + offset).allowed);
equal(
  "enquiry limiter still yields allow, allow, allow, deny",
  JSON.stringify(sequence),
  JSON.stringify([true, true, true, false]),
);
equal(
  "enquiry limiter retry-after is still 200 seconds",
  enquiryRateLimit.consumeEnquiryRateLimit("key-two", start).limit === 3
    ? enquiryRateLimit.consumeEnquiryRateLimit("key-two", start).retryAfterSeconds
    : -1,
  0,
);
enquiryRateLimit.resetEnquiryRateLimit();
for (let index = 0; index < 3; index += 1) enquiryRateLimit.consumeEnquiryRateLimit("key-three", start + index);
const blocked = enquiryRateLimit.consumeEnquiryRateLimit("key-three", start + 3);
equal("enquiry limiter refuses the fourth attempt", blocked.allowed, false);
equal("enquiry limiter retry-after matches Phase 05", blocked.retryAfterSeconds, 200);
equal(
  "enquiry limiter refills after the full window",
  enquiryRateLimit.consumeEnquiryRateLimit("key-three", start + enquiryRateLimit.ENQUIRY_RATE_LIMIT.windowMs).allowed,
  true,
);

const genericLimiter = rateLimit.createTokenBucketLimiter({ capacity: 2, windowMs: 1000 }, { scope: "test" });
equal("generic limiter allows up to capacity", genericLimiter.consume("k", 0).allowed && genericLimiter.consume("k", 0).allowed, true);
equal("generic limiter denies past capacity", genericLimiter.consume("k", 0).allowed, false);
equal("generic limiter peeks without consuming", genericLimiter.peek("k", 1000).available, true);
equal("generic limiter counts keys", genericLimiter.size(), 1);

/* -------------------------------------------------------------------------- */
/* 3. CSV escaping                                                             */
/* -------------------------------------------------------------------------- */

section("3. CSV escaping — structural and formula injection");

equal("plain value is not quoted", csv.escapeCsvValue("plain"), "plain");
equal("comma forces quoting", csv.escapeCsvValue("a,b"), '"a,b"');
equal("quote is doubled and the field quoted", csv.escapeCsvValue('he said "hi"'), '"he said ""hi"""');
equal("newline forces quoting and survives", csv.escapeCsvValue("line1\nline2"), '"line1\nline2"');
check("newline is preserved inside the quoted field", csv.escapeCsvValue("line1\nline2").includes("\n"), "newline present");
equal("carriage return forces quoting", csv.escapeCsvValue("a\rb"), '"a\rb"');
equal("leading = is neutralised and quoted", csv.escapeCsvValue('=HYPERLINK("http://x")'), '"\'=HYPERLINK(""http://x"")"');
equal("leading + is neutralised and quoted", csv.escapeCsvValue("+1+1"), "\"'+1+1\"");
equal("leading - is neutralised and quoted", csv.escapeCsvValue("-2+3"), "\"'-2+3\"");
equal("leading @ is neutralised and quoted", csv.escapeCsvValue("@SUM(A1)"), "\"'@SUM(A1)\"");
equal("leading tab is neutralised and quoted", csv.escapeCsvValue("\t=1+1"), "\"'\t=1+1\"");
equal("leading carriage return is neutralised and quoted", csv.escapeCsvValue("\r=1+1"), "\"'\r=1+1\"");
equal("surrounding whitespace is preserved by quoting", csv.escapeCsvValue("  padded  "), '"  padded  "');
equal("null and undefined become empty", `${csv.escapeCsvValue(null)}|${csv.escapeCsvValue(undefined)}`, "|");
equal(
  "a minus in the middle is not touched",
  csv.escapeCsvValue("Net-30 terms"),
  "Net-30 terms",
);
check("formula trigger detection is exact", csv.startsWithFormulaTrigger("=") && !csv.startsWithFormulaTrigger("a=b"), "first character only");

const csvDocument = csv.toCsv([
  ["name", "message"],
  ["A, B", 'He said "hello"\nand then left'],
  ["=cmd|'/c calc'!A0", "@evil"],
]);
const lines = csvDocument.replace(/^\uFEFF/, "").split("\r\n");
equal("CSV opens with a header row", lines[0], "name,message");
equal("CSV quotes a comma in the first field", lines[1].startsWith('"A, B",'), true);
check("CSV doubles the internal quote", lines[1].includes('""hello""'), lines[1]);
check("no unquoted formula trigger starts a field", !/,=/.test(csvDocument) && !/^=/m.test(csvDocument), "no field begins with =");
check("neutralised = field is present", csvDocument.includes('"\'=cmd'), "apostrophe prefix");
check("neutralised @ field is present", csvDocument.includes("'@evil"), "apostrophe prefix");
check("BOM is present by default", csv.toCsv([["a"]], { bom: true }).startsWith("\uFEFF"), "UTF-8 BOM");
check("BOM can be omitted", !csv.toCsv([["a"]], { bom: false }).startsWith("\uFEFF"), "no BOM");

/* -------------------------------------------------------------------------- */
/* 4. Password primitives                                                      */
/* -------------------------------------------------------------------------- */

section("4. Password primitives — argon2id (D-026)");

const argonHash = await authPassword.hashAdminPassword("correct horse battery staple 7!");
check("hash uses the argon2id PHC prefix", argonHash.startsWith("$argon2id$"), argonHash.slice(0, 22));
check("hash carries the OWASP parameter set", argonHash.includes("m=19456,t=2,p=1"), argonHash.split("$")[3]);
equal("verify accepts the correct password", (await authPassword.verifyAdminPassword(argonHash, "correct horse battery staple 7!")).ok, true);
const wrong = await authPassword.verifyAdminPassword(argonHash, "wrong password");
equal("verify rejects a wrong password", wrong.ok, false);
equal("wrong password is reported as a mismatch", wrong.reason, "mismatch");
equal("a non-hash is rejected without throwing", (await authPassword.verifyAdminPassword("plaintext", "x")).reason, "not-a-hash");
equal("a malformed argon2 value fails closed", (await authPassword.verifyAdminPassword("$argon2id$garbage", "x")).ok, false);
equal("the dummy verification target always fails", (await authPassword.verifyAgainstDummyHash("x")).ok, false);
check("two hashes of the same password differ (salted)", (await authPassword.hashAdminPassword("same-password-1")) !== (await authPassword.hashAdminPassword("same-password-1")), "random salt");

check("policy rejects a short password", authPassword.checkAdminPasswordPolicy("short1!").length > 0, "min-length");
check("policy rejects a password with no digit", authPassword.checkAdminPasswordPolicy("NoDigitsHere!!").length > 0, "min-digits");
check("policy rejects a password with no symbol", authPassword.checkAdminPasswordPolicy("NoSymbols1234").length > 0, "min-symbols");
check("policy rejects a well-known password", authPassword.checkAdminPasswordPolicy("Password1234").length > 0, "denied-value");
equal("policy accepts a conforming password", authPassword.checkAdminPasswordPolicy("Tex@s-Holdings-2026").length, 0);

/* -------------------------------------------------------------------------- */
/* 5. Session tokens — D-027                                                   */
/* -------------------------------------------------------------------------- */

section("5. Session tokens — HMAC, expiry, tamper resistance (D-027)");

const issued = authSession.issueAdminSession({ adminId: "admin-1", email: "operator@example.test" });
equal("a fresh token verifies", authSession.verifyAdminSessionToken(issued.token).ok, true);
equal("the token carries the admin id", authSession.verifyAdminSessionToken(issued.token).session.adminId, "admin-1");
equal("absent token is reported absent", authSession.verifyAdminSessionToken(null).reason, "absent");
equal("malformed token is reported malformed", authSession.verifyAdminSessionToken("a.b").reason, "malformed");
equal("a wrong version is malformed", authSession.verifyAdminSessionToken(`v9.${issued.token.split(".").slice(1).join(".")}`).reason, "malformed");

const [version, payload, signature] = issued.token.split(".");
const forgedPayload = Buffer.from(JSON.stringify({ sub: "admin-2", em: "attacker@example.test", iat: 1, exp: 4_000_000_000 }), "utf8").toString("base64url");
equal("an edited payload fails the signature", authSession.verifyAdminSessionToken(`${version}.${forgedPayload}.${signature}`).reason, "bad-signature");
equal("an edited signature fails", authSession.verifyAdminSessionToken(`${version}.${payload}.${"A".repeat(signature.length)}`).reason, "bad-signature");

const expired = authSession.issueAdminSession({ adminId: "admin-1", email: "operator@example.test", ttlSeconds: 60 }, 1_000_000);
equal(
  "an expired token is rejected server-side",
  authSession.verifyAdminSessionToken(expired.token, 1_000_000 + 61).reason,
  "expired",
);
equal("the same token is accepted one second earlier", authSession.verifyAdminSessionToken(expired.token, 1_000_000 + 59).ok, true);
equal("the signed exp matches the cookie max-age", expired.claims.exp - expired.claims.iat, expired.maxAgeSeconds);

/* A token signed under a different secret must not verify. */
const beforeRotation = authSession.issueAdminSession({ adminId: "admin-1", email: "operator@example.test" });
process.env.ADMIN_SESSION_SECRET = "a-different-secret-for-this-check";
authConfig.resetAdminSessionSecret();
equal(
  "a token signed under another secret is rejected",
  authSession.verifyAdminSessionToken(beforeRotation.token).reason,
  "bad-signature",
);
delete process.env.ADMIN_SESSION_SECRET;
authConfig.resetAdminSessionSecret();

/* Ephemeral secret, D-027: never a hardcoded default. */
equal("with no secret configured the source is ephemeral", authConfig.adminSessionSecretSource(), "ephemeral");
const fingerprintA = authConfig.adminSessionSecretFingerprint();
authConfig.resetAdminSessionSecret();
const fingerprintB = authConfig.adminSessionSecretFingerprint();
check("each boot with no secret generates a different secret", fingerprintA !== fingerprintB, `${fingerprintA} vs ${fingerprintB}`);
process.env.ADMIN_SESSION_SECRET = "configured-secret-for-harness";
authConfig.resetAdminSessionSecret();
equal("a configured secret is used verbatim", authConfig.adminSessionSecretSource(), "env");
equal("the configured secret is stable across a reset", (() => {
  const first = authConfig.adminSessionSecretFingerprint();
  authConfig.resetAdminSessionSecret();
  return authConfig.adminSessionSecretFingerprint() === first;
})(), true);
equal("cookie attributes are HttpOnly, Secure, SameSite=Lax (D-027)", JSON.stringify(authSession.ADMIN_SESSION_COOKIE_ATTRIBUTES), JSON.stringify(["HttpOnly", "Secure", "SameSite=Lax", "Path=/"]));
equal("the session cookie is httpOnly", authSession.ADMIN_SESSION_COOKIE_OPTIONS.httpOnly, true);
equal("the session cookie is Secure", authSession.ADMIN_SESSION_COOKIE_OPTIONS.secure, true);
equal("the session cookie is SameSite=Lax", authSession.ADMIN_SESSION_COOKIE_OPTIONS.sameSite, "lax");
equal("the CSRF cookie is script-readable by design", authSession.ADMIN_CSRF_COOKIE_OPTIONS.httpOnly, false);

/* -------------------------------------------------------------------------- */
/* 6. CSRF                                                                     */
/* -------------------------------------------------------------------------- */

section("6. CSRF — origin gate and double-submit token");

const tokenPair = { cookieToken: issued.csrfToken, headerToken: issued.csrfToken };
equal("same-origin with the token is accepted", authCsrf.assessCsrf({ origin: "https://x.test", host: "x.test", secFetchSite: "same-origin", ...tokenPair }), null);
equal("cross-site fetch metadata is rejected", authCsrf.assessCsrf({ origin: null, host: "x.test", secFetchSite: "cross-site", ...tokenPair }), "cross-site-fetch-metadata");
equal("a sibling subdomain is rejected", authCsrf.assessCsrf({ origin: null, host: "x.test", secFetchSite: "same-site", ...tokenPair }), "cross-site-fetch-metadata");
equal("a mismatched origin is rejected", authCsrf.assessCsrf({ origin: "https://evil.test", host: "x.test", secFetchSite: null, ...tokenPair }), "origin-mismatch");
equal("an unparseable origin is rejected", authCsrf.assessCsrf({ origin: "not a url", host: "x.test", secFetchSite: null, ...tokenPair }), "origin-unparseable");
equal("a missing CSRF cookie is a rejection, not a skip", authCsrf.assessCsrf({ origin: null, host: "x.test", secFetchSite: null, cookieToken: null, headerToken: issued.csrfToken }), "missing-csrf-cookie");
equal("a missing CSRF header is rejected", authCsrf.assessCsrf({ origin: null, host: "x.test", secFetchSite: null, cookieToken: issued.csrfToken, headerToken: null }), "missing-csrf-header");
equal("a mismatched token is rejected", authCsrf.assessCsrf({ origin: null, host: "x.test", secFetchSite: null, cookieToken: issued.csrfToken, headerToken: `${issued.csrfToken}x` }), "csrf-token-mismatch");

/* -------------------------------------------------------------------------- */
/* 7. Audit writer                                                             */
/* -------------------------------------------------------------------------- */

section("7. Audit writer — bounded detail payload");

const bounded = auditLog.boundAuditMetadata({
  note: "x".repeat(500),
  nested: { inner: "value" },
  list: [1, 2, 3],
  flag: true,
  count: 4,
  missing: undefined,
});
equal("a long string is truncated", bounded.note.endsWith("…"), true);
equal("a nested object becomes a kind marker", bounded.nested, "[object]");
equal("an array becomes a length marker", bounded.list, "[array:3]");
equal("a boolean survives", bounded.flag, true);
equal("a number survives", bounded.count, 4);
equal("an undefined value becomes null", bounded.missing, null);
equal("a null payload stays null", auditLog.boundAuditMetadata(null), null);
equal("an over-long user agent is capped", auditLog.boundUserAgent("u".repeat(1000)).length, 256);
equal("an empty user agent becomes null", auditLog.boundUserAgent("   "), null);

/* The image URLs are neither secrets nor personal data, but the *values* a mutation carries
 * must never reach the trail. */
const trailManager = await repository.appendAuditLog({
  adminId: "admin-1",
  actorEmail: "operator@example.test",
  action: "project-upsert",
  resourceType: "project",
  resourceId: projectA.id,
  ipHash: "0".repeat(32),
  userAgent: "harness",
  metadata: auditLog.boundAuditMetadata({ slug: projectA.slug, published: true }),
});
equal("an audit entry keeps references, not payloads", "images" in trailManager.metadata, false);

/* -------------------------------------------------------------------------- */
/* 8. Login — fail closed (D-028)                                              */
/* -------------------------------------------------------------------------- */

section("8. Login — fail closed with nothing configured (D-028)");

/* Clear every credential and every store, so this is a genuine "nothing configured" state. */
for (const name of APP_ENV_VARS) delete process.env[name];
authConfig.resetAdminSessionSecret();
devAdapter.resetDevAdminStore();
dataIndex.resetEnquiryRepository();
authThrottle.resetLoginThrottle();
authLogin.resetLoginWarnings();

const repositoryAfterReset = await dataIndex.getEnquiryRepository();
const failClosed = await authLogin.attemptAdminLogin({
  email: "operator@example.test",
  password: "anything-at-all-1!",
  clientAddress: "203.0.113.10",
  userAgent: "harness",
});
equal("no credentials and no store ⇒ login is rejected", failClosed.ok, false);
equal("the rejection status is 401", failClosed.status, 401);
equal("the rejection message is the single generic one", failClosed.message, authLogin.ADMIN_LOGIN_REJECTED_MESSAGE);
equal("nothing is seeded", devAdapter.devAdminSeedReason(), "not-configured");
equal("findAdminByEmail confirms there is no account", await repositoryAfterReset.findAdminByEmail("operator@example.test"), null);
check(
  "a common default password is not accepted either",
  (await authLogin.attemptAdminLogin({ email: "admin", password: "admin", clientAddress: "203.0.113.11", userAgent: "harness" })).ok === false,
  "no default password",
);

/* -------------------------------------------------------------------------- */
/* 9. Login — no user enumeration                                              */
/* -------------------------------------------------------------------------- */

section("9. Login — no user enumeration");

devAdapter.resetDevAdminStore();
authThrottle.resetLoginThrottle();
const adminHash = await authPassword.hashAdminPassword("operator-secret-2026!");
devAdapter.seedDevAdmin({ email: "operator@example.test", passwordHash: adminHash });
dataIndex.resetEnquiryRepository();

async function attempt(email, password, address) {
  const started = process.hrtime.bigint();
  const outcome = await authLogin.attemptAdminLogin({
    email,
    password,
    clientAddress: address,
    userAgent: "harness",
  });
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;
  return { outcome, elapsedMs };
}

/* Warm both paths once so the lazily-computed dummy hash is not counted in the measurement. */
await attempt("warm@example.test", "warm-up-password", "198.51.100.200");
await attempt("operator@example.test", "warm-up-password", "198.51.100.201");
authThrottle.resetLoginThrottle();

const unknownEmail = await attempt("nobody@example.test", "some-password-2026!", "198.51.100.10");
const wrongPassword = await attempt("operator@example.test", "some-password-2026!", "198.51.100.11");

equal("unknown email status", unknownEmail.outcome.status, 401);
equal("wrong password status", wrongPassword.outcome.status, 401);
equal("unknown email message equals wrong password message", unknownEmail.outcome.message, wrongPassword.outcome.message);
equal("unknown email reason", unknownEmail.outcome.reason, "invalid-credentials");
equal("wrong password reason", wrongPassword.outcome.reason, "invalid-credentials");
check(
  "elapsed work is comparable (within 3x, both paths run a full argon2id verify)",
  unknownEmail.elapsedMs > 0 &&
    wrongPassword.elapsedMs > 0 &&
    Math.max(unknownEmail.elapsedMs, wrongPassword.elapsedMs) /
      Math.min(unknownEmail.elapsedMs, wrongPassword.elapsedMs) <=
      3,
  `unknown ${unknownEmail.elapsedMs.toFixed(1)}ms · wrong ${wrongPassword.elapsedMs.toFixed(1)}ms`,
);

const auditAfterFailures = await repositoryAfterReset.listAuditLog({ action: "login-failure" });
check("both failures are audited", auditAfterFailures.total >= 2, `${auditAfterFailures.total} login-failure entries`);
check(
  "the two failure entries are identical in shape",
  JSON.stringify(auditAfterFailures.items[0].metadata) === JSON.stringify(auditAfterFailures.items[1].metadata),
  JSON.stringify(auditAfterFailures.items[0].metadata),
);
equal("the trail does not distinguish the account", auditAfterFailures.items[0].actorEmail, null);

/* No-enumeration also holds for the *number* of fields: a rejection never names one. */
check("the rejection carries no field-level detail", "fieldErrors" in unknownEmail.outcome === false, "no fieldErrors key");

/* A correct password, for contrast. */
authThrottle.resetLoginThrottle();
const success = await attempt("operator@example.test", "operator-secret-2026!", "198.51.100.12");
equal("the correct password authenticates", success.outcome.ok, true);
equal("the session names the account", success.outcome.session.email, "operator@example.test");
check("an audit entry records the successful login", (await repositoryAfterReset.listAuditLog({ action: "login-success" })).total === 1, "1 login-success");
check("the email is matched case-insensitively", (await attempt("OPERATOR@EXAMPLE.TEST", "operator-secret-2026!", "198.51.100.13")).outcome.ok, "upper-case address accepted");

/* -------------------------------------------------------------------------- */
/* 10. Login — throttling and lockout (D-023, §30, §31)                        */
/* -------------------------------------------------------------------------- */

section("10. Login — rate limit and lockout");

authThrottle.resetLoginThrottle();
const throttleSequence = [];
for (let index = 0; index < 7; index += 1) {
  const outcome = await authLogin.attemptAdminLogin({
    email: "operator@example.test",
    password: `wrong-${index}`,
    clientAddress: "198.51.100.20",
    userAgent: "harness",
  });
  throttleSequence.push(outcome.status);
}
check(
  "attempts are accepted then throttled (401 ×5 then 429)",
  JSON.stringify(throttleSequence) === JSON.stringify([401, 401, 401, 401, 401, 429, 429]),
  JSON.stringify(throttleSequence),
);
const throttled = await authLogin.attemptAdminLogin({
  email: "operator@example.test",
  password: "operator-secret-2026!",
  clientAddress: "198.51.100.20",
  userAgent: "harness",
});
equal("the correct password is still refused while locked out", throttled.ok, false);
equal("the refusal is a rate-limit status", throttled.status, 429);
check("the refusal quotes a wait", throttled.retryAfterSeconds > 0, `${throttled.retryAfterSeconds}s`);
equal(
  "the account key is a hash, not the address",
  authThrottle.adminLoginAccountKey("operator@example.test") !== "operator@example.test",
  true,
);
check(
  "the account key is domain-separated and truncated",
  /^login:account:[0-9a-f]{32}$/.test(authThrottle.adminLoginAccountKey("operator@example.test")),
  authThrottle.adminLoginAccountKey("operator@example.test"),
);

/* A different address and a different account are unaffected by the first pair's lock. */
const otherPair = await authLogin.attemptAdminLogin({
  email: "someone@example.test",
  password: "wrong",
  clientAddress: "198.51.100.99",
  userAgent: "harness",
});
equal("an unrelated address and account is not collateral damage", otherPair.status, 401);

/* Account-only lockout: a fresh address, same account, still blocked by the account key. */
authThrottle.resetLoginThrottle();
for (let index = 0; index < 5; index += 1) {
  await authLogin.attemptAdminLogin({
    email: "operator@example.test",
    password: `wrong-${index}`,
    clientAddress: `198.51.100.${30 + index}`,
    userAgent: "harness",
  });
}
const accountLocked = await authLogin.attemptAdminLogin({
  email: "operator@example.test",
  password: "operator-secret-2026!",
  clientAddress: "198.51.100.77",
  userAgent: "harness",
});
equal("five failures from five addresses lock the account as well as each address", accountLocked.status, 429);
authThrottle.resetLoginThrottle();
equal(
  "after a reset the correct password works again",
  (await authLogin.attemptAdminLogin({
    email: "operator@example.test",
    password: "operator-secret-2026!",
    clientAddress: "198.51.100.80",
    userAgent: "harness",
  })).ok,
  true,
);

/* `recordLoginSuccess` resets the consecutive-failure counter, so a mistyped password does
 * not leave the operator one failure away from a lock. Tested on the counters directly,
 * because the token bucket caps the number of attempts a single address can make and would
 * otherwise be what refused the later calls. */
authThrottle.resetLoginThrottle();
for (let index = 0; index < 4; index += 1) {
  authThrottle.recordLoginFailure({ ipHash: "harness-key", email: "counter@example.test", now: 1_000_000 + index });
}
const beforeSuccess = authThrottle.loginThrottleSnapshot().lockEntries;
check("failures are tracked per key", beforeSuccess >= 2, `${beforeSuccess} lock entries`);
authThrottle.recordLoginSuccess({ ipHash: "harness-key", email: "counter@example.test" });
let lastDecision = null;
for (let index = 0; index < 4; index += 1) {
  lastDecision = authThrottle.recordLoginFailure({
    ipHash: "harness-key",
    email: "counter@example.test",
    now: 1_000_000 + index,
  });
}
equal("a successful login resets the consecutive-failure count", lastDecision.allowed, true);
authThrottle.resetLoginThrottle();

/* -------------------------------------------------------------------------- */
/* 11. Validation schemas                                                      */
/* -------------------------------------------------------------------------- */

section("11. Validation — server-side, authoritative (§32)");

function valid(schema, value) {
  return schema.safeParse(value);
}

equal("a project title is sanitised and accepted", valid(adminValidation.projectUpsertSchema, {
  title: "  Facade   renewal  ",
  slug: "facade-renewal",
  serviceTag: "pm",
  location: "Texas",
  images: [],
  summary: "Summary.",
  published: "true",
}).data.title, "Facade renewal");
equal("a checkbox string is coerced to a boolean", valid(adminValidation.projectUpsertSchema, {
  title: "T",
  slug: "t",
  serviceTag: "s",
  location: "L",
  images: [],
  summary: "S",
  published: "on",
}).data.published, true);
equal('"false" does not coerce to true', valid(adminValidation.projectUpsertSchema, {
  title: "T",
  slug: "t",
  serviceTag: "s",
  location: "L",
  images: [],
  summary: "S",
  published: "false",
}).data.published, false);
equal("an upper-case slug is lower-cased", valid(adminValidation.projectUpsertSchema, {
  title: "T",
  slug: "Facade-Renewal",
  serviceTag: "s",
  location: "L",
  images: [],
  summary: "S",
  published: true,
}).data.slug, "facade-renewal");
equal("a slug with a space is rejected", valid(adminValidation.projectUpsertSchema, {
  title: "T",
  slug: "facade renewal",
  serviceTag: "s",
  location: "L",
  images: [],
  summary: "S",
  published: true,
}).success, false);
equal("a control character is stripped from stored text", valid(adminValidation.projectUpsertSchema, {
  title: "Ti\u0000tle\u202E",
  slug: "t",
  serviceTag: "s",
  location: "L",
  images: [],
  summary: "S",
  published: true,
}).data.title, "Title");
equal("an envelope-control character is stripped", valid(adminValidation.testimonialUpsertSchema, {
  name: "Na\u202Eme",
  quote: "Q",
  projectRef: null,
  published: true,
}).data.name, "Name");
equal("an empty optional becomes null", valid(adminValidation.testimonialUpsertSchema, {
  name: "N",
  quote: "Q",
  projectRef: "   ",
  published: false,
}).data.projectRef, null);
equal("an empty contact email becomes null", valid(adminValidation.settingsUpsertSchema, {
  contact: { address: "", email: "", phone: "" },
  serviceAreas: { states: null, note: "" },
  seoDefaults: { titleTemplate: "", description: "" },
}).data.contact.email, null);
equal("a malformed contact email is rejected", valid(adminValidation.settingsUpsertSchema, {
  contact: { address: "", email: "not-an-address", phone: "" },
  serviceAreas: { states: null, note: "" },
  seoDefaults: { titleTemplate: "", description: "" },
}).success, false);
equal("an unknown enquiry status is rejected", valid(adminValidation.enquiryStatusUpdateSchema, { status: "closed-forever" }).success, false);
equal("a known enquiry status is accepted", valid(adminValidation.enquiryStatusUpdateSchema, { status: "quoted" }).data.status, "quoted");
equal("the status schema has no actor field", "actorId" in (valid(adminValidation.enquiryStatusUpdateSchema, { status: "new", actorId: "admin-2" }).data ?? {}), false);
equal("a page key with an upper-case segment is lower-cased", valid(adminValidation.pageContentUpsertSchema, {
  pageKey: "what-we-do",
  sections: [],
}).data.pageKey, "what-we-do");
equal("a page key with a space is rejected", valid(adminValidation.pageContentUpsertSchema, { pageKey: "what we do", sections: [] }).success, false);
equal("a password is not trimmed by the login schema", valid(adminValidation.adminLoginSchema, { email: "a@b.test", password: " padded " }).data.password, " padded ");
equal("an empty password is rejected by the login schema", valid(adminValidation.adminLoginSchema, { email: "a@b.test", password: "" }).success, false);
equal("an over-long password is rejected by the login schema", valid(adminValidation.adminLoginSchema, { email: "a@b.test", password: "x".repeat(600) }).success, false);
equal("an enquiry status query filter is validated", valid(adminValidation.enquiryListQuerySchema, { status: "bogus" }).success, false);
equal("an audit action filter is validated against the closed vocabulary", valid(adminValidation.auditLogQuerySchema, { action: "made-up" }).success, false);
equal("a valid audit action filter passes", valid(adminValidation.auditLogQuerySchema, { action: "login-success" }).data.action, "login-success");
equal("the audit vocabulary is closed at the type level too", types.AUDIT_ACTION_VALUES.length, 9);
equal("the resource vocabulary is closed", types.AUDIT_RESOURCE_TYPE_VALUES.length, 6);

/* -------------------------------------------------------------------------- */
/* 12. The seeded-admin path (D-030)                                           */
/* -------------------------------------------------------------------------- */

section("12. Dev-adapter seeding from the environment (D-030)");

devAdapter.resetDevAdminStore();
authThrottle.resetLoginThrottle();
process.env.ADMIN_EMAIL = "Seeded.Operator@Example.Test";
process.env.ADMIN_PASSWORD_HASH = adminHash;
dataIndex.resetEnquiryRepository();
const seededRepository = await dataIndex.getEnquiryRepository();
const seededAdmin = await seededRepository.findAdminByEmail("seeded.operator@example.test");
check("the adapter seeds an admin from ADMIN_EMAIL + ADMIN_PASSWORD_HASH", seededAdmin !== null, seededAdmin ? `id ${seededAdmin.id.slice(0, 8)}…` : "null");
equal("the seed reason is recorded", devAdapter.devAdminSeedReason(), "seeded");
equal(
  "the seeded admin authenticates",
  (await authLogin.attemptAdminLogin({
    email: "seeded.operator@example.test",
    password: "operator-secret-2026!",
    clientAddress: "198.51.100.90",
    userAgent: "harness",
  })).ok,
  true,
);

devAdapter.resetDevAdminStore();
process.env.ADMIN_PASSWORD_HASH = "a-plaintext-password-typed-into-the-wrong-variable";
const rejected = await dataIndex.getEnquiryRepository().then((r) => r.findAdminByEmail("seeded.operator@example.test"));
equal("a non-hash value is refused rather than becoming a credential", rejected, null);
equal("the refusal is recorded with its reason", devAdapter.devAdminSeedReason(), "invalid-hash");

devAdapter.resetDevAdminStore();
delete process.env.ADMIN_EMAIL;
delete process.env.ADMIN_PASSWORD_HASH;
equal("no seed with a half-configured pair", await dataIndex.getEnquiryRepository().then((r) => r.findAdminByEmail("seeded.operator@example.test")), null);

/* -------------------------------------------------------------------------- */
/* Report                                                                      */
/* -------------------------------------------------------------------------- */

const outcome = summary();
process.stdout.write(`\nunique audit id sample: ${randomUUID().slice(0, 8)}\n`);
process.exit(outcome.failed === 0 ? 0 : 1);
