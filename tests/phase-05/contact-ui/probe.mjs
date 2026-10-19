/**
 * `/contact` UI probe — Phase 05 web pass verification harness.
 *
 * Lives under `tests/` and writes its evidence under `tests/phase-05/out/`
 * because `decisions.md` D-011 forbids temporary tooling inside `web/public/`.
 *
 * There is no browser-automation dependency in this repo and the brief locks the
 * dependency set, so this drives the **Chrome** already installed on the machine
 * over the DevTools Protocol: Node 22 ships a global `WebSocket` and a global
 * `fetch`, which is all CDP needs. Nothing is installed and nothing is bundled.
 *
 * Usage:
 *   node tests/phase-05/contact-ui/probe.mjs --base http://localhost:3000 --scenario static
 *   node tests/phase-05/contact-ui/probe.mjs --base http://localhost:3001 --scenario interactive
 *
 * `static`   — measurements at 360/768/1024/1440 px, screenshots, heading
 *              structure, `aria-describedby` integrity, `?enquiry=` preselection,
 *              client-side validation (no request), and a keyboard-only Tab walk.
 * `interactive` — keyboard-only fill and submit: a server-side consent failure
 *              (proving the error renders and is associated with its input), then
 *              a successful submission (proving the success card replaces the
 *              form and that nothing injects a `mailto:`/`tel:`).
 */

import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, "..", "out", "contact-ui");
const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
}

const BASE = arg("base", "http://localhost:3000").replace(/\/+$/, "");
const SCENARIO = arg("scenario", "static");
const PORT = Number(arg("port", SCENARIO === "static" ? 9333 : 9334));

const checks = [];
function check(name, actual, expected) {
  const pass = typeof expected === "function" ? expected(actual) : actual === expected;
  checks.push({ name, pass, actual });
  return pass;
}

/**
 * Heading outline test: the page opens at `h1`, has exactly one `h1`, and never
 * skips a level on the way down (`h1 → h2 → h3` is valid; `h1 → h3` is not).
 */
function headingOutlineOk(headings) {
  const levels = headings.map((entry) => Number(entry.slice(1, 2)));
  if (levels.length === 0 || levels[0] !== 1) return false;
  if (levels.filter((level) => level === 1).length !== 1) return false;
  let deepest = 1;
  for (const level of levels.slice(1)) {
    if (level > deepest + 1) return false;
    deepest = Math.max(deepest, level);
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/* Minimal CDP client                                                          */
/* -------------------------------------------------------------------------- */

class Cdp {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.handlers = new Set();
  }

  async open() {
    await new Promise((resolvePromise, reject) => {
      this.ws.addEventListener("open", resolvePromise, { once: true });
      this.ws.addEventListener("error", reject, { once: true });
    });
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== undefined && this.pending.has(message.id)) {
        const { resolve: done, reject: fail } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) fail(new Error(`${message.error.message} (${message.method ?? ""})`));
        else done(message.result);
        return;
      }
      for (const handler of this.handlers) handler(message);
    });
  }

  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolvePromise, reject) => {
      this.pending.set(id, { resolve: resolvePromise, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  once(method, timeoutMs = 20000) {
    return new Promise((resolvePromise, reject) => {
      const timer = setTimeout(() => {
        this.handlers.delete(handler);
        reject(new Error(`timed out waiting for ${method}`));
      }, timeoutMs);
      const handler = (message) => {
        if (message.method !== method) return;
        clearTimeout(timer);
        this.handlers.delete(handler);
        resolvePromise(message.params);
      };
      this.handlers.add(handler);
    });
  }

  async evaluate(script) {
    const result = await this.send("Runtime.evaluate", {
      expression: script,
      returnByValue: true,
      awaitPromise: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? "evaluate failed");
    }
    return result.result.value;
  }

  /** Press a key with the down/up pair a real keyboard produces. */
  async key(key, code, virtualKeyCode, text) {
    const base = {
      key,
      code,
      windowsVirtualKeyCode: virtualKeyCode,
      nativeVirtualKeyCode: virtualKeyCode,
    };
    await this.send("Input.dispatchKeyEvent", {
      ...base,
      type: "keyDown",
      ...(text === undefined ? {} : { text, unmodifiedText: text }),
    });
    await this.send("Input.dispatchKeyEvent", { ...base, type: "keyUp" });
  }

  tab() {
    return this.key("Tab", "Tab", 9);
  }

  enter() {
    return this.key("Enter", "Enter", 13, "\r");
  }

  space() {
    return this.key(" ", "Space", 32, " ");
  }

  arrowDown() {
    return this.key("ArrowDown", "ArrowDown", 40);
  }

  async insertText(text) {
    await this.send("Input.insertText", { text });
  }

  async navigate(url) {
    const loaded = this.once("Page.loadEventFired", 120000);
    await this.send("Page.navigate", { url });
    await loaded;
    // React hydration + the Tailwind stylesheet settle before measuring.
    await new Promise((r) => setTimeout(r, 900));
  }

  async setViewport(width, height, mobile) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
  }

  /**
   * Poll a boolean expression until it is true. A dev server compiles the API
   * route on first use, so a fixed sleep would either be flaky or waste minutes.
   */
  async waitFor(expression, { timeoutMs = 45000, intervalMs = 250 } = {}) {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if (await this.evaluate(`Boolean(${expression})`)) return true;
      if (Date.now() > deadline) return false;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }

  async screenshot(name) {
    const shot = await this.send("Page.captureScreenshot", { format: "png" });
    const path = join(OUT_DIR, `${name}.png`);
    writeFileSync(path, Buffer.from(shot.data, "base64"));
    return path;
  }

  async screenshotFullPage(name) {
    const shot = await this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    const path = join(OUT_DIR, `${name}.png`);
    writeFileSync(path, Buffer.from(shot.data, "base64"));
    return path;
  }
}

/* -------------------------------------------------------------------------- */
/* Page-side measurement expressions                                           */
/* -------------------------------------------------------------------------- */

const MEASURE = `(() => {
  const de = document.documentElement;
  const header = document.querySelector("body > header");
  const mainContent = document.getElementById("main-content");
  const main = mainContent ? mainContent.firstElementChild : null;
  const breadcrumb = document.querySelector('nav[aria-label="Breadcrumb"]');
  const h1 = document.querySelector("h1");
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map(
    (h) => h.tagName + " | " + (h.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 48),
  );
  const offending = [];
  if (de.scrollWidth > de.clientWidth) {
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > de.clientWidth + 1 || r.left < -1)) {
        offending.push(
          el.tagName.toLowerCase() +
            (el.id ? "#" + el.id : "") +
            " right=" + Math.round(r.right) +
            " left=" + Math.round(r.left),
        );
        if (offending.length >= 6) break;
      }
    }
  }
  const control = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { height: Math.round(r.height), width: Math.round(r.width) };
  };
  const described = Array.from(document.querySelectorAll("[aria-describedby]")).map((el) => {
    const target = el.getAttribute("aria-describedby");
    return {
      element: el.tagName.toLowerCase() + (el.id ? "#" + el.id : ""),
      target,
      resolves: target.split(/\\s+/).every((id) => document.getElementById(id) !== null),
    };
  });
  return JSON.stringify({
    viewport: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
    document: { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, scrollHeight: de.scrollHeight },
    overflowPx: de.scrollWidth - de.clientWidth,
    offending,
    h1Count: document.querySelectorAll("h1").length,
    headings,
    headerBottom: header ? Math.round(header.getBoundingClientRect().bottom) : null,
    mainContentTop: mainContent ? Math.round(mainContent.getBoundingClientRect().top) : null,
    mainTop: main ? Math.round(main.getBoundingClientRect().top) : null,
    breadcrumbTop: breadcrumb ? Math.round(breadcrumb.getBoundingClientRect().top) : null,
    h1FontSize: h1 ? window.getComputedStyle(h1).fontSize : null,
    controls: {
      name: control("#contact-name"),
      email: control("#contact-email"),
      message: control("#contact-message"),
      consent: control("#contact-consent"),
      submit: control('button[type="submit"]'),
    },
    describedBy: described,
    describedByAllResolve: described.every((entry) => entry.resolves),
    fieldErrorCount: document.querySelectorAll('[id$="-error"]').length,
    mailtoCount: document.querySelectorAll('a[href^="mailto:"]').length,
    telCount: document.querySelectorAll('a[href^="tel:"]').length,
    formPresent: document.getElementById("contact-form") !== null,
    successPresent: /Thank you\\. We have received your enquiry/.test(document.body.innerText),
  });
})()`;

const ACTIVE_ELEMENT = `(() => {
  const el = document.activeElement;
  if (!el) return JSON.stringify({ none: true });
  return JSON.stringify({
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    name: el.getAttribute("name"),
    type: el.getAttribute("type"),
    describedby: el.getAttribute("aria-describedby"),
    invalid: el.getAttribute("aria-invalid"),
    checked: typeof el.checked === "boolean" ? el.checked : null,
    text: (el.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 48),
  });
})()`;

const ERRORS_ON_PAGE = `(() => {
  const nodes = Array.from(document.querySelectorAll('[id$="-error"]'));
  return JSON.stringify(
    nodes.map((node) => {
      const control = document.querySelector('[aria-describedby~="' + node.id + '"]');
      return {
        id: node.id,
        text: node.textContent.trim(),
        associatedControl: control
          ? control.tagName.toLowerCase() + (control.id ? "#" + control.id : "")
          : null,
        controlAriaInvalid: control ? control.getAttribute("aria-invalid") : null,
      };
    }),
  );
})()`;

/* -------------------------------------------------------------------------- */
/* Keyboard helpers                                                            */
/* -------------------------------------------------------------------------- */

async function activeDescriptor(cdp) {
  return JSON.parse(await cdp.evaluate(ACTIVE_ELEMENT));
}

/**
 * Tab until the focused element satisfies `predicate`, recording every stop so
 * the walkthrough is auditable rather than asserted.
 */
async function tabUntil(cdp, predicate, recorded, max = 90) {
  for (let i = 0; i < max; i += 1) {
    await cdp.tab();
    const active = await activeDescriptor(cdp);
    recorded.push(active);
    if (predicate(active)) return active;
  }
  throw new Error("tabUntil exhausted without reaching the target");
}

/* -------------------------------------------------------------------------- */
/* Scenarios                                                                   */
/* -------------------------------------------------------------------------- */

async function runStatic(cdp) {
  const report = { scenario: "static", base: BASE, widths: [], preselection: [], shots: [] };
  const WIDTHS = [360, 768, 1024, 1440];

  for (const width of WIDTHS) {
    await cdp.setViewport(width, 900, width < 768);
    await cdp.navigate(`${BASE}/contact`);
    const measurement = JSON.parse(await cdp.evaluate(MEASURE));
    report.widths.push({ width, ...measurement });

    check(`[${width}px] no horizontal overflow`, measurement.overflowPx, 0);
    check(`[${width}px] exactly one h1`, measurement.h1Count, 1);
    check(
      `[${width}px] first content starts below the header bottom`,
      measurement.mainTop - measurement.headerBottom > 0,
      true,
    );
    check(
      `[${width}px] heading outline opens at h1 and skips no level`,
      headingOutlineOk(measurement.headings),
      true,
    );
    check(
      `[${width}px] every aria-describedby target exists`,
      measurement.describedByAllResolve,
      true,
    );
    check(`[${width}px] no mailto: link`, measurement.mailtoCount, 0);
    check(`[${width}px] no tel: link`, measurement.telCount, 0);

    report.shots.push(await cdp.screenshot(`contact-${width}`));
  }

  // Full-page captures for the design/structure record.
  await cdp.setViewport(1440, 900, false);
  await cdp.navigate(`${BASE}/contact`);
  report.shots.push(await cdp.screenshotFullPage("contact-1440-full"));
  await cdp.setViewport(360, 900, true);
  await cdp.navigate(`${BASE}/contact`);
  report.shots.push(await cdp.screenshotFullPage("contact-360-full"));

  // `?enquiry=` preselection, both alias spellings the pillar pages emit.
  await cdp.setViewport(1024, 900, false);
  for (const query of [
    "",
    "?enquiry=project-management-contracting",
    "?enquiry=property-improvement-and-maintenance",
    "?enquiry=general-or-business-enquiry",
    "?enquiry=general-business",
    "?enquiry=not-a-real-type",
  ]) {
    await cdp.navigate(`${BASE}/contact${query}`);
    const checked = await cdp.evaluate(
      `JSON.stringify(Array.from(document.querySelectorAll('input[name="enquiryType"]')).map((el) => ({ value: el.value, checked: el.checked })).filter((el) => el.checked))`,
    );
    report.preselection.push({ query: query || "(none)", checked: JSON.parse(checked) });
  }

  const preselectionByQuery = Object.fromEntries(
    report.preselection.map((entry) => [
      entry.query,
      entry.checked.length === 1 ? entry.checked[0].value : null,
    ]),
  );
  check("no query → nothing preselected", preselectionByQuery["(none)"], null);
  check(
    "?enquiry=project-management-contracting → P1",
    preselectionByQuery["?enquiry=project-management-contracting"],
    "project-management-contracting",
  );
  check(
    "?enquiry=property-improvement-and-maintenance (label spelling) → P2",
    preselectionByQuery["?enquiry=property-improvement-and-maintenance"],
    "property-improvement-maintenance",
  );
  check(
    "?enquiry=general-or-business-enquiry → general-business",
    preselectionByQuery["?enquiry=general-or-business-enquiry"],
    "general-business",
  );
  check(
    "?enquiry=general-business → general-business",
    preselectionByQuery["?enquiry=general-business"],
    "general-business",
  );
  check("unknown ?enquiry= → nothing preselected", preselectionByQuery["?enquiry=not-a-real-type"], null);

  /* Keyboard-only Tab walk from the very top of the document. */
  await cdp.setViewport(1024, 900, false);
  await cdp.navigate(`${BASE}/contact?enquiry=project-management-contracting`);
  const walk = [];
  const firstStop = await activeDescriptor(cdp);
  walk.push(firstStop);
  await tabUntil(cdp, (a) => a.id === "contact-name", walk);
  await cdp.insertText("Ada Lovelace");
  await cdp.tab();
  walk.push(await activeDescriptor(cdp));
  await cdp.insertText("ada@example.com");
  await cdp.tab();
  walk.push(await activeDescriptor(cdp));
  await cdp.tab();
  walk.push(await activeDescriptor(cdp));
  await cdp.tab();
  walk.push(await activeDescriptor(cdp));
  await cdp.insertText("Requesting a scope review for a small commercial unit.");
  await cdp.tab();
  walk.push(await activeDescriptor(cdp));
  await tabUntil(cdp, (a) => a.type === "submit", walk);
  report.keyboardWalk = walk;
  check(
    "keyboard walk reaches the name field",
    walk.some((stop) => stop.id === "contact-name"),
    true,
  );
  check(
    "keyboard walk reaches the email field",
    walk.some((stop) => stop.id === "contact-email"),
    true,
  );
  check(
    "keyboard walk reaches the message field",
    walk.some((stop) => stop.id === "contact-message"),
    true,
  );
  check(
    "keyboard walk reaches the consent checkbox",
    walk.some((stop) => stop.id === "contact-consent"),
    true,
  );
  check(
    "keyboard walk reaches the submit button",
    walk.some((stop) => stop.type === "submit"),
    true,
  );

  /* Client-side validation, reached and fired with the keyboard only. */
  await cdp.navigate(`${BASE}/contact`);
  await tabUntil(cdp, (a) => a.type === "submit", []);
  await cdp.enter();
  await cdp.waitFor(`document.querySelectorAll('[id$="-error"]').length > 0`);
  const clientErrors = JSON.parse(await cdp.evaluate(ERRORS_ON_PAGE));
  const afterSubmit = JSON.parse(await cdp.evaluate(MEASURE));
  report.clientValidation = { errors: clientErrors, focused: await activeDescriptor(cdp) };
  check("client validation renders four field errors", clientErrors.length, 4);
  check(
    "client validation uses only approved messages",
    clientErrors.every((error) =>
      [
        "Please enter your name.",
        "Please enter a valid email address.",
        "Please choose what your enquiry is about.",
        "Please tell us a little more (at least 20 characters).",
        "That file is too large or not a supported type.",
        "Something went wrong. Please try again or email us directly.",
      ].includes(error.text),
    ),
    true,
  );
  check(
    "every rendered error is associated with a control",
    clientErrors.every((error) => error.associatedControl !== null),
    true,
  );
  check(
    "the associated control carries aria-invalid",
    clientErrors.every((error) => error.controlAriaInvalid === "true"),
    true,
  );
  check("focus moved to the first invalid control", report.clientValidation.focused.id, "contact-name");
  check("client validation did not submit the form", afterSubmit.formPresent, true);
  report.shots.push(await cdp.screenshot("contact-1024-client-errors"));

  return report;
}

async function runInteractive(cdp) {
  const report = { scenario: "interactive", base: BASE, shots: [] };
  await cdp.setViewport(1024, 900, false);
  await cdp.navigate(`${BASE}/contact?enquiry=general-or-business-enquiry`);

  const walk = [];
  const active = await activeDescriptor(cdp);
  walk.push(active);

  // Every interaction below is a real key event; no synthetic value assignment.
  await tabUntil(cdp, (a) => a.name === "enquiryType", walk);
  const preselected = await cdp.evaluate(
    `JSON.stringify(Array.from(document.querySelectorAll('input[name="enquiryType"]')).filter((el) => el.checked).map((el) => el.value))`,
  );
  report.preselectedOnLoad = JSON.parse(preselected);

  await tabUntil(cdp, (a) => a.id === "contact-name", walk);
  await cdp.insertText("Ada Lovelace");
  await cdp.tab();
  await cdp.insertText("ada@example.com");
  await cdp.tab();
  await cdp.insertText("+1 555 0100");
  await cdp.tab();
  await cdp.insertText("Raymondville, TX");
  await cdp.tab();
  await cdp.insertText(
    "Requesting a scope review for a small commercial unit in Raymondville.",
  );
  await cdp.tab();
  walk.push(await activeDescriptor(cdp));
  check("Tab reaches the consent checkbox", walk[walk.length - 1].id, "contact-consent");

  /* Submit with consent unticked: the endpoint returns `400` with the generic
     approved message attributed to the `consent` field. */
  await tabUntil(cdp, (a) => a.type === "submit", walk);
  const submitStop = walk[walk.length - 1];
  check("Tab reaches the submit button", submitStop.type, "submit");
  await cdp.enter();
  const consentFailureLanded = await cdp.waitFor(
    `document.querySelectorAll('[id$="-error"]').length > 0`,
  );
  check("the server answered the first submission", consentFailureLanded, true);

  const afterConsentFailure = JSON.parse(await cdp.evaluate(ERRORS_ON_PAGE));
  report.consentFailure = {
    errors: afterConsentFailure,
    focused: await activeDescriptor(cdp),
    measure: JSON.parse(await cdp.evaluate(MEASURE)),
  };
  check(
    "server consent failure renders exactly one field error",
    afterConsentFailure.length,
    1,
  );
  check(
    "the consent failure is attributed to the consent field",
    afterConsentFailure[0]?.associatedControl,
    "input#contact-consent",
  );
  check(
    "the consent failure message is an approved string",
    afterConsentFailure[0]?.text,
    "Something went wrong. Please try again or email us directly.",
  );
  check(
    "focus moved to the consent checkbox",
    report.consentFailure.focused.id,
    "contact-consent",
  );
  check("the form is still present after a failure", report.consentFailure.measure.formPresent, true);
  report.shots.push(await cdp.screenshot("contact-1024-server-consent-error"));

  /* Now tick consent with the keyboard and submit again. */
  await cdp.space();
  await new Promise((r) => setTimeout(r, 150));
  const consentTicked = await cdp.evaluate(
    `document.getElementById("contact-consent").checked`,
  );
  check("Space ticks the consent checkbox", consentTicked, true);
  await tabUntil(cdp, (a) => a.type === "submit", []);
  await cdp.enter();
  const successLanded = await cdp.waitFor(
    `document.body.innerText.includes("Thank you. We have received your enquiry")`,
  );
  check("the success card arrived", successLanded, true);

  const afterSuccess = JSON.parse(await cdp.evaluate(MEASURE));
  report.success = {
    measure: afterSuccess,
    focused: await activeDescriptor(cdp),
    bodyText: await cdp.evaluate(
      `document.querySelector("main").innerText.replace(/\\s+/g, " ").slice(0, 600)`,
    ),
  };
  check("success card replaced the form", afterSuccess.formPresent, false);
  check("success message is rendered", afterSuccess.successPresent, true);
  check("no field errors remain", afterSuccess.fieldErrorCount, 0);
  check("no mailto: link anywhere after submission", afterSuccess.mailtoCount, 0);
  check("no tel: link anywhere after submission", afterSuccess.telCount, 0);
  check("exactly one h1 remains", afterSuccess.h1Count, 1);
  report.shots.push(await cdp.screenshot("contact-1024-success"));

  return report;
}

/* -------------------------------------------------------------------------- */
/* Main                                                                        */
/* -------------------------------------------------------------------------- */

async function connect() {
  const chromePath = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!chromePath) throw new Error("no Chrome or Edge binary found");

  const profile = join(tmpdir(), `nicben-cdp-${PORT}`);
  rmSync(profile, { recursive: true, force: true });

  const child = spawn(
    chromePath,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-extensions",
      "--hide-scrollbars",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore", detached: false },
  );

  let target = null;
  for (let i = 0; i < 60; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((entry) => entry.type === "page" && entry.webSocketDebuggerUrl);
      if (target) break;
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!target) throw new Error("Chrome did not expose a page target");

  const cdp = new Cdp(target.webSocketDebuggerUrl);
  await cdp.open();
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  return { cdp, child };
}

mkdirSync(OUT_DIR, { recursive: true });

const { cdp, child } = await connect();
let report;
try {
  report = SCENARIO === "interactive" ? await runInteractive(cdp) : await runStatic(cdp);
} finally {
  try {
    await cdp.send("Browser.close");
  } catch {
    /* the browser may already be gone */
  }
  child.kill();
}

const passed = checks.filter((entry) => entry.pass).length;
report.checks = checks;
report.summary = { total: checks.length, passed, failed: checks.length - passed };
const reportPath = join(OUT_DIR, `probe-${SCENARIO}.json`);
writeFileSync(reportPath, JSON.stringify(report, null, 2));

for (const entry of checks) {
  console.log(`${entry.pass ? "PASS" : "FAIL"}  ${entry.name}`);
  if (!entry.pass) {
    console.log(`      actual: ${JSON.stringify(entry.actual)}`);
  }
}
console.log(`\n${passed}/${checks.length} checks passed`);
console.log(`report: ${reportPath}`);
process.exit(passed === checks.length ? 0 : 1);
