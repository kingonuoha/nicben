/**
 * Phase 06 — browser measurement of the admin portal (Chrome DevTools Protocol).
 *
 * `docs/decisions.md` D-010 requires responsive claims to be **measured**, and D-011
 * forbids a harness under `public/`. This script drives a headless Chrome over CDP
 * with no new dependency: Node 22 exposes a global `WebSocket`, and CDP is a JSON-RPC
 * protocol over one.
 *
 * What it records, per page and per width (360 / 768 / 1024 / 1440 — the four
 * documented breakpoints):
 *
 * - `documentElement.scrollWidth` against `innerWidth` → horizontal overflow, which
 *   `docs/04-design-system.md` §8 forbids on mobile;
 * - the display of the public site's header and footer → proof that the portal shell
 *   suppresses them (`app/globals.css`);
 * - the portal's own chrome (mobile bar, sidebar) → which one is active at each width;
 * - bounding boxes of the main content column and of the first panel → that the column
 *   actually reflows;
 * - computed font sizes for the page heading and body → that the type scale survived.
 *
 * It also performs two **keyboard-only** walks: signing in, and opening/closing the
 * enquiry detail overlay. Each step records the focused element and its computed
 * outline, which is the evidence `docs/04-design-system.md` §5 (visible focus) and the
 * phase brief's keyboard requirement ask for.
 *
 * A third walk is a `prefers-reduced-motion` pass: the portal's only animated chrome is
 * a hover transition, so the check asserts the token-driven durations collapse and that
 * nothing depends on a transform to be readable.
 *
 * Run (a server must already be listening):
 *   node tests/phase-06/admin-cdp.mjs --base=http://127.0.0.1:3230
 */

import { spawn } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { OUT_DIR, sleep } from "./harness.mjs";

const args = new Map(
  process.argv
    .slice(2)
    .filter((value) => value.startsWith("--"))
    .map((value) => {
      const [key, ...rest] = value.replace(/^--/, "").split("=");
      return [key, rest.join("=") || "true"];
    }),
);

const BASE = (args.get("base") ?? "http://127.0.0.1:3230").replace(/\/+$/, "");
const PORT = Number(args.get("cdpPort") ?? 9333);
const EMAIL = process.env.HARNESS_ADMIN_EMAIL ?? "operator@example.test";
const PASSWORD = process.env.HARNESS_ADMIN_PASSWORD ?? "Harness-Password-2026!";
const WIDTHS = [360, 768, 1024, 1440];
const PAGES = [
  "/admin",
  "/admin/enquiries",
  "/admin/projects",
  "/admin/testimonials",
  "/admin/content",
  "/admin/settings",
  "/admin/audit",
];

const SCREENSHOT_DIR = path.join(OUT_DIR, "screens");
const report = { base: BASE, generatedAt: new Date().toISOString(), widths: {}, keyboard: [], reducedMotion: null };

/* -------------------------------------------------------------------------- */
/* Browser binary                                                              */
/* -------------------------------------------------------------------------- */

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ].filter(Boolean);
  return candidates[0];
}

/* -------------------------------------------------------------------------- */
/* A very small CDP client                                                     */
/* -------------------------------------------------------------------------- */

class Cdp {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id === undefined) {
        this.lastEvent = message;
        return;
      }
      const entry = this.pending.get(message.id);
      if (!entry) return;
      this.pending.delete(message.id);
      if (message.error) entry.reject(new Error(`${message.error.message} (${entry.method})`));
      else entry.resolve(message.result);
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject, method });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  /** Evaluate in the page and return the value, waiting for promises. */
  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(`evaluate failed: ${result.exceptionDetails.text} ${result.exceptionDetails.exception?.description ?? ""}`);
    }
    return result.result.value;
  }

  async navigate(url) {
    await this.send("Page.navigate", { url });
    // Waiting on the load event is not enough: the app renders on the server, so a
    // document readyState of "complete" is the right signal, and polling it avoids
    // missing an event that already fired.
    for (let attempt = 0; attempt < 120; attempt += 1) {
      try {
        const state = await this.evaluate("document.readyState");
        if (state === "complete") return;
      } catch {
        // Navigation in flight.
      }
      await sleep(100);
    }
    throw new Error(`navigation to ${url} did not complete`);
  }

  async screenshot(name) {
    const result = await this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
    });
    await writeFile(path.join(SCREENSHOT_DIR, `${name}.png`), Buffer.from(result.data, "base64"));
  }

  async setViewport(width, height = 900) {
    await this.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width <= 480,
    });
  }

  /** Tab presses, with a fresh accessibility-free reading of where focus landed. */
  async pressTab() {
    await this.send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 9, key: "Tab", code: "Tab" });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 9, key: "Tab", code: "Tab" });
    await sleep(60);
  }

  /**
   * A real key press. `keyDown` rather than `rawKeyDown`: only `keyDown` runs the
   * element's default action, which is what makes Enter submit a form and Escape
   * close the overlay. `rawKeyDown` produces the event and skips the behaviour.
   */
  async pressKey(key, code, virtualKeyCode, text) {
    await this.send("Input.dispatchKeyEvent", {
      type: "keyDown",
      windowsVirtualKeyCode: virtualKeyCode,
      key,
      code,
      ...(text ? { text } : {}),
    });
    await this.send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: virtualKeyCode, key, code });
    await sleep(200);
  }

  /** Insert text into the focused control the way a keyboard does (`input` events fire). */
  async type(text) {
    await this.send("Input.insertText", { text });
    await sleep(60);
  }

  focusDescription() {
    return this.evaluate(`(() => {
      const el = document.activeElement;
      if (!el) return null;
      const style = getComputedStyle(el);
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || null,
        name: el.getAttribute('name'),
        type: el.getAttribute('type'),
        text: (el.textContent || '').trim().slice(0, 48) || null,
        ariaLabel: el.getAttribute('aria-label'),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
        outlineOffset: style.outlineOffset,
      };
    })()`);
  }
}

/* -------------------------------------------------------------------------- */
/* Measurement expression                                                      */
/* -------------------------------------------------------------------------- */

const MEASURE = `(() => {
  const box = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return {
      x: Math.round(rect.x * 100) / 100,
      y: Math.round(rect.y * 100) / 100,
      width: Math.round(rect.width * 100) / 100,
      height: Math.round(rect.height * 100) / 100,
      display: style.display,
      fontSize: style.fontSize,
    };
  };
  const publicHeader = document.querySelector('body > header');
  const publicFooter = document.querySelector('body > footer');
  const table = document.querySelector('table');
  const scroller = table ? table.parentElement : null;
  const actionsCell = document.querySelector('tbody tr td:last-child');
  const actionsLink = actionsCell ? actionsCell.querySelector('a') : null;
  const rect = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
  };
  const tableDetail = table
    ? {
        scrollerClientWidth: scroller.clientWidth,
        scrollerScrollWidth: scroller.scrollWidth,
        scrollerOverflowX: scroller ? getComputedStyle(scroller).overflowX : null,
        scrollerRect: rect(scroller),
        tableRect: rect(table),
        lastColumnRect: rect(actionsCell),
        lastColumnActionRect: rect(actionsLink),
        clippedByAncestor: actionsLink
          ? Math.max(0, Math.round(rect(actionsLink).right - rect(document.querySelector('main#admin-main')).right))
          : null,
      }
    : null;
  return {
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    publicHeaderDisplay: publicHeader ? getComputedStyle(publicHeader).display : 'absent',
    publicFooterDisplay: publicFooter ? getComputedStyle(publicFooter).display : 'absent',
    mainContentPaddingTop: (() => {
      const main = document.getElementById('main-content');
      return main ? getComputedStyle(main).paddingTop : null;
    })(),
    mobileBarDisplay: (() => {
      const bar = document.querySelector('aside#admin-sidebar');
      const mobile = document.querySelector('div.lg\\\\:hidden');
      return { sidebar: bar ? getComputedStyle(bar).display : null, mobileBar: mobile ? getComputedStyle(mobile).display : null };
    })(),
    sidebar: box('aside#admin-sidebar'),
    main: box('main#admin-main'),
    firstPanel: box('main#admin-main section'),
    table: table ? { present: true, scrollWidth: table.parentElement ? table.parentElement.scrollWidth : null, clientWidth: table.parentElement ? table.parentElement.clientWidth : null } : { present: false },
    tableDetail,
    heading: box('main#admin-main h1'),
    bodyFont: getComputedStyle(document.body).fontFamily,
  };
})()`;

/* -------------------------------------------------------------------------- */
/* Run                                                                         */
/* -------------------------------------------------------------------------- */

await mkdir(SCREENSHOT_DIR, { recursive: true });

const browserPath = findBrowser();
const userDataDir = path.join(os.tmpdir(), `nicben-phase06-cdp-${Date.now()}`);

const browser = spawn(
  browserPath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);

let browserLog = "";
browser.stdout.on("data", (chunk) => (browserLog += chunk.toString()));
browser.stderr.on("data", (chunk) => (browserLog += chunk.toString()));

async function cdpTarget() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Not listening yet.
    }
    await sleep(200);
  }
  throw new Error(`no CDP page target; browser log:\n${browserLog}`);
}

let cdp;
try {
  const socketUrl = await cdpTarget();
  const socket = new WebSocket(socketUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  cdp = new Cdp(socket);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");

  /* 1. The unauthenticated login screen, measured ----------------------------- */
  process.stdout.write("  login screen\n");
  await cdp.setViewport(1440);
  await cdp.navigate(`${BASE}/admin/login`);
  const loginMeasurements = {};
  for (const width of WIDTHS) {
    await cdp.setViewport(width);
    await cdp.evaluate("window.scrollTo(0, 0)");
    await sleep(120);
    loginMeasurements[width] = await cdp.evaluate(MEASURE);
    if (width === 360 || width === 1440) await cdp.screenshot(`login-${width}`);
  }
  report.widths.login = loginMeasurements;

  /* 2. Keyboard-only sign-in ------------------------------------------------- */
  process.stdout.write("  keyboard sign-in\n");
  await cdp.setViewport(1440);
  await cdp.navigate(`${BASE}/admin/login`);
  await cdp.evaluate("document.body.focus()");
  const walk = [];
  for (let step = 0; step < 7; step += 1) {
    await cdp.pressTab();
    const focused = await cdp.focusDescription();
    walk.push(focused);
    if (focused && focused.id === "admin-email") {
      await cdp.type(EMAIL);
    } else if (focused && focused.id === "admin-password") {
      await cdp.type(PASSWORD);
    } else if (focused && focused.tag === "button" && focused.type === "submit") {
      // Tab reached the submit control; activate it with the keyboard rather than
      // the mouse, which is the whole point of this walk. Chromium synthesises the
      // button's activation from a `keyDown` carrying the carriage return as text;
      // without `text` the event is delivered to the page but no default action runs.
      await cdp.pressKey("Enter", "Enter", 13, "\r");
      break;
    }
  }
  const typedValues = await cdp.evaluate(`({
    email: document.getElementById('admin-email')?.value ?? null,
    passwordLength: document.getElementById('admin-password')?.value.length ?? null,
  })`);
  report.keyboard.push({ page: "/admin/login", walk, typedValues });

  for (let attempt = 0; attempt < 80; attempt += 1) {
    const url = await cdp.evaluate("location.pathname");
    if (url === "/admin") break;
    await sleep(250);
  }
  const signedInPath = await cdp.evaluate("location.pathname");
  const loginAlert = signedInPath === "/admin"
    ? null
    : await cdp.evaluate(`document.querySelector('[role=alert]')?.textContent?.replace(/\\s+/g,' ').trim().slice(0,220) ?? null`);
  report.keyboard.push({
    page: "/admin/login",
    result: signedInPath === "/admin" ? "signed in with the keyboard alone" : `stuck on ${signedInPath}`,
    alert: loginAlert,
    landedOn: signedInPath,
  });


  /* 3. Every screen, four widths ------------------------------------------- */
  for (const pagePath of PAGES) {
    process.stdout.write(`  ${pagePath}\n`);
    const perWidth = {};
    for (const width of WIDTHS) {
      await cdp.setViewport(width);
      await cdp.navigate(`${BASE}${pagePath}`);
      await sleep(150);
      perWidth[width] = await cdp.evaluate(MEASURE);
      if (width === 360 || width === 1440) {
        await cdp.screenshot(`${pagePath.replace(/\//g, "_").replace(/^_/, "")}-${width}`);
      }
    }
    report.widths[pagePath] = perWidth;
  }

  /* 4. Keyboard-only enquiries table and detail overlay --------------------- */
  process.stdout.write("  keyboard enquiries walkthrough\n");
  await cdp.setViewport(1440);
  await cdp.navigate(`${BASE}/admin/enquiries`);
  const tableWalk = [];
  let reachedOverlay = false;
  for (let step = 0; step < 40; step += 1) {
    await cdp.pressTab();
    const focused = await cdp.focusDescription();
    tableWalk.push(focused);
    if (focused && focused.text && focused.text.startsWith("View")) {
      await cdp.pressKey("Enter", "Enter", 13, String.fromCharCode(13));
      reachedOverlay = true;
      break;
    }
  }
  const overlayOpen = await cdp.evaluate("Boolean(document.querySelector('[role=dialog]'))");
  const overlayUrl = await cdp.evaluate("location.search");
  // Captured while it is open: the point of the screen is the overlay itself.
  await cdp.screenshot("enquiries-drawer-keyboard");
  await cdp.pressKey("Escape", "Escape", 27);
  await sleep(300);
  const overlayClosed = await cdp.evaluate("!document.querySelector('[role=dialog]')");
  const afterEscapeUrl = await cdp.evaluate("location.search");
  const focusAfterEscape = await cdp.focusDescription();
  report.keyboard.push({
    page: "/admin/enquiries",
    steps: tableWalk.length,
    reachedOverlayWithKeyboard: reachedOverlay,
    overlayOpened: overlayOpen,
    overlayUrl,
    overlayClosedByEscape: overlayClosed,
    urlAfterEscape: afterEscapeUrl,
    focusAfterEscape,
    trail: tableWalk.slice(-6),
  });

  /* 5. CSV export, exercised through the button itself ---------------------- */
  process.stdout.write("  csv export from the button\n");
  const downloadDir = path.join(OUT_DIR, "downloads");
  await mkdir(downloadDir, { recursive: true });
  await cdp.send("Page.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir });
  await cdp.setViewport(1440);
  await cdp.navigate(`${BASE}/admin/enquiries`);
  const buttonFound = await cdp.evaluate(`(() => {
    const button = [...document.querySelectorAll('button')].find((candidate) =>
      (candidate.textContent || '').includes('Export'),
    );
    if (!button) return false;
    button.click();
    return true;
  })()`);

  let download = null;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const files = (await readdir(downloadDir)).filter((name) => name.endsWith(".csv"));
    if (files.length > 0) {
      const file = path.join(downloadDir, files[0]);
      const csvText = await readFile(file, "utf8");
      download = {
        file: files[0],
        bytes: Buffer.byteLength(csvText, "utf8"),
        firstLine: csvText.split(/\r?\n/)[0].replace(/^\uFEFF/, ""),
        /**
         * Physical lines after the header, **not** a record count: a multi-line message
         * is one quoted field and therefore spans several lines. That is the point of the
         * quoting, so the number is reported for what it is.
         */
        linesAfterHeader: csvText.split(/\r?\n/).filter((line) => line.trim().length > 0).length - 1,
        hasBom: csvText.startsWith("\uFEFF"),
        neutralisedFormula: csvText.includes("'=1+1"),
        quotedCommaField: /"[^"]*,[^"]*"/.test(csvText),
      };
      break;
    }
    await sleep(250);
  }
  report.csvExport = { buttonFound, download };

  /* 6. Reduced motion ------------------------------------------------------- */
  process.stdout.write("  reduced motion\n");
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });
  await cdp.navigate(`${BASE}/admin`);
  const reducedMotion = await cdp.evaluate(`(() => {
    const nav = document.querySelector('aside#admin-sidebar a');
    const toggle = document.querySelector('button[aria-controls=admin-sidebar]');
    return {
      matches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      bodyTransition: getComputedStyle(document.body).transitionDuration,
      navLinkTransition: nav ? getComputedStyle(nav).transitionDuration : null,
      navLinkVisible: nav ? nav.getBoundingClientRect().height > 0 : null,
      contentReadable: (document.querySelector('main#admin-main h1')?.textContent || '').length > 0,
      togglePresent: Boolean(toggle),
    };
  })()`);
  report.reducedMotion = reducedMotion;
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "admin-cdp-report.json"), JSON.stringify(report, null, 2));
  process.stdout.write(`\n  report written to tests/phase-06/out/admin-cdp-report.json\n`);
  process.exit(0);
} finally {
  if (browser && typeof browser.pid === "number") {
    if (process.platform === "win32") {
      spawn("taskkill", ["/PID", String(browser.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      browser.kill();
    }
  }
}
