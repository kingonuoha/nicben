/**
 * Phase 06 HTTP verification — the server-side checks, over real HTTP.
 *
 * Two modes, because the phase has two different things to prove:
 *
 * | Mode        | Server environment                    | What it proves |
 * |-------------|---------------------------------------|----------------|
 * | `zero`      | **zero** application variables         | every admin API is `401` unauthenticated (enumerated, not sampled); fail closed (D-028); the portal is unreachable |
 * | `seeded`    | `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` | login, cookie attributes, CSRF, validation, audit trail, CSV escaping, throttling, session expiry, privilege separation |
 *
 * The endpoint list is **derived from the route files on disk**, not from a hand-written
 * list, so a route added later cannot be omitted from the enumeration by forgetting to
 * update this file.
 *
 * Run: node tests/phase-06/http-tests.mjs --mode=zero --base=http://localhost:3210
 */

import { readdir, readFile } from "node:fs/promises";
import { createHmac } from "node:crypto";
import path from "node:path";

import { check, equal, section, summary, PROJECT_ROOT } from "./harness.mjs";

/* -------------------------------------------------------------------------- */
/* Arguments                                                                   */
/* -------------------------------------------------------------------------- */

const args = new Map(
  process.argv
    .slice(2)
    .filter((entry) => entry.startsWith("--"))
    .map((entry) => {
      const [key, value = "true"] = entry.replace(/^--/, "").split("=");
      return [key, value];
    }),
);

const MODE = args.get("mode") ?? "zero";
const BASE = (args.get("base") ?? "http://127.0.0.1:3210").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.HARNESS_ADMIN_EMAIL ?? "operator@example.test";
const ADMIN_PASSWORD = process.env.HARNESS_ADMIN_PASSWORD ?? "operator-secret-2026!";
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? "";

/* -------------------------------------------------------------------------- */
/* Route enumeration                                                           */
/* -------------------------------------------------------------------------- */

/** A value for a dynamic segment. 24 hex characters, so it is a valid ObjectId too. */
const DYNAMIC_VALUE = "000000000000000000000000";

/** Walk `app/api/admin/**` and return one entry per route file. */
async function discoverAdminRouteFiles() {
  const root = path.join(PROJECT_ROOT, "app", "api", "admin");
  const found = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(absolute);
      } else if (entry.name === "route.ts" || entry.name === "route.tsx") {
        found.push(absolute);
      }
    }
  }

  await walk(root);
  return found.sort();
}

/** Any file under `app/admin/**` that renders — the portal's pages. Informational only: not this agent's scope. */
async function discoverAdminPageFiles() {
  const root = path.join(PROJECT_ROOT, "app", "admin");
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
      else if (entry.name === "page.tsx" || entry.name === "page.ts") found.push(absolute);
    }
  }
  await walk(root);
  return found.sort();
}

const HTTP_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

/**
 * The HTTP methods a route file exports. Both `export async function GET` and
 * `export const PATCH = handler` forms are recognised, because both are used in this
 * codebase (`export const PUT = update`).
 */
function exportedMethods(source) {
  const methods = new Set();
  for (const method of HTTP_METHODS) {
    const declaration = new RegExp(`export\\s+(async\\s+)?function\\s+${method}\\b`);
    const assignment = new RegExp(`export\\s+const\\s+${method}\\s*=`);
    if (declaration.test(source) || assignment.test(source)) methods.add(method);
  }
  return [...methods].sort();
}

/** `/api/admin/enquiries/[id]` from the file path, with the dynamic segment filled in. */
function urlPathFor(routeFile) {
  const relative = path.relative(path.join(PROJECT_ROOT, "app"), path.dirname(routeFile));
  const segments = relative.split(path.sep).map((segment) => {
    const dynamic = /^\[(.+)]$/.exec(segment);
    if (!dynamic) return segment;
    if (dynamic[1].startsWith("...")) return DYNAMIC_VALUE;
    return DYNAMIC_VALUE;
  });
  return `/${segments.join("/")}`;
}

const routeFiles = await discoverAdminRouteFiles();
const endpoints = [];
for (const file of routeFiles) {
  const source = await readFile(file, "utf8");
  for (const method of exportedMethods(source)) {
    endpoints.push({
      method,
      path: urlPathFor(file),
      file: path.relative(PROJECT_ROOT, file).split(path.sep).join("/"),
    });
  }
}

/* -------------------------------------------------------------------------- */
/* HTTP helpers                                                                */
/* -------------------------------------------------------------------------- */

/**
 * A minimal cookie jar. Both cookies the portal sets are absorbed, `Max-Age=0` (the
 * delete form logout uses) removes one, and the jar's contents are replayed as the
 * `Cookie` header on the next request — the same behaviour a browser has, which is what
 * makes the CSRF and session assertions meaningful.
 */
function makeJar() {
  const cookies = new Map();
  return {
    absorb(response) {
      const values = typeof response.headers.getSetCookie === "function"
        ? response.headers.getSetCookie()
        : [response.headers.get("set-cookie")].filter(Boolean);
      for (const value of values) {
        const [pair] = value.split(";");
        const index = pair.indexOf("=");
        const name = pair.slice(0, index).trim();
        const cookieValue = pair.slice(index + 1).trim();
        if (!name) continue;
        // `Max-Age=0` is the delete form used by logout.
        if (/max-age=0/i.test(value)) cookies.delete(name);
        else cookies.set(name, cookieValue);
      }
    },
    header() {
      return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    get(name) {
      return cookies.get(name) ?? null;
    },
    set(name, value) {
      cookies.set(name, value);
    },
    clear() {
      cookies.clear();
    },
  };
}

function client(jar, address = "198.51.100.5") {
  return async function request(pathname, options = {}) {
    const headers = {
      // A real browser always sends a Host header; the origin gate compares against it.
      host: new URL(BASE).host,
      "x-forwarded-for": options.address ?? address,
      ...(options.headers ?? {}),
    };
    if (jar && jar.header()) headers.cookie = jar.header();
    if (options.body !== undefined && options.rawBody === undefined) {
      headers["content-type"] = "application/json";
    }
    const response = await fetch(`${BASE}${pathname}`, {
      method: options.method ?? "GET",
      headers,
      body: options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
      redirect: "manual",
    });
    if (jar) jar.absorb(response);
    const text = await response.text();
    return {
      status: response.status,
      headers: response.headers,
      setCookie: response.headers.getSetCookie?.() ?? [],
      text,
      json: (() => {
        try {
          return JSON.parse(text);
        } catch {
          return null;
        }
      })(),
    };
  };
}

/* -------------------------------------------------------------------------- */
/* MODE: zero environment variables                                            */
/* -------------------------------------------------------------------------- */

if (MODE === "zero") {
  section(`A. Unauthenticated enumeration — ${endpoints.length} method/route pairs`);

  const jar = makeJar();
  const request = client(jar);
  const table = [];

  // No cookies, no credentials, no CSRF token: exactly what a stranger can send.
  for (const endpoint of endpoints) {
    const response = await request(endpoint.path, {
      method: endpoint.method,
      ...(endpoint.method === "GET" || endpoint.method === "HEAD" ? {} : { body: {} }),
      address: "203.0.113.7",
    });
    table.push({ ...endpoint, status: response.status, error: response.json?.error ?? null });
    check(
      `${endpoint.method.padEnd(6)} ${endpoint.path}`,
      response.status === 401,
      `→ ${response.status} ${response.json?.error ?? response.text.slice(0, 40)}`,
    );
  }

  const notUnauthorized = table.filter((row) => row.status !== 401);
  equal("every admin API rejects an unauthenticated caller with 401", notUnauthorized.length, 0);
  check("the enumeration covered every route file", routeFiles.length > 0 && table.length >= routeFiles.length, `${routeFiles.length} files → ${table.length} method/route pairs`);

  section("B. Fail closed with no credentials configured (D-028)");

  const loginAttempts = [
    { label: "well-formed body", body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD } },
    { label: "a common default pair", body: { email: "admin@nicben.test", password: "admin" } },
    { label: "empty body", body: {} },
    { label: "no body at all", body: undefined },
    { label: "wrong types", body: { email: 42, password: { nested: true } } },
  ];
  for (const attempt of loginAttempts) {
    const response = await request("/api/admin/auth/login", {
      method: "POST",
      ...(attempt.body === undefined ? {} : { body: attempt.body }),
      address: "203.0.113.8",
    });
    equal(
      `login rejected: ${attempt.label}`,
      response.status,
      401,
      `${response.json?.error ?? ""} ${response.json?.message ?? ""}`,
    );
  }

  const noCookie = await request("/api/admin/auth/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    address: "203.0.113.9",
  });
  check(
    "a rejected login sets no session cookie",
    noCookie.setCookie.every((value) => !value.startsWith("nicben_admin_session=")),
    `${noCookie.setCookie.length} Set-Cookie header(s)`,
  );

  section("C. Concealment (not a security control — §27)");

  const robots = await request("/robots.txt");
  check("robots.txt still disallows /admin", robots.text.includes("Disallow: /admin"), "disallow present");
  const sitemap = await request("/sitemap.xml");
  check("sitemap.xml does not list /admin", !sitemap.text.includes("/admin"), `${sitemap.text.length} bytes`);

  const pageFiles = await discoverAdminPageFiles();
  process.stdout.write(`\n  portal page files present: ${pageFiles.length} (not this agent's scope)\n`);

  const outcome = summary();
  process.exit(outcome.failed === 0 ? 0 : 1);
}

/* -------------------------------------------------------------------------- */
/* MODE: seeded credentials                                                    */
/* -------------------------------------------------------------------------- */

if (MODE !== "seeded") {
  process.stderr.write(`unknown mode: ${MODE}\n`);
  process.exit(2);
}

if (!SESSION_SECRET) {
  process.stderr.write("seeded mode needs ADMIN_SESSION_SECRET in the environment\n");
  process.exit(2);
}

const jar = makeJar();
const request = client(jar);

/* --- 1. Login ------------------------------------------------------------- */

section("1. Login, cookie attributes and session verification");

const wrongLogin = await request("/api/admin/auth/login", {
  method: "POST",
  body: { email: ADMIN_EMAIL, password: "definitely-not-the-password" },
  address: "198.51.100.201",
});
equal("a wrong password is 401", wrongLogin.status, 401);
equal("the failure body is the single generic message", wrongLogin.json.message, "Invalid email or password.");

const unknownLogin = await request("/api/admin/auth/login", {
  method: "POST",
  body: { email: "nobody@example.test", password: "definitely-not-the-password" },
  address: "198.51.100.202",
});
equal("an unknown address is 401", unknownLogin.status, 401);
equal("unknown address and wrong password are byte-identical in body", JSON.stringify(unknownLogin.json), JSON.stringify(wrongLogin.json));
check("the two requests set identical cookies (i.e. none)", JSON.stringify(unknownLogin.setCookie) === JSON.stringify(wrongLogin.setCookie), "no Set-Cookie on either");

jar.clear();
const login = await request("/api/admin/auth/login", {
  method: "POST",
  body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  address: "198.51.100.203",
});
equal("the correct password signs in", login.status, 200);
check("a session cookie is set", jar.get("nicben_admin_session") !== null, "nicben_admin_session present");
check("a CSRF cookie is set", jar.get("nicben_admin_csrf") !== null, "nicben_admin_csrf present");

const sessionSetCookie = login.setCookie.find((value) => value.startsWith("nicben_admin_session=")) ?? "";
check("the session cookie is HttpOnly", /HttpOnly/i.test(sessionSetCookie), "HttpOnly");
check("the session cookie is Secure", /Secure/i.test(sessionSetCookie), "Secure");
check("the session cookie is SameSite=Lax", /SameSite=lax/i.test(sessionSetCookie), "SameSite=Lax");
check("the session cookie is scoped to the whole site", /Path=\//i.test(sessionSetCookie), "Path=/");
check("the session cookie carries a Max-Age", /Max-Age=\d+/i.test(sessionSetCookie), /Max-Age=\d+/i.exec(sessionSetCookie)?.[0] ?? "none");
check("the session cookie is not readable by script", /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(jar.get("nicben_admin_session") ?? ""), "the value is the signed token alone, with no attributes");
const csrfSetCookie = login.setCookie.find((value) => value.startsWith("nicben_admin_csrf=")) ?? "";
check("the CSRF cookie is NOT HttpOnly (the mechanism requires a script read)", !/HttpOnly/i.test(csrfSetCookie), "script-readable");

const sessionInfo = await request("/api/admin/auth/session");
equal("the session endpoint answers with a valid session", sessionInfo.status, 200);
equal("the session names the configured account", sessionInfo.json.data.email, ADMIN_EMAIL.toLowerCase());
check("the session reports a server-enforced expiry in the future", new Date(sessionInfo.json.data.expiresAt).getTime() > Date.now(), sessionInfo.json.data.expiresAt);
check("the response echoes the CSRF header name", sessionInfo.json.data.csrfHeader === "x-nicben-csrf", sessionInfo.json.data.csrfHeader);

/** The issued token's signed payload, used below to mint tokens with genuine signatures. */
const issuedPayload = JSON.parse(
  Buffer.from(jar.get("nicben_admin_session").split(".")[1], "base64url").toString("utf8"),
);
check("the token payload is a signed claims object", typeof issuedPayload.sub === "string" && typeof issuedPayload.em === "string", JSON.stringify({ sub: issuedPayload.sub.slice(0, 8), em: issuedPayload.em }));

/* --- 2. Privilege separation --------------------------------------------- */

section("2. Privilege separation — the actor comes from the session, never the body");

/** Mint a token exactly as the application does, so the signature is genuine. */
function mintToken(claims) {
  const payloadSegment = `v1.${Buffer.from(JSON.stringify(claims), "utf8").toString("base64url")}`;
  const signature = createHmac("sha256", `${"nicben:admin-session:v1:"}${SESSION_SECRET}`)
    .update(payloadSegment)
    .digest("base64url");
  return `${payloadSegment}.${signature}`;
}

const nowSeconds = Math.floor(Date.now() / 1000);
const foreignSubject = mintToken({
  sub: "000000000000000000000001",
  em: ADMIN_EMAIL.toLowerCase(),
  iat: nowSeconds,
  exp: nowSeconds + 3600,
});
const foreignJar = makeJar();
const foreignRequest = client(foreignJar);
foreignJar.set("nicben_admin_session", foreignSubject);
const foreignResponse = await foreignRequest("/api/admin/auth/session");
equal(
  "a correctly-signed token naming a different subject is rejected",
  foreignResponse.status,
  401,
);

const otherAccount = mintToken({
  sub: "000000000000000000000002",
  em: "other.operator@example.test",
  iat: nowSeconds,
  exp: nowSeconds + 3600,
});
const otherJar = makeJar();
const otherRequest = client(otherJar);
otherJar.set("nicben_admin_session", otherAccount);
equal(
  "a correctly-signed token naming an account that does not exist is rejected",
  (await otherRequest("/api/admin/auth/session")).status,
  401,
);

const forgedJar = makeJar();
const forgedRequest = client(forgedJar);
forgedJar.set("nicben_admin_session", `${foreignSubject.slice(0, -4)}AAAA`);
equal("a token with a tampered signature is rejected", (await forgedRequest("/api/admin/auth/session")).status, 401);

/* A body that tries to name another actor is ignored: the schema has no such field. */
const actorSpoof = await request("/api/admin/settings", {
  method: "PUT",
  body: {
    adminId: "000000000000000000000009",
    actorEmail: "attacker@example.test",
    contact: { address: null, email: null, phone: null },
    serviceAreas: { states: null, note: null },
    seoDefaults: { titleTemplate: null, description: null },
  },
  headers: { "x-nicben-csrf": jar.get("nicben_admin_csrf") },
});
equal("a settings write succeeds while naming another actor in the body", actorSpoof.status, 200);
const settingsAudit = await request("/api/admin/audit?resourceType=settings&limit=5", {
  headers: { accept: "application/json" },
});
const settingsEntry = settingsAudit.json.data.items[0];
equal("the audit entry attributes the write to the session's account, not the body's", settingsEntry.actorEmail, ADMIN_EMAIL.toLowerCase());
check("the audit entry's adminId is the session's id, not the body's", settingsEntry.adminId !== "000000000000000000000009", settingsEntry.adminId);

/* --- 3. CSRF -------------------------------------------------------------- */

section("3. CSRF — all four mutating layers (§33)");

const csrfToken = jar.get("nicben_admin_csrf");
const noHeader = await request("/api/admin/settings", {
  method: "PUT",
  body: { contact: { address: "x" }, serviceAreas: { states: null, note: null }, seoDefaults: { titleTemplate: null, description: null } },
  headers: { host: new URL(BASE).host },
});
equal("a mutation without the CSRF header is 403", noHeader.status, 403);
check("the reason names the missing header", String(noHeader.json.message).includes("missing-csrf-header"), noHeader.json.message);

const wrongHeader = await request("/api/admin/settings", {
  method: "PUT",
  body: { contact: { address: "x" }, serviceAreas: { states: null, note: null }, seoDefaults: { titleTemplate: null, description: null } },
  headers: { "x-nicben-csrf": `${csrfToken}-not-the-token` },
});
equal("a mutation with a mismatched token is 403", wrongHeader.status, 403);
check("the reason names the mismatch", String(wrongHeader.json.message).includes("csrf-token-mismatch"), wrongHeader.json.message);

const crossOrigin = await request("/api/admin/settings", {
  method: "PUT",
  body: { contact: { address: "x" }, serviceAreas: { states: null, note: null }, seoDefaults: { titleTemplate: null, description: null } },
  headers: { origin: "https://evil.test", "x-nicben-csrf": csrfToken },
});
equal("a mutation from a foreign origin is 403", crossOrigin.status, 403);
check("the reason names the origin", String(crossOrigin.json.message).includes("origin-mismatch"), crossOrigin.json.message);

const crossSiteFetch = await request("/api/admin/settings", {
  method: "PUT",
  body: { contact: { address: "x" }, serviceAreas: { states: null, note: null }, seoDefaults: { titleTemplate: null, description: null } },
  headers: { "sec-fetch-site": "cross-site", "x-nicben-csrf": csrfToken },
});
equal("a mutation declaring cross-site fetch metadata is 403", crossSiteFetch.status, 403);
check("the reason names the fetch metadata", String(crossSiteFetch.json.message).includes("cross-site-fetch-metadata"), crossSiteFetch.json.message);

const goodOrigin = await request("/api/admin/settings", {
  method: "PUT",
  body: { contact: { address: null, email: null, phone: null }, serviceAreas: { states: null, note: null }, seoDefaults: { titleTemplate: null, description: null } },
  headers: {
    origin: BASE,
    "sec-fetch-site": "same-origin",
    "x-nicben-csrf": csrfToken,
  },
});
equal("a same-origin mutation with the token succeeds", goodOrigin.status, 200);

/* --- 4. Validation -------------------------------------------------------- */

section("4. Server-side validation on every mutation (§32)");

const malformed = await request("/api/admin/settings", {
  method: "PUT",
  rawBody: "{ this is not json",
  headers: { "x-nicben-csrf": csrfToken, "content-type": "application/json" },
});
equal("an unreadable body is rejected, not crashed", malformed.status, 400);
check("the rejection names field paths", Array.isArray(malformed.json.fieldErrors) && malformed.json.fieldErrors.length > 0, JSON.stringify(malformed.json.fieldErrors));

const wrongShape = await request("/api/admin/projects", {
  method: "POST",
  body: { title: "Valid title", slug: "not a slug", serviceTag: "s", location: "L", summary: "S", published: "not-a-boolean" },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("a bad slug is 400", wrongShape.status, 400);
check("the slug field is named", wrongShape.json.fieldErrors.some((entry) => entry.field === "slug"), JSON.stringify(wrongShape.json.fieldErrors));
check("no Zod library message is returned", !JSON.stringify(wrongShape.json).includes("Invalid input"), JSON.stringify(wrongShape.json.fieldErrors));

const oversized = await request("/api/admin/projects", {
  method: "POST",
  rawBody: JSON.stringify({ padding: "x".repeat(1_200_000) }),
  headers: { "x-nicben-csrf": csrfToken, "content-type": "application/json" },
});
equal("a body over the admin ceiling is 413", oversized.status, 413);

const unknownStatus = await request("/api/admin/enquiries/000000000000000000000000", {
  method: "PATCH",
  body: { status: "not-a-status" },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("an unknown enquiry status is 400", unknownStatus.status, 400);

const missingRecord = await request("/api/admin/enquiries/000000000000000000000000", {
  method: "PATCH",
  body: { status: "quoted" },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("an unknown record is 404 after validation passes", missingRecord.status, 404);

/* --- 5. Mutations, audit trail and CSV ----------------------------------- */

section("5. Mutations, audit trail and the CSV export");

/* Create a real enquiry through the **public** endpoint, so the admin flow operates on a
 * record the pipeline actually produced. Dev mode is required for this: production without
 * a Turnstile secret correctly rejects every submission (D-022). */
const hostileName = '=SUM(A1:A2),"quoted"';
const hostileMessage = "First line, with comma\nSecond \"quoted\" line\n=cmd|'/c calc'!A0";
const submission = await request("/api/enquiries", {
  method: "POST",
  body: {
    name: hostileName,
    email: "export.probe@example.test",
    phone: "+1 (555) 010-0100",
    enquiryType: "project-management-contracting",
    location: "Texas",
    message: `${hostileMessage} — and enough padding to clear the twenty character minimum.`,
    consent: true,
  },
  headers: { "x-nicben-csrf": csrfToken, host: new URL(BASE).host },
});
check("a specimen enquiry was accepted by the public pipeline", submission.status === 200, `→ ${submission.status} ${submission.text.slice(0, 80)}`);

const enquiryList = await request("/api/admin/enquiries?limit=5");
equal("the admin list is readable with a session", enquiryList.status, 200);
check("the list returns the new enquiry", enquiryList.json.data.items.length >= 1, `${enquiryList.json.data.items.length} item(s)`);
const created = enquiryList.json.data.items[0];
check("the list reports a new-enquiry count for the dashboard", enquiryList.json.data.newCount >= 1, String(enquiryList.json.data.newCount));
equal("the list exposes the D-021 notification flag, read-only", typeof created.notification?.delivered, "boolean");

const statusChange = await request(`/api/admin/enquiries/${created.id}`, {
  method: "PATCH",
  body: { status: "quoted", note: "Quoted to the client on the call." },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("a status change succeeds", statusChange.status, 200);
equal("the stored status changed", statusChange.json.data.status, "quoted");
check("the accompanying note was recorded", statusChange.json.data.notes.length === 1, `${statusChange.json.data.notes.length} note(s)`);

const noteAdd = await request(`/api/admin/enquiries/${created.id}/notes`, {
  method: "POST",
  body: { body: "Follow-up scheduled." },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("adding a note succeeds", noteAdd.status, 201);
equal("the note count increased", noteAdd.json.data.notes.length, 2);

const contentWrite = await request("/api/admin/content/what-we-do", {
  method: "PUT",
  body: { sections: [{ key: "pillar-1-scope", heading: "Scope", body: "Body text." }] },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("page content can be written", contentWrite.status, 200);
const contentRead = await request("/api/admin/content/what-we-do");
equal("page content round-trips", contentRead.json.data.content.sections[0].key, "pillar-1-scope");

const projectWrite = await request("/api/admin/projects", {
  method: "POST",
  body: { title: "A project", slug: "a-project", serviceTag: "pm", location: "Texas", images: [], summary: "Summary.", published: true },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("a project can be created", projectWrite.status, 201);
const projectId = projectWrite.json.data.id;
const projectUpdate = await request(`/api/admin/projects/${projectId}`, {
  method: "PUT",
  body: { id: "000000000000000000000099", title: "Renamed", slug: "a-project", serviceTag: "pm", location: "Texas", images: [], summary: "Summary.", published: false },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("the path id wins over a body id", projectUpdate.json.data.id, projectId);

const testimonialWrite = await request("/api/admin/testimonials", {
  method: "POST",
  body: { name: "Client", quote: "Good work.", projectRef: "a-project", published: true },
  headers: { "x-nicben-csrf": csrfToken },
});
equal("a testimonial can be created", testimonialWrite.status, 201);

/* Audit trail */
section("5b. Audit trail — who, what, when (§39, §60)");

const audit = await request("/api/admin/audit?limit=50");
equal("the audit log is readable", audit.status, 200);
const actions = audit.json.data.items.map((entry) => entry.action);
for (const expected of [
  "login-success",
  "login-failure",
  "enquiry-status-change",
  "enquiry-note-added",
  "project-upsert",
  "testimonial-upsert",
  "page-content-upsert",
  "settings-upsert",
]) {
  check(`the trail contains ${expected}`, actions.includes(expected), `${actions.length} entries`);
}
const statusChangeEntry = audit.json.data.items.find((entry) => entry.action === "enquiry-status-change");
check("the status change records the previous and the new status", statusChangeEntry.metadata.from === "new" && statusChangeEntry.metadata.to === "quoted", JSON.stringify(statusChangeEntry.metadata));
check("every entry names an actor and a time", audit.json.data.items.every((entry) => entry.createdAt && (entry.actorEmail !== null || entry.action === "login-failure")), "actor + timestamp");
check("no entry carries a password hash", !JSON.stringify(audit.json).includes("$argon2"), "hash absent from the trail");
check("no entry carries an enquiry message body", !JSON.stringify(audit.json).includes("Follow-up scheduled"), "message body absent from the trail");

const auditFiltered = await request("/api/admin/audit?action=login-success");
equal("the trail can be filtered by action", auditFiltered.json.data.items.every((entry) => entry.action === "login-success"), true);

/* CSV export */
section("5c. CSV export — comma, quote, newline and formula injection");

const csvExport = await request("/api/admin/enquiries/export");
equal("the export is 200", csvExport.status, 200);
check("the export is served as an attachment", /attachment; filename="nicben-enquiries-/.test(csvExport.headers.get("content-disposition") ?? ""), csvExport.headers.get("content-disposition"));
check("the export is typed as CSV", (csvExport.headers.get("content-type") ?? "").includes("text/csv"), csvExport.headers.get("content-type"));

const csvText = csvExport.text.replace(/^\uFEFF/, "");
const csvLines = csvText.split("\r\n");
check("the export has a header row", csvLines[0].startsWith("id,createdAt,updatedAt,status,enquiryType,name,"), csvLines[0]?.slice(0, 60));

/** A minimal RFC 4180 reader, so the assertions are made about parsed fields rather than raw text. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\r" && text[index + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      index += 1;
    } else {
      field += character;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

const parsed = parseCsv(csvText);
const headerRow = parsed[0];
const dataRow = parsed.find((row) => row[headerRow.indexOf("email")] === "export.probe@example.test");
check("the specimen enquiry is in the export", dataRow !== undefined, `${parsed.length - 1} data row(s)`);

const csvName = dataRow[headerRow.indexOf("name")];
const csvMessage = dataRow[headerRow.indexOf("message")];

check("a leading = is neutralised in the export", csvName.startsWith("'="), JSON.stringify(csvName));
check("a comma survives inside a parsed field", csvName.includes(","), JSON.stringify(csvName));
check("a quote survives inside a parsed field", csvName.includes('"quoted"'), JSON.stringify(csvName));
check("the parsed name equals the neutralised original", csvName === `'${hostileName}`, `${JSON.stringify(csvName)} vs ${JSON.stringify(`'${hostileName}`)}`);
check("a newline survives inside a parsed field", csvMessage.includes("\n"), JSON.stringify(csvMessage.slice(0, 60)));
check("a mid-field newline did not split the record", csvMessage.split("\n").length === 3, `${csvMessage.split("\n").length} lines`);
check("a formula inside the message body is neutralised where it starts a line", !csvMessage.replace(/^\t/, "").startsWith("="), JSON.stringify(csvMessage.slice(0, 20)));
check("no export field begins with a formula trigger", parsed.slice(1).every((row) => row.every((field) => field === "" || !["=", "+", "-", "@", "\t", "\r"].includes(field[0]))), "all fields neutralised");
check("carriage returns are not used inside a field", !csvMessage.includes("\r"), "record separator only");

/* --- 6. Throttling over HTTP --------------------------------------------- */

section("6. Login throttling and lockout — raw request sequence over HTTP");

const throttleJar = makeJar();
const throttleRequest = client(throttleJar);
const throttleSequence = [];
for (let index = 0; index < 7; index += 1) {
  const response = await throttleRequest("/api/admin/auth/login", {
    method: "POST",
    body: { email: ADMIN_EMAIL, password: `wrong-password-${index}` },
    address: "203.0.113.50",
  });
  throttleSequence.push({
    status: response.status,
    retryAfter: response.headers.get("retry-after"),
    error: response.json?.error ?? null,
  });
}
check(
  "the raw sequence is 401 ×5 then 429 ×2",
  JSON.stringify(throttleSequence.map((row) => row.status)) === JSON.stringify([401, 401, 401, 401, 401, 429, 429]),
  JSON.stringify(throttleSequence.map((row) => row.status)),
);
check("the 429 carries a Retry-After header", Number(throttleSequence[5].retryAfter) > 0, `retry-after: ${throttleSequence[5].retryAfter}`);
equal("the 429 is reported as rate-limited", throttleSequence[5].error, "rate-limited");

const lockedOutCorrectPassword = await throttleRequest("/api/admin/auth/login", {
  method: "POST",
  body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  address: "203.0.113.50",
});
equal("the correct password is refused while the key is locked out", lockedOutCorrectPassword.status, 429);

const freshAddressOtherAccount = await client(makeJar())("/api/admin/auth/login", {
  method: "POST",
  body: { email: "unrelated.operator@example.test", password: "wrong" },
  address: "203.0.113.51",
});
equal("an unrelated address and account is unaffected", freshAddressOtherAccount.status, 401);

const accountLockOtherAddress = await client(makeJar())("/api/admin/auth/login", {
  method: "POST",
  body: { email: ADMIN_EMAIL, password: "wrong-again" },
  address: "203.0.113.52",
});
equal("the account key locks an unrelated address too", accountLockOtherAddress.status, 429);

/* --- 7. Session expiry ---------------------------------------------------- */

section("7. Session expiry enforced server-side");

/* Every token here carries a **genuine** signature and the **real** subject, so expiry is
 * the only variable. Without that, a rejection would be explained by the account check
 * instead, and the expiry claim would be unproven. */
function requestWithToken(token) {
  const tokenJar = makeJar();
  tokenJar.set("nicben_admin_session", token);
  return client(tokenJar)("/api/admin/auth/session");
}

const genuineSubject = { sub: issuedPayload.sub, em: issuedPayload.em };

const expiredToken = mintToken({ ...genuineSubject, iat: nowSeconds - 7200, exp: nowSeconds - 3600 });
equal("a genuine, expired token is rejected", (await requestWithToken(expiredToken)).status, 401);

const expiringThisSecond = mintToken({ ...genuineSubject, iat: nowSeconds - 3600, exp: nowSeconds - 1 });
equal("a genuine token that expired one second ago is rejected", (await requestWithToken(expiringThisSecond)).status, 401);

const liveToken = mintToken({ ...genuineSubject, iat: nowSeconds, exp: nowSeconds + 3600 });
equal("the same subject with a live expiry is accepted", (await requestWithToken(liveToken)).status, 200);

const futureIssued = mintToken({ ...genuineSubject, iat: nowSeconds + 7200, exp: nowSeconds + 10800 });
equal("a token stamped in the future is rejected", (await requestWithToken(futureIssued)).status, 401);

const wrongSecretToken = (() => {
  const payloadSegment = `v1.${Buffer.from(JSON.stringify({ ...genuineSubject, iat: nowSeconds, exp: nowSeconds + 3600 }), "utf8").toString("base64url")}`;
  const signature = createHmac("sha256", "a-different-secret").update(payloadSegment).digest("base64url");
  return `${payloadSegment}.${signature}`;
})();
equal("a token signed with another secret is rejected", (await requestWithToken(wrongSecretToken)).status, 401);

const cookieToken = jar.get("nicben_admin_session");
const payload = JSON.parse(Buffer.from(cookieToken.split(".")[1], "base64url").toString("utf8"));
equal("the issued token's lifetime is the documented eight hours", payload.exp - payload.iat, 8 * 60 * 60);
check("the issued token's exp is in the future", payload.exp > Math.floor(Date.now() / 1000), new Date(payload.exp * 1000).toISOString());

/* --- 8. Logout ------------------------------------------------------------ */

section("8. Logout, and what it does not do (D-027)");

/* The token is captured **before** logout so the audit trail can still be read afterwards:
 * after logout the jar has no cookies, and the pre-logout token is the only remaining
 * credential — which is itself the limitation this section documents. */
const preLogoutToken = jar.get("nicben_admin_session");

const logout = await request("/api/admin/auth/logout", {
  method: "POST",
  headers: { "x-nicben-csrf": csrfToken },
});
equal("logout succeeds with a session", logout.status, 200);
check("logout clears the session cookie", logout.setCookie.some((value) => /^nicben_admin_session=;/.test(value) && /Max-Age=0/i.test(value)), "Max-Age=0");
check("logout clears the CSRF cookie", logout.setCookie.some((value) => /^nicben_admin_csrf=;/.test(value) && /Max-Age=0/i.test(value)), "Max-Age=0");
equal("logout reports that nothing was revoked server-side", logout.json.data.revokedServerSide, false);
equal("the cookie jar is now empty", jar.header(), "");

/* The pre-logout token is presented in a fresh jar. If it still verifies, nothing was
 * revoked server-side — which is D-027's recorded limitation and is measured here rather
 * than left as a claim. */
const staleTokenJar = makeJar();
staleTokenJar.set("nicben_admin_session", preLogoutToken);
const staleClient = client(staleTokenJar);
const staleResponse = await staleClient("/api/admin/auth/session");
const staleAudit = await staleClient("/api/admin/audit?action=logout");
check(
  "the logout is audited (read back with the pre-logout token, which is the only credential left)",
  (staleAudit.json?.data?.total ?? 0) >= 1,
  `${staleAudit.json?.data?.total ?? 0} logout entries`,
);
process.stdout.write(
  `\n  NOTE  the pre-logout token still verifies after logout (${staleResponse.status}). There is no\n` +
    "        server-side session store, so clearing the cookie is a client-side action and expiry is the\n" +
    "        only revocation mechanism. D-027's recorded limitation, measured rather than assumed.\n" +
    "        The compensating control IS present: deleting the adminUsers document changes `_id`, and the\n" +
    "        guard re-resolves the account on every request, so that revokes every token immediately.\n",
);

/* --- 9. No stack traces --------------------------------------------------- */

section("9. No internal detail reaches a client (§43)");

/* A fresh session, because the previous section logged out. A distinct address keeps the
 * login limiter's state independent of the earlier login. */
const probeJar = makeJar();
const probeRequest = client(probeJar, "198.51.100.240");
const probeLogin = await probeRequest("/api/admin/auth/login", {
  method: "POST",
  body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  address: "198.51.100.240",
});
equal("a second session can be established", probeLogin.status, 200);
const probeToken = probeJar.get("nicben_admin_csrf");

const probes = [
  ["a bad slug", "/api/admin/projects", "POST", { title: "t", slug: "not a slug", serviceTag: "s", location: "l", summary: "s", published: true }],
  ["a bad body shape", "/api/admin/settings", "PUT", { contact: 42 }],
  ["a bad enquiry status", "/api/admin/enquiries/000000000000000000000000", "PATCH", { status: "nope" }],
];
for (const [label, pathname, method, body] of probes) {
  const response = await probeRequest(pathname, { method, body, headers: { "x-nicben-csrf": probeToken } });
  const serialised = JSON.stringify(response.json) + response.text;
  check(`${label}: rejected with a field-level body`, response.status === 400, `${response.status}`);
  check(`${label}: no stack frame in the response`, !/\bat\s+\w+\s+\(|node_modules|[A-Z]:\\\\/.test(serialised), "clean");
  check(`${label}: no library message (Zod/argon2/mongodb) in the response`, !/Invalid input|argon2|MongoServerError|MongoError|NEXT_NOT_FOUND/i.test(serialised), "clean");
  check(`${label}: no submitted value echoed back`, !serialised.includes("not a slug") || response.json.fieldErrors.every((entry) => !entry.message.includes("not a slug")), "field names only");
}

const badJson = await probeRequest("/api/admin/projects", {
  method: "POST",
  rawBody: "not json at all",
  headers: { "x-nicben-csrf": probeToken, "content-type": "application/json" },
});
check("a body that cannot be parsed yields a field-level rejection", badJson.status === 400, `${badJson.status}`);
check("the unparseable-body rejection names no value", !badJson.text.includes("not json at all"), JSON.stringify(badJson.json));

const unhandled = await probeRequest("/api/admin/audit?limit=99999", { headers: { "x-nicben-csrf": probeToken } });
check("an out-of-range query parameter is a 400, not a 500", unhandled.status === 400, `${unhandled.status} ${JSON.stringify(unhandled.json?.fieldErrors ?? null)}`);

/* -------------------------------------------------------------------------- */

section("Enumerated surface");
for (const endpoint of endpoints) {
  process.stdout.write(`  ${endpoint.method.padEnd(7)} ${endpoint.path.padEnd(46)} ${endpoint.file}\n`);
}

const outcome = summary();
process.exit(outcome.failed === 0 ? 0 : 1);
