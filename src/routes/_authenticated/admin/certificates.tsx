import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import {
  approveCertificate,
  listCertificateCandidates,
  setCertificateStatus,
} from "@/lib/certificate.functions";

export const Route = createFileRoute("/_authenticated/admin/certificates")({
  head: () => ({
    meta: [
      { title: "Certificate approvals | ABB Admin" },
      { name: "description", content: "Review eligible learners and issue ABB certificates." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  const queryClient = useQueryClient();
  const fetchCandidates = useServerFn(listCertificateCandidates);
  const approve = useServerFn(approveCertificate);
  const setStatus = useServerFn(setCertificateStatus);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-certificates"],
    queryFn: () => fetchCandidates(),
    retry: false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-certificates"] });

  const approveMutation = useMutation({
    mutationFn: (vars: { userId: string; courseId: string }) => approve({ data: vars }),
    onSuccess: (cert) => {
      toast.success(`Certificate issued: ${cert.abbId}`);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { certificateId: string; status: "active" | "suspended" | "revoked" }) =>
      setStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Certificate status updated");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AppShell title="Certificate approvals">
      <h1 className="text-3xl font-semibold">Certificate approvals</h1>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
        Every active enrolment with its certification gates. Issue a certificate once a learner has
        cleared all three requirements.
      </p>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading learners…</p>}
      {error && (
        <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {(error as Error).message}
        </p>
      )}

      {data && data.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          No active enrolments yet.
        </div>
      )}

      <div className="mt-8 space-y-4">
        {(data ?? []).map((row) => (
          <div
            key={`${row.userId}:${row.courseId}`}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium">{row.name}</p>
                <p className="text-sm text-muted-foreground">{row.email ?? "—"}</p>
                {row.certificate ? (
                  <p className="mt-2 text-sm">
                    <span className="font-mono">{row.certificate.abbId}</span>
                    <span className="ml-2 text-muted-foreground">({row.certificate.status})</span>
                  </p>
                ) : row.eligible ? (
                  <p className="mt-2 text-sm text-primary">Eligible — awaiting approval</p>
                ) : (
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {row.reasons.map((reason) => (
                      <li key={reason}>• {reason}</li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {!row.certificate && (
                  <Button
                    disabled={!row.eligible || approveMutation.isPending}
                    onClick={() =>
                      approveMutation.mutate({ userId: row.userId, courseId: row.courseId })
                    }
                  >
                    Issue certificate
                  </Button>
                )}
                {row.certificate && row.certificate.status === "active" && (
                  <>
                    <Button
                      variant="outline"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          certificateId: row.certificate!.id,
                          status: "suspended",
                        })
                      }
                    >
                      Suspend
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={statusMutation.isPending}
                      onClick={() =>
                        statusMutation.mutate({
                          certificateId: row.certificate!.id,
                          status: "revoked",
                        })
                      }
                    >
                      Revoke
                    </Button>
                  </>
                )}
                {row.certificate && row.certificate.status !== "active" && (
                  <Button
                    variant="outline"
                    disabled={statusMutation.isPending}
                    onClick={() =>
                      statusMutation.mutate({
                        certificateId: row.certificate!.id,
                        status: "active",
                      })
                    }
                  >
                    Reinstate
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
