/**
 * Structured server-side logging.
 *
 * Requirements this module exists to satisfy:
 * - `docs/06-tech-and-security-spec.md` section 43 — "Error pages that do not
 *   leak stack traces". Nothing logged here is ever placed in a response body;
 *   the enquiry pipeline returns a fixed, approved message and logs the detail.
 * - `docs/06-tech-and-security-spec.md` section 60 — admin logins, failed
 *   logins, enquiry status changes and content edits are logged (who, what, when).
 * - `docs/06-tech-and-security-spec.md` section 42 — "collect only what the form
 *   needs". An enquiry carries personal data, so call sites pass **references**
 *   (ids, codes, counts, durations), never payload values. The redaction pass
 *   below is a second line of defence, not the primary one.
 *
 * Output is one JSON object per line on stdout/stderr, which is what both Vercel
 * and a local `npm run dev` capture without extra tooling.
 */

export type ServerLogLevel = "debug" | "info" | "warn" | "error";

export interface ServerLogRecord {
  /** Subsystem, e.g. `"data"`, `"enquiry"`. */
  scope: string;
  /** Machine-readable event name, e.g. `"enquiry_created"`. */
  event: string;
  level?: ServerLogLevel;
  /** Reference data only: ids, codes, counts, booleans. Never user input. */
  data?: Record<string, unknown>;
}

/**
 * Keys whose values are never written to a log line. Enquiry payload fields
 * (`message`, `name`, `email`, `phone`, `location`), credentials, connection
 * strings and network addresses are all in here.
 */
const REDACTED_KEYS = new Set([
  "address",
  "authorization",
  "connectionstring",
  "consentat",
  "email",
  "file",
  "filename",
  "ip",
  "ipaddress",
  "location",
  "message",
  "name",
  "password",
  "passwordhash",
  "phone",
  "raw",
  "value",
]);

const REDACTED_KEY_PATTERNS = [/secret/i, /token/i, /apikey/i, /password/i, /uri$/i];

function shouldRedact(key: string): boolean {
  const normalised = key.toLowerCase();
  return (
    REDACTED_KEYS.has(normalised) ||
    REDACTED_KEY_PATTERNS.some((pattern) => pattern.test(normalised))
  );
}

function redactValue(value: unknown, depth = 0): unknown {
  if (depth > 3) return "[depth-limit]";
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((entry) => redactValue(entry, depth + 1));
  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    output[key] = shouldRedact(key) ? "[redacted]" : redactValue(source[key], depth + 1);
  }
  return output;
}

function redact(data: Record<string, unknown>): Record<string, unknown> {
  return redactValue(data) as Record<string, unknown>;
}

export function logServerEvent(record: ServerLogRecord): void {
  const level: ServerLogLevel = record.level ?? "info";
  let line: string;
  try {
    line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      scope: record.scope,
      event: record.event,
      ...(record.data ? { data: redact(record.data) } : {}),
    });
  } catch {
    // A logging call must never be the reason a request fails.
    line = JSON.stringify({
      ts: new Date().toISOString(),
      level: "error",
      scope: record.scope,
      event: record.event,
      data: { serialisationFailed: true },
    });
  }
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}
