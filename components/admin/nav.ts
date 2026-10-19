import type { AuditAction, EnquiryStatus } from "@/lib/data/types";

/**
 * Portal navigation and label vocabulary.
 *
 * ### Why the labels exist and what they are
 *
 * `decisions.md` D-008 forbids a visible string that does not trace to
 * `docs/03-copy-deck.md`. Every string in this file is an **internal operator
 * label** for a stored value the server produced — the portal is never public
 * (`docs/06-tech-and-security-spec.md` §27, D-004), so nothing here can reach a
 * client of the business. No company fact, statistic, region, credential or
 * contact detail is authored here, and none is invented anywhere in the portal.
 *
 * The enquiry-type labels are *not* declared here: `enquiryTypeLabel()` in
 * `lib/validation/enquiry-options.ts` already owns them and they are deck copy
 * (`03-copy-deck.md:188`). The server passes them down.
 *
 * ### Navigation items map to routes that exist
 *
 * The design screen's sidebar lists investment-flavoured destinations
 * ("Asset Ledger", "Equity Partners", "Deployments"). Those screens do not exist,
 * and `decisions.md` D-002 forbids anything in the portal reading as offering or
 * collecting investments, so the sidebar lists the portal's real screens only.
 */

export interface AdminNavItem {
  href: string;
  label: string;
  /** Shown under the label on the mobile sheet and as the link's `title` on desktop. */
  description: string;
}

export interface AdminNavGroup {
  label: string;
  items: readonly AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: readonly AdminNavGroup[] = [
  {
    label: "Operations",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        description: "New enquiries, delivery state and recent activity",
      },
      {
        href: "/admin/enquiries",
        label: "Enquiries",
        description: "Every inbound enquiry, its status, notes and CSV export",
      },
      {
        href: "/admin/projects",
        label: "Projects",
        description: "Project records shown on the public gallery when published",
      },
      {
        href: "/admin/testimonials",
        label: "Testimonials",
        description: "Client reviews, published only when verified",
      },
    ],
  },
  {
    label: "Governance & audit",
    items: [
      {
        href: "/admin/content",
        label: "Page content",
        description: "Editable pillar, service and FAQ text",
      },
      {
        href: "/admin/settings",
        label: "Site settings",
        description: "Contact details, service areas and SEO defaults",
      },
      {
        href: "/admin/audit",
        label: "Audit log",
        description: "Who did what, and when",
      },
    ],
  },
] as const;

/** True when `pathname` is this item's route or a route below it. */
export function isNavItemActive(href: string, pathname: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Status vocabulary, `docs/06-tech-and-security-spec.md` §19
 * (`new, contacted, quoted, closed`). Title-cased for display; the stored value is
 * the API's own, and `ENQUIRY_STATUS_LABELS` is a total map, so a status added to
 * the union later fails the build here rather than rendering as a raw slug.
 */
export const ENQUIRY_STATUS_LABELS: Readonly<Record<EnquiryStatus, string>> = {
  new: "New",
  contacted: "Contacted",
  quoted: "Quoted",
  closed: "Closed",
};

/**
 * Which pill treatment a status gets. Only the colour varies; the text is always
 * the status itself, so no status is dressed up as something it is not.
 */
export function enquiryStatusTone(
  status: EnquiryStatus,
): "accent" | "brand" | "neutral" | "success" {
  switch (status) {
    case "new":
      return "accent";
    case "contacted":
      return "brand";
    case "quoted":
      return "neutral";
    case "closed":
      return "success";
    default:
      return "neutral";
  }
}

/**
 * The audit trail's action vocabulary is closed (`AUDIT_ACTION_VALUES`) and is
 * rendered as the stored value rather than a prettified synonym, so the log reads
 * the same way the design and the QA harness filter it.
 */
export function auditActionLabel(action: AuditAction): string {
  return action;
}
