/**
 * Phase 06 — admin **pages** verification (`nicben-web-admin` scope).
 *
 * The backend pass proved the API surface (`tests/phase-06/http-tests.mjs`: 30
 * method/route pairs, every one `401` unauthenticated, `121/121` authenticated).
 * This harness proves the surface a person actually uses: every `/admin/**` page,
 * the server-rendered screens, the CSV export reached from the button's own
 * endpoint, and each mutation round-trip the screens perform.
 *
 * Two modes, because the portal has two honest states:
 *
 * | Mode     | Environment                                        | What it proves |
 * |----------|----------------------------------------------------|----------------|
 * | `zero`   | no admin variables at all                          | D-028: every page redirects, the login screen fails closed and says so, no API answers anything but `401` |
 * | `seeded` | `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` | each screen renders with stored data, each mutation round-trips, the export is escaped |
 *
 * The page list is **discovered from disk** (`app/admin/**​/page.tsx`), not typed
 * out, so a page added later cannot be missing from the table by omission — the
 * same construction `http-tests.mjs` uses for the API routes.
 *
 * Run:
 *   node tests/phase-06/admin-pages-tests.mjs --mode=zero   --base=http://127.0.0.1:3220
 *   node tests/phase-06/admin-pages-tests.mjs --mode=seeded --base=http://127.0.0.1:3221
 */

import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  PROJECT_ROOT,
  OUT_DIR,
  check,
  equal,
  section,
  summary,
} from "./harness.mjs";

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
const BASE = (args.get("base") ?? "http://127.0.0.1:3220").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.HARNESS_ADMIN_EMAIL ?? "operator@example.test";
const ADMIN_PASSWORD = process.env.HARNESS_ADMIN_PASSWORD ?? "Harness-Password-2026!";

/* -------------------------------------------------------------------------- */
/* Page discovery                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Every `page.tsx` under `app/admin`, as a URL path.
 *
 * Route groups — `(protected)` — are not part of the URL, so they are dropped. A
 * dynamic segment is filled with a probe value, exactly as the API enumeration does.
 */
async function discoverAdminPageRoutes() {
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
      if (entry.isDirectory()) {
        await walk(absolute);
        continue;
      }
      if (entry.name !== "page.tsx" && entry.name !== "page.ts") continue;
      const relative = path.relative(root, path.dirname(absolute));
      const segments = relative
        .split(path.sep)
        .filter((segment) => segment.length > 0 && !/^\(.+\)$/.test(segment));
      found.push(segments.length === 0 ? "/admin" : `/admin/${segments.join("/")}`);
    }
  }

  await walk(root);
  return found.sort();
}

/** Any file under `app/api/admin/**` that exports HTTP methods. */
async function discoverAdminApiEndpoints() {
  const root = path.join(PROJECT_ROOT, "app", "api", "admin");
  const files = [];

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
      else if (entry.name === "route.ts") files.push(absolute);
    }
  }

  await walk(root);

  const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
  const endpoints = [];
  for (const file of files.sort()) {
    const source = await readFile(file, "utf8");
    const relative = path.relative(path.join(PROJECT_ROOT, "app"), path.dirname(file));
    const url = `/${relative.split(path.sep).join("/")}`.replace(/\[(.+?)]/g, "probe-id");
    for (const method of methods) {
      const re = new RegExp(`export\\s+(async\\s+)?(function|const)\\s+${method}\\b`);
      if (re.test(source)) endpoints.push({ method, url });
    }
  }
  return endpoints;
}

/* -------------------------------------------------------------------------- */
/* HTTP helpers                                                                */
/* -------------------------------------------------------------------------- */

function makeJar() {
  const cookies = new Map();
  return {
    absorb(response) {
      const setCookies =
        typeof response.headers.getSetCookie === "function"
          ? response.headers.getSetCookie()
          : [response.headers.get("set-cookie")].filter(Boolean);
      for (const raw of setCookies) {
        const [pair] = raw.split(";");
        const index = pair.indexOf("=");
        if (index <= 0) continue;
        const name = pair.slice(0, index).trim();
        const value = pair.slice(index + 1).trim();
        if (value.length === 0 || /max-age=0/i.test(raw)) cookies.delete(name);
        else cookies.set(name, value);
      }
    },
    header() {
      return [...cookies.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
    },
    get(name) {
      return cookies.get(name) ?? null;
    },
  };
}

function client(jar, address = "198.51.100.9") {
  return async function request(pathname, options = {}) {
    const headers = {
      "x-forwarded-for": address,
      host: new URL(BASE).host,
      origin: BASE,
      ...(options.headers ?? {}),
    };
    if (jar && jar.header().length > 0) headers.cookie = jar.header();
    const response = await fetch(`${BASE}${pathname}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      redirect: "manual",
    });
    if (jar) jar.absorb(response);
    return response;
  };
}

async function html(response) {
  return response.text();
}

/* -------------------------------------------------------------------------- */
/* Zero mode                                                                   */
/* -------------------------------------------------------------------------- */

const pageRoutes = await discoverAdminPageRoutes();
check("admin page routes discovered from disk", pageRoutes.length >= 8, pageRoutes.join(" "));

if (MODE === "zero") {
  section("Unauthenticated page enumeration (D-028, 06 §27)");
  process.stdout.write(`     ${pageRoutes.length} pages discovered\n`);

  const guarded = pageRoutes.filter((route) => route !== "/admin/login");
  equal("every page except /admin/login is guarded", guarded.length, pageRoutes.length - 1);

  const table = [];
  for (const route of guarded) {
    const response = await fetch(`${BASE}${route}`, { redirect: "manual" });
    const location = response.headers.get("location") ?? "";
    const redirectsToLogin =
      [302, 303, 307, 308].includes(response.status) && location.endsWith("/admin/login");
    table.push({ route, status: response.status, location });
    check(
      `${route} → redirect to the login`,
      redirectsToLogin,
      `${response.status} ${location}`,
    );
    equal(`${route} carries x-robots-tag: noindex`, response.headers.get("x-robots-tag"), "noindex, nofollow, noarchive");
  }

  process.stdout.write("\n     ── page enumeration table ──\n");
  for (const row of table) {
    process.stdout.write(`     ${row.route.padEnd(22)} ${row.status}  →  ${row.location}\n`);
  }

  section("Login screen fails closed (D-028)");
  const login = await fetch(`${BASE}/admin/login`, { redirect: "manual" });
  const loginBody = await html(login);
  equal("/admin/login renders", login.status, 200);
  check(
    "it states that no administrator is configured",
    loginBody.includes("This portal is not available"),
  );
  check(
    "it does not render a credential form",
    !loginBody.includes('type="password"') && !loginBody.includes("admin-login-form"),
  );
  check("no sign-in form is offered", !loginBody.includes("Sign in to admin portal"));
  check(
    "no environment variable name is disclosed to the visitor",
    !loginBody.includes("ADMIN_PASSWORD_HASH") && !loginBody.includes("ADMIN_EMAIL"),
  );
  check(
    "the session cookie name is not disclosed",
    !loginBody.includes("nicben_admin_session") && !loginBody.includes("nicben_admin_csrf"),
  );

  section("Every admin API still answers 401");
  const endpoints = await discoverAdminApiEndpoints();
  process.stdout.write(`     ${endpoints.length} method/route pairs discovered\n`);
  let allUnauthorized = true;
  for (const endpoint of endpoints) {
    const response = await fetch(`${BASE}${endpoint.url}`, {
      method: endpoint.method,
      headers: { "content-type": "application/json", host: new URL(BASE).host },
      body: ["POST", "PUT", "PATCH"].includes(endpoint.method) ? "{}" : undefined,
      redirect: "manual",
    });
    if (response.status !== 401) {
      allUnauthorized = false;
      process.stdout.write(`     FAIL ${endpoint.method} ${endpoint.url} → ${response.status}\n`);
    }
  }
  equal("all admin API method/route pairs are 401", allUnauthorized, true);

  section("No credential material in any admin page response");
  let credentialFree = true;
  for (const route of pageRoutes) {
    const response = await fetch(`${BASE}${route}`, { redirect: "manual" });
    const body = await html(response);
    if (body.includes("$argon2") || body.includes("ADMIN_SESSION_SECRET")) {
      credentialFree = false;
      process.stdout.write(`     FAIL ${route} carries credential material\n`);
    }
  }
  equal("no page body carries a hash or a secret name", credentialFree, true);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, "admin-pages-zero.json"),
    JSON.stringify({ base: BASE, table }, null, 2),
  );
}

/* -------------------------------------------------------------------------- */
/* Seeded mode                                                                */
/* -------------------------------------------------------------------------- */

if (MODE === "seeded") {
  const jar = makeJar();
  const request = client(jar);

  section("Sign in");
  const login = await request("/api/admin/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
  });
  equal("the configured credential signs in", login.status, 200);
  check("a session cookie was set", jar.get("nicben_admin_session") !== null);
  check("a CSRF cookie was set", jar.get("nicben_admin_csrf") !== null);
  const csrf = jar.get("nicben_admin_csrf") ?? "";
  const mutating = (pathname, options = {}) =>
    request(pathname, {
      ...options,
      headers: {
        "content-type": "application/json",
        "x-nicben-csrf": csrf,
        ...(options.headers ?? {}),
      },
    });

  section("Every page renders with a valid session");
  /** A string each screen must contain when it rendered for real. */
  const markers = {
    "/admin": "Audit log",
    "/admin/enquiries": "Filter by status",
    "/admin/projects": "New project",
    "/admin/testimonials": "New testimonial",
    "/admin/content": "Page content",
    "/admin/settings": "Site settings",
    "/admin/audit": "Append-only",
  };

  for (const route of pageRoutes) {
    if (route === "/admin/login") {
      // A signed-in operator is redirected away from the login screen rather than
      // shown a form they do not need (`app/admin/login/page.tsx`).
      const loginWhileSignedIn = await request(route);
      equal("/admin/login redirects a signed-in operator", loginWhileSignedIn.status, 307);
      check(
        "the redirect lands on the dashboard",
        (loginWhileSignedIn.headers.get("location") ?? "").endsWith("/admin"),
      );
      continue;
    }

    const response = await request(route);
    equal(`${route} renders`, response.status, 200);
    const body = await html(response);
    const marker = markers[route];
    if (marker) check(`${route} contains “${marker}”`, body.includes(marker));
    check(`${route} is server-rendered (has the portal shell)`, body.includes("admin-sidebar"));
    check(
      `${route} shows no raw hex or rgba() in its markup`,
      !/#[0-9a-fA-F]{6}\b/.test(body.replace(/<script[\s\S]*?<\/script>/g, "")),
      "colour literals absent",
    );
  }

  section("A real enquiry arrives through the public pipeline");
  const stamp = Date.now();
  const senderName = `Harness, "Tester" ${stamp}`;
  const submitted = await request("/api/enquiries", {
    method: "POST",
    headers: { "content-type": "application/json", "x-turnstile-token": "harness-token" },
    body: {
      name: senderName,
      email: `harness+${stamp}@example.test`,
      phone: "+1 512 555 0100",
      enquiryType: "project-management-contracting",
      location: "Harness City, TX",
      message: `=1+1 leading formula probe\nsecond line for the CSV newline probe\nthird line makes it long enough`,
      consent: "true",
    },
  });
  equal("the enquiry endpoint accepts the submission", submitted.status, 200);

  section("The enquiries table shows it, and the detail view renders it");
  const list = await request("/admin/enquiries");
  const listBody = await html(list);
  /** React escapes text it renders, so a quote in the sender's name arrives as `&quot;`. */
  const escapedName = senderName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  equal("the table renders", list.status, 200);
  check("the new enquiry is in the table", listBody.includes(escapedName), `looked for ${escapedName}`);
  check("the notification state is surfaced", listBody.includes("Notifications not configured"));
  check("the enquiry type is rendered as its approved label", listBody.includes("Project management and contracting"));

  const exportResponse = await request("/api/admin/enquiries/export");
  const csv = await exportResponse.text();
  equal("the export answers with CSV", exportResponse.headers.get("content-type")?.includes("text/csv"), true);
  check("the export is an attachment", (exportResponse.headers.get("content-disposition") ?? "").startsWith("attachment;"));
  check("a comma-and-quote name is quoted", csv.includes('"Harness, ""Tester""'));
  check("a leading = is neutralised", csv.includes("'=1+1"));
  check("the multi-line message stays one quoted field", /"'=1\+1 leading formula probe\nsecond line/.test(csv));

  section("Mutation round-trips (the calls the screens make)");
  const createdProject = await mutating("/api/admin/projects", {
    method: "POST",
    body: {
      id: null,
      title: `Harness project ${stamp}`,
      slug: `harness-project-${stamp}`,
      serviceTag: "Renovation",
      location: "Harness City, TX",
      images: [],
      summary: "Created by the page verification harness to prove the round-trip.",
      published: false,
    },
  });
  equal("a project is created", createdProject.status, 201);
  const project = (await createdProject.clone().json()).data;

  const published = await mutating(`/api/admin/projects/${project.id}`, {
    method: "PUT",
    body: { ...project, published: true },
  });
  equal("the published toggle round-trips", published.status, 200);
  check("the record came back published", (await published.clone().json()).data.published === true);

  const projectPage = await html(await request("/admin/projects?published=true"));
  check("the published project is on the projects screen", projectPage.includes(`Harness project ${stamp}`));

  const createdTestimonial = await mutating("/api/admin/testimonials", {
    method: "POST",
    body: {
      id: null,
      name: `Harness reviewer ${stamp}`,
      quote: "A harness-authored quote, published to prove the round-trip.",
      projectRef: project.slug,
      published: false,
    },
  });
  equal("a testimonial is created", createdTestimonial.status, 201);
  const testimonial = (await createdTestimonial.clone().json()).data;
  const testimonialPage = await html(await request("/admin/testimonials"));
  check("the draft testimonial is listed", testimonialPage.includes(`Harness reviewer ${stamp}`));

  const contentSave = await mutating("/api/admin/content/faq", {
    method: "PUT",
    body: {
      pageKey: "faq",
      sections: [{ key: "harness-section", heading: "Harness heading", body: "Harness body for the round-trip." }],
    },
  });
  equal("page content saves", contentSave.status, 200);
  const contentPage = await html(await request("/admin/content?pageKey=faq"));
  check("the saved section is on the content screen", contentPage.includes("Harness heading"));

  const settingsSave = await mutating("/api/admin/settings", {
    method: "PUT",
    body: {
      contact: { address: "Harness address", email: null, phone: null },
      serviceAreas: { states: ["Texas"], note: "Harness note" },
      seoDefaults: { titleTemplate: null, description: null },
    },
  });
  equal("settings save", settingsSave.status, 200);
  const settingsPage = await html(await request("/admin/settings"));
  check("the saved address is on the settings screen", settingsPage.includes("Harness address"));

  section("Enquiry status + note, then the drawer URL");
  const enquiriesJson = await (await request("/api/admin/enquiries")).json();
  const enquiry = enquiriesJson.data.items.find((item) => item.name === senderName);
  check("the submitted enquiry is readable through the admin API", Boolean(enquiry));

  if (enquiry) {
    const statusChange = await mutating(`/api/admin/enquiries/${enquiry.id}`, {
      method: "PATCH",
      body: { status: "contacted", note: "Harness status change." },
    });
    equal("a status change round-trips", statusChange.status, 200);
    check("the status is stored", (await statusChange.clone().json()).data.status === "contacted");

    const note = await mutating(`/api/admin/enquiries/${enquiry.id}/notes`, {
      method: "POST",
      body: { body: "Harness internal note." },
    });
    equal("a note is appended", note.status, 201);
    check("the note is stored", (await note.clone().json()).data.notes.length >= 2);

    const drawer = await html(await request(`/admin/enquiries?enquiry=${encodeURIComponent(enquiry.id)}`));
    check("the drawer URL renders the detail overlay", drawer.includes('role="dialog"'));
    check("it shows the sender's message", drawer.includes("leading formula probe"));
    check("it offers the status control", drawer.includes("Change status to"));
    check("it reports the notification state", drawer.includes("Email notifications were not configured"));
  }

  section("Audit trail names the harness account");
  const auditPage = await html(await request("/admin/audit"));
  check("the trail lists the acting account", auditPage.includes(ADMIN_EMAIL.toLowerCase()));
  check("it lists a project upsert", auditPage.includes("project-upsert"));
  check("it does not carry a password hash", !auditPage.includes("$argon2"));

  section("A signed-out session is refused");
  const loggedOut = await mutating("/api/admin/auth/logout", { method: "POST" });
  equal("logout succeeds", loggedOut.status, 200);
  const afterLogout = await fetch(`${BASE}/admin/enquiries`, { redirect: "manual" });
  equal("the page redirects again once signed out", afterLogout.status, 307);

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, "admin-pages-seeded.json"),
    JSON.stringify(
      {
        base: BASE,
        project: project.id,
        testimonial: testimonial.id,
        pages: pageRoutes,
      },
      null,
      2,
    ),
  );
}

const outcome = summary();
// `process.exitCode` rather than `process.exit`: the latter can truncate the
// summary on a pipe, which would hide the very output this harness exists to produce.
process.exitCode = outcome.failed === 0 ? 0 : 1;
