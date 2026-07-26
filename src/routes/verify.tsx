import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, Search, ShieldAlert } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyCertificate } from "@/lib/public.functions";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify an ABB certificate | Yoova Business Broking" },
      {
        name: "description",
        content:
          "Check whether an Authorised Business Broker certificate is genuine by entering the ABB ID printed on it.",
      },
      { property: "og:title", content: "Verify an ABB certificate" },
      {
        property: "og:description",
        content: "Check whether an ABB certificate is genuine using its ABB ID.",
      },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const [abbId, setAbbId] = useState("");
  const mutation = useMutation({
    mutationFn: (id: string) => verifyCertificate({ data: { abbId: id } }),
  });

  const result = mutation.data;

  return (
    <SiteLayout>
      <section className="container-page max-w-3xl py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
          Certificate verification
        </p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Verify an ABB credential</h1>
        <p className="mt-4 text-muted-foreground">
          Enter the ABB ID printed on the certificate to confirm it was issued by Yoova Business
          Broking and is still valid.
        </p>

        <form
          className="mt-10 rounded-2xl border border-border bg-card p-6 shadow-soft"
          onSubmit={(event) => {
            event.preventDefault();
            if (abbId.trim()) mutation.mutate(abbId.trim());
          }}
        >
          <Label htmlFor="abb-id">ABB ID</Label>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <Input
              id="abb-id"
              value={abbId}
              onChange={(event) => setAbbId(event.target.value)}
              placeholder="YBB-ABB-2026-0001"
              autoComplete="off"
              className="h-12"
            />
            <Button type="submit" size="lg" disabled={mutation.isPending || !abbId.trim()}>
              <Search className="size-4" />
              {mutation.isPending ? "Checking…" : "Verify"}
            </Button>
          </div>
        </form>

        {result && (
          <div className="mt-8">
            {result.found ? (
              <div className="rounded-2xl border border-success/30 bg-success/5 p-7">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="size-6 text-success" />
                  <h2 className="text-lg font-semibold">Valid certificate</h2>
                </div>
                <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                  <Field label="ABB ID" value={result.abbId} />
                  <Field label="Certificate holder" value={result.learnerName} />
                  <Field label="Programme" value={result.programmeName} />
                  <Field
                    label="Issued on"
                    value={
                      result.issuedAt
                        ? new Date(result.issuedAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "—"
                    }
                  />
                  <Field label="Status" value={String(result.status).replace(/_/g, " ")} />
                </dl>
              </div>
            ) : (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-7">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="size-6 text-destructive" />
                  <h2 className="text-lg font-semibold">No matching certificate</h2>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  We could not find an active certificate with that ABB ID. Check the ID and try
                  again, or contact support if you believe this is an error.
                </p>
              </div>
            )}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium capitalize">{value ?? "—"}</dd>
    </div>
  );
}
