import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Award, CheckCircle2, Circle, Download, ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { getCertificateOverview } from "@/lib/certificate.functions";

export const Route = createFileRoute("/_authenticated/certificate")({
  head: () => ({
    meta: [
      { title: "Certificate | ABB Certification Programme" },
      { name: "description", content: "View and download your ABB certificate." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Gate({ done, label }: { done: boolean; label: string }) {
  return (
    <li className="flex items-start gap-3 text-sm">
      {done ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
      ) : (
        <Circle className="mt-0.5 h-4 w-4 text-muted-foreground" />
      )}
      <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function Page() {
  const fetchOverview = useServerFn(getCertificateOverview);
  const { data, isLoading } = useQuery({
    queryKey: ["certificate-overview"],
    queryFn: () => fetchOverview(),
  });

  const cert = data?.certificate ?? null;

  return (
    <AppShell title="Certificate">
      <h1 className="text-3xl font-semibold">Certificate</h1>
      <p className="mt-3 max-w-xl text-sm text-muted-foreground">
        Your Authorised Business Broker credential, issued once every programme requirement is met.
      </p>

      {isLoading && (
        <div className="mt-8 rounded-2xl border border-border bg-card p-10 text-sm text-muted-foreground">
          Loading your certification status…
        </div>
      )}

      {!isLoading && data && !data.enrolled && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Enroll in the programme to begin working towards your certificate.
        </div>
      )}

      {!isLoading && data?.enrolled && !cert && (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h2 className="font-display text-lg font-semibold">Certification checklist</h2>
            <ul className="mt-5 space-y-3">
              <Gate done={!!data.eligibility?.lessonsComplete} label="Complete every published lesson" />
              <Gate done={!!data.eligibility?.assignmentsApproved} label="Get all compulsory assignments approved" />
              <Gate done={!!data.eligibility?.examPassed} label="Pass the final examination" />
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-8">
            {data.awaitingApproval ? (
              <>
                <ShieldAlert className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-display text-lg font-semibold">Awaiting approval</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  You have met every requirement. Our certification team is reviewing your record and
                  will release your ABB ID shortly.
                </p>
              </>
            ) : (
              <>
                <Award className="h-5 w-5 text-primary" />
                <h3 className="mt-3 font-display text-lg font-semibold">Not issued yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Finish the outstanding items on the checklist to unlock your certificate.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {cert && (
        <div className="mt-8 space-y-5">
          {cert.status !== "active" && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              This certificate is currently {cert.status}.
              {cert.statusReason ? ` ${cert.statusReason}` : ""}
            </div>
          )}

          <div
            id="abb-certificate"
            className="rounded-2xl border-2 border-primary/30 bg-card p-10 text-center shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary">
              {cert.programmeName}
            </p>
            <p className="mt-8 text-sm text-muted-foreground">This is to certify that</p>
            <p className="mt-2 font-display text-3xl font-semibold">{cert.learnerName}</p>
            <p className="mx-auto mt-4 max-w-lg text-sm text-muted-foreground">
              has successfully completed all coursework, assignments and the final examination, and is
              recognised as an Authorised Business Broker.
            </p>
            <div className="mt-10 grid gap-6 text-left sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">ABB ID</p>
                <p className="mt-1 font-mono text-sm">{cert.abbId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Issued on</p>
                <p className="mt-1 text-sm">{new Date(cert.issuedAt).toLocaleDateString("en-IN")}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Signatory</p>
                <p className="mt-1 text-sm">
                  {cert.signatoryName || "Yoova Business Broking"}
                  {cert.signatoryTitle ? `, ${cert.signatoryTitle}` : ""}
                </p>
              </div>
            </div>
            <p className="mt-8 text-xs text-muted-foreground">{data?.validityNote}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" />
              Download / print
            </Button>
            <p className="text-sm text-muted-foreground">
              Anyone can verify this credential at /verify using ABB ID {cert.abbId}.
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
