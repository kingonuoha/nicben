/**
 * CSV generation for the enquiries export — `docs/tasks/phase-06-hidden-admin-portal/brief.md`
 * §5.3 ("CSV export (server-generated, values escaped)") and the backend task's
 * "full escaping: commas, quotes, newlines, and leading `= + - @` (formula injection)".
 *
 * ### Two different problems, two different defences
 *
 * **1. Structural.** A field containing a comma, a quote or a newline would otherwise
 * change the shape of the file — a newline in a message body would look like a new
 * record. RFC 4180's answer is applied exactly: quote the field, and double any
 * internal quote. Minimal quoting (only when needed) rather than quoting everything,
 * because a spreadsheet and a human both read the result more easily and the escaping
 * is then visible in the diff.
 *
 * **2. Formula injection (CSV injection).** A field beginning with `=`, `+`, `-`, `@`,
 * a tab or a carriage return is executed as a formula by Excel, LibreOffice and Google
 * Sheets when the file is opened. Excel additionally treats a leading `-` as the start
 * of a formula and some versions evaluate `=HYPERLINK(...)`/`=cmd|...` on open. The
 * value arrives here from an **unauthenticated public form**, so this is a real path
 * from "anonymous stranger" to "code execution on the operator's desktop". Mitigation:
 * prefix the value with a single apostrophe and quote the field.
 *
 * The reader-neutralising prefix means the exported cell is **not byte-identical** to
 * the stored value — that is the point of the control, and it is why the neutralised
 * form is also quoted: the apostrophe has to be part of the field rather than a stray
 * character the parser discards.
 *
 * ### Scope of the neutralisation
 *
 * Only the **first** character is examined. A `-` in the middle of "Net-30" is not a
 * formula and is left alone, and a leading `-` on a negative number is neutralised
 * even though a number would be harmless — a rule that tried to distinguish them would
 * be guessing, and one bypass is worth more to an attacker than a lost minus sign is to
 * a reader. Fields are also preceded by a header row, so the trade-off is visible.
 *
 * ### What this module does not do
 *
 * It does not decide *which* values are safe, it does not truncate, and it does not
 * touch the database. It is pure, and it is the only place an enquiry value is turned
 * into CSV text — the route passes rows in and streams the string out.
 *
 * Server-only by convention (it is imported by a route handler); it has no Node imports
 * and is therefore safe to unit-test in isolation.
 */

/**
 * Characters that make a spreadsheet treat a cell as a formula. A tab and a carriage
 * return are included because Excel strips them before evaluating the remainder,
 * which turns `"\t=cmd"` into a live formula.
 */
export const CSV_FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"] as const;

/** The apostrophe a spreadsheet treats as "the rest of this cell is literal text". */
export const CSV_FORMULA_ESCAPE = "'";

/** RFC 4180's record separator. `\r\n` is what a spreadsheet expects and accepts. */
export const CSV_RECORD_SEPARATOR = "\r\n";

/**
 * A UTF-8 BOM. Excel on Windows reads a BOM-less UTF-8 file as the system code page,
 * which mangles an accented name or a currency symbol in a message body. Included by
 * default (`toCsv`) and switchable, because it is invisible in most editors and an
 * auditor comparing bytes deserves to know where it came from.
 */
export const CSV_BOM = "\uFEFF";

/** True when the value would be evaluated as a formula by a spreadsheet. */
export function startsWithFormulaTrigger(value: string): boolean {
  if (value.length === 0) return false;
  return (CSV_FORMULA_PREFIXES as readonly string[]).includes(value[0]);
}

/**
 * Return the value as it must appear **inside** a CSV field, after neutralisation and
 * before any structural quoting.
 */
export function neutraliseFormula(value: string): string {
  return startsWithFormulaTrigger(value) ? `${CSV_FORMULA_ESCAPE}${value}` : value;
}

/**
 * Escape one field.
 *
 * ```
 *   "hello"                    → hello
 *   "a,b"                      → "a,b"
 *   'he said "hi"'             → "he said ""hi"""
 *   "line1\nline2"             → "line1\nline2"      (quoted; the newline survives)
 *   "=1+1"                     → "'=1+1"
 *   "  padded  "               → "  padded  "        (quoted, so padding survives)
 * ```
 */
export function escapeCsvValue(value: string | null | undefined): string {
  const raw = value ?? "";
  const neutralised = neutraliseFormula(raw);

  // A leading or trailing space is quoted too: it round-trips untouched, which is what
  // lets a field that the neutraliser prefixed stay readable.
  const needsQuotes =
    neutralised.includes(",") ||
    neutralised.includes('"') ||
    neutralised.includes("\n") ||
    neutralised.includes("\r") ||
    neutralised !== neutralised.trim() ||
    // The neutralising apostrophe is itself quoted, so a parser sees one field rather
    // than a stray text marker.
    neutralised.startsWith(CSV_FORMULA_ESCAPE);

  if (!needsQuotes) return neutralised;
  return `"${neutralised.replace(/"/g, '""')}"`;
}

/**
 * Build a CSV document. Every cell is escaped, the header row is escaped like any
 * other, and the record separator is fixed by this module so a value can never inject
 * a record boundary of its own.
 */
export function toCsv(
  rows: ReadonlyArray<ReadonlyArray<string | null | undefined>>,
  options: { bom?: boolean } = {},
): string {
  const includeBom = options.bom ?? true;
  const body = rows.map((row) => row.map(escapeCsvValue).join(",")).join(CSV_RECORD_SEPARATOR);
  // A trailing separator is what most tools expect and it keeps the last record from
  // being ambiguous with a missing final newline.
  return `${includeBom ? CSV_BOM : ""}${body}${CSV_RECORD_SEPARATOR}`;
}

/**
 * A downloadable CSV response.
 *
 * `filename` is generated by the caller from a timestamp and contains no user input, so
 * it needs no escaping; the header is written here rather than at the call site so a
 * second export cannot forget `attachment` and render the file inline.
 */
export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "no-store, private",
      vary: "Cookie",
      "x-content-type-options": "nosniff",
    },
  });
}
