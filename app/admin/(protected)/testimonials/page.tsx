import type { Metadata } from "next";

import { adminSession } from "@/app/admin/_lib/session";
import { getEnquiryRepository } from "@/lib/data/index";
import { ADMIN_LOGIN_PATH } from "@/lib/admin/contract";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { TestimonialManager } from "@/components/admin/TestimonialManager";

/**
 * `/admin/testimonials` — client reviews, published only when verified.
 *
 * "Testimonials: CRUD" (`docs/01-sitemap-wireframes.md` §5). Same filter semantics as
 * the project list: `published` is a filter the operator applies, never a default
 * the port applies for them.
 */

export const metadata: Metadata = {
  title: "Testimonials | NICBEN admin",
};

interface TestimonialsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminTestimonialsPage({ searchParams }: TestimonialsPageProps) {
  await adminSession();

  const params = await searchParams;
  const rawPublished = firstValue(params.published);
  const publishedFilter: "all" | "published" | "draft" =
    rawPublished === "true" ? "published" : rawPublished === "false" ? "draft" : "all";

  const repository = await getEnquiryRepository();
  const page = await repository.listTestimonials({
    limit: 200,
    cursor: null,
    ...(publishedFilter === "published" ? { published: true } : {}),
    ...(publishedFilter === "draft" ? { published: false } : {}),
  });

  return (
    <>
      <AdminPageHeader
        eyebrow="Content management"
        title="Testimonials"
        description="Genuine client reviews. Nothing here is generated, and a published review is a claim the company makes."
      />
      <TestimonialManager
        testimonials={page.items}
        total={page.total}
        publishedFilter={publishedFilter}
        loginRedirectHref={ADMIN_LOGIN_PATH}
      />
    </>
  );
}
