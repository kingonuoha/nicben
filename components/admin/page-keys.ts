/**
 * The pages whose copy is editable from the portal.
 *
 * `06` §21 models `PageContent` with `pageKey` as the route key, and the API has no
 * create-a-page operation — "a new page is a code change that adds sections, not a
 * row an operator conjures" (`app/api/admin/content/[pageKey]/route.ts`). The
 * selector is a closed list for the same reason: an operator can edit the text of a
 * page that exists, and cannot create a content row for a route that does not.
 *
 * Every entry below is a real route in this build (`docs/01-sitemap-wireframes.md`
 * §3) and `pageKey` is its path without the leading slash, which is the shape
 * `pageKeyField` in `lib/validation/admin.ts` accepts (`lowercase path segments`).
 *
 * `label` and `note` are internal operator labels. Where the public copy for a page
 * is not yet confirmed, `note` says so — that is a confirmation debt the operator
 * needs to see, not copy and not a claim.
 */

export interface EditablePageKey {
  key: string;
  label: string;
  note: string;
}

export const EDITABLE_PAGE_KEYS: readonly EditablePageKey[] = [
  { key: "home", label: "Home (/)", note: "Hero, pillar cards and process text." },
  { key: "what-we-do", label: "What we do (/what-we-do)", note: "Intro and the three pillar blocks." },
  {
    key: "what-we-do/project-management-contracting",
    label: "Pillar 1 — Project management and contracting",
    note: "Scope items are marked [CLIENT TO CONFIRM] in the copy deck.",
  },
  {
    key: "what-we-do/property-improvement-maintenance",
    label: "Pillar 2 — Property improvement and maintenance",
    note: "Service sections: improvement, renovation, plumbing, maintenance, related contracting.",
  },
  {
    key: "what-we-do/treasury-investments",
    label: "Pillar 3 — Corporate treasury and investments",
    note: "Informational only. The notice box text is [PENDING CLIENT / LAWYER REVIEW] and must not be reworded here.",
  },
  { key: "about", label: "About (/about)", note: "Registered details and compliance statement." },
  { key: "how-it-works", label: "How it works (/how-it-works)", note: "The five process steps." },
  { key: "projects", label: "Projects (/projects)", note: "Gallery intro and empty state." },
  { key: "service-areas", label: "Service areas (/service-areas)", note: "State list is [CLIENT TO CONFIRM] — leave empty rather than substituting one." },
  { key: "faq", label: "FAQ (/faq)", note: "Grouped questions. Items 6–8 are hidden until confirmed." },
  { key: "contact", label: "Contact (/contact)", note: "Intro, response-time note and form labels." },
  { key: "privacy", label: "Privacy (/privacy)", note: "Body text is [PENDING CLIENT / LAWYER]." },
  { key: "terms", label: "Terms (/terms)", note: "Body text is [PENDING CLIENT / LAWYER]." },
] as const;

export const DEFAULT_PAGE_KEY = EDITABLE_PAGE_KEYS[0]?.key ?? "home";

export function isEditablePageKey(value: string | undefined): boolean {
  if (!value) return false;
  return EDITABLE_PAGE_KEYS.some((entry) => entry.key === value);
}

export function editablePageNote(key: string): string | null {
  return EDITABLE_PAGE_KEYS.find((entry) => entry.key === key)?.note ?? null;
}
