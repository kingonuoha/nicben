"use client";

import { useState } from "react";

import { adminDownloadCsv } from "@/lib/admin/client";
import { DownloadIcon } from "@/components/admin/icons";
import { adminButtonClass } from "@/components/admin/primitives";

/**
 * The CSV export button.
 *
 * The file is **generated on the server** (`app/api/admin/enquiries/export/route.ts`)
 * and streamed back as `text/csv` with an attachment disposition. This component
 * only asks for it, hands the bytes to the browser as a download, and reports a
 * failure — it never builds a CSV itself, because the escaping that matters
 * (`lib/admin/csv.ts`: RFC 4180 quoting plus neutralisation of a leading
 * `= + - @ \t \r`) exists so that a value submitted by an anonymous stranger cannot
 * become a formula on the operator's desktop. A client-side export would be a
 * second implementation of that control, and the weakest one would be the one in
 * use.
 *
 * `adminDownloadCsv` deliberately does not go through `adminFetch`: the response is
 * a file, not the JSON envelope, and a helper that returned "either" would invite a
 * caller to treat an error page as a spreadsheet.
 *
 * The download is triggered with an object URL that is revoked immediately after
 * the click. The filename comes from the server's `Content-Disposition` when
 * present, so the portal does not invent one.
 */

export function ExportCsvButton({
  status,
  label = "Export to CSV",
}: {
  /** `undefined` exports every status. */
  status?: string;
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function download() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await adminDownloadCsv(status ? { status } : undefined);
      if (!result.ok) {
        setError(result.error?.message ?? "The export could not be produced.");
        return;
      }

      /**
       * The UTF-8 BOM is added **here**, on purpose.
       *
       * The server's `toCsv()` writes one (`CSV_BOM`), and `Response.text()` strips it
       * again while decoding — so a blob built from `result.text` would hand Excel on
       * Windows a BOM-less UTF-8 file, which it reads as the system code page and
       * mangles for any accented name. Re-adding it restores what the server sent.
       */
      const blob = new Blob(["\uFEFF", result.text], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename ?? "enquiries.csv";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("The server could not be reached.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className={adminButtonClass("secondary")}
      >
        <DownloadIcon width={16} height={16} className="text-brand-700" />
        <span>{busy ? "Preparing…" : label}</span>
      </button>
      {error ? (
        <p role="alert" className="max-w-xs font-body text-xs text-status-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
