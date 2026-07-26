import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { getLegalDocument } from "@/lib/public.functions";

export const Route = createFileRoute("/legal/$slug")({
  loader: async ({ params }) => {
    const doc = await getLegalDocument({ data: { slug: params.slug } });
    if (!doc) throw notFound();
    return doc;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [{ title: "Document unavailable | Yoova Business Broking" }, { name: "robots", content: "noindex" }],
      };
    }
    const title = `${loaderData.title} | Yoova Business Broking`;
    const description = `${loaderData.title} (version ${loaderData.version}) for the ABB certification programme.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: LegalPage,
  notFoundComponent: LegalNotFound,
  errorComponent: LegalNotFound,
});

function LegalPage() {
  const doc = Route.useLoaderData();

  return (
    <SiteLayout>
      <article className="container-page max-w-3xl py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Legal</p>
        <h1 className="mt-3 text-4xl font-semibold">{doc.title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Version {doc.version} · Effective{" "}
          {new Date(doc.effective_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        <div className="mt-10 space-y-5 text-sm leading-relaxed text-foreground/90">
          {String(doc.body).split(/\n{2,}/).map((paragraph: string, index: number) => (
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </SiteLayout>
  );
}

function LegalNotFound() {
  return (
    <SiteLayout>
      <div className="container-page max-w-2xl py-24 text-center">
        <h1 className="text-3xl font-semibold">Document not available</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This policy has not been published yet. Please contact support if you need a copy.
        </p>
        <Link
          to="/support"
          className="mt-8 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground"
        >
          Contact support
        </Link>
      </div>
    </SiteLayout>
  );
}
