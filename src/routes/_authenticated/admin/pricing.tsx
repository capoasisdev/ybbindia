import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  getAdminPricingSettings,
  updateAdminPricingSettings,
  type AdminPricingSettings,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing Controls | YBB Admin" },
      { name: "description", content: "Manage course fee, GST rate, currency, and access duration." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const queryClient = useQueryClient();
  const fetchPricingSettings = useServerFn(getAdminPricingSettings);
  const savePricingSettings = useServerFn(updateAdminPricingSettings);

  const { data: currentSettings, isLoading, error } = useQuery({
    queryKey: ["admin-pricing-settings"],
    queryFn: () => fetchPricingSettings(),
    retry: false,
  });

  // Local form state
  const [coursePriceRupees, setCoursePriceRupees] = useState("");
  const [gstRatePercent, setGstRatePercent] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [accessDurationDays, setAccessDurationDays] = useState("");
  const [paymentsTestMode, setPaymentsTestMode] = useState(true);
  const [examFreeAttempts, setExamFreeAttempts] = useState("2");
  const [examAttemptPriceRupees, setExamAttemptPriceRupees] = useState("500");

  // Populate local state when query finishes loading
  useEffect(() => {
    if (currentSettings) {
      setCoursePriceRupees((currentSettings.coursePricePaise / 100).toString());
      setGstRatePercent(currentSettings.gstRatePercent.toString());
      setCurrency(currentSettings.currency);
      setAccessDurationDays(currentSettings.accessDurationDays.toString());
      setPaymentsTestMode(currentSettings.paymentsTestMode);
      setExamFreeAttempts(currentSettings.examFreeAttempts.toString());
      setExamAttemptPriceRupees((currentSettings.examAttemptPricePaise / 100).toString());
    }
  }, [currentSettings]);

  const updateMutation = useMutation({
    mutationFn: (newSettings: AdminPricingSettings) =>
      savePricingSettings({ data: newSettings }),
    onSuccess: () => {
      toast.success("Pricing configurations updated successfully.");
      queryClient.invalidateQueries({ queryKey: ["admin-pricing-settings"] });
      // Invalidate public settings too so website/enrolment changes reflect instantly
      queryClient.invalidateQueries({ queryKey: ["public-settings"] });
      queryClient.invalidateQueries({ queryKey: ["exam-overview"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to update pricing settings.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const basePrice = parseFloat(coursePriceRupees);
    if (isNaN(basePrice) || basePrice < 0) {
      toast.error("Please enter a valid course price.");
      return;
    }

    const gstRate = parseFloat(gstRatePercent);
    if (isNaN(gstRate) || gstRate < 0 || gstRate > 100) {
      toast.error("GST rate must be between 0% and 100%.");
      return;
    }

    const duration = parseInt(accessDurationDays, 10);
    if (isNaN(duration) || duration <= 0) {
      toast.error("Access duration must be at least 1 day.");
      return;
    }

    if (!currency.trim()) {
      toast.error("Please enter a valid currency (e.g. INR).");
      return;
    }

    const freeAttempts = parseInt(examFreeAttempts, 10);
    if (isNaN(freeAttempts) || freeAttempts < 0) {
      toast.error("Free exam attempts must be 0 or more.");
      return;
    }

    const attemptPrice = parseFloat(examAttemptPriceRupees);
    if (isNaN(attemptPrice) || attemptPrice < 0) {
      toast.error("Please enter a valid attempt price.");
      return;
    }

    // Convert prices back to paise for storage
    const coursePricePaise = Math.round(basePrice * 100);
    const examAttemptPricePaise = Math.round(attemptPrice * 100);

    updateMutation.mutate({
      coursePricePaise,
      gstRatePercent: gstRate,
      currency: currency.trim().toUpperCase(),
      accessDurationDays: duration,
      paymentsTestMode,
      examFreeAttempts: freeAttempts,
      examAttemptPricePaise,
    });
  };

  if (isLoading) {
    return (
      <AppShell title="Pricing Controls">
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-10 justify-center">
          <Loader2 className="size-5 animate-spin text-primary" /> Loading pricing configurations…
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Pricing Controls">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 max-w-xl mx-auto mt-10">
          <div className="flex gap-3 items-start text-destructive">
            <AlertCircle className="size-5 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg">Failed to load settings</h3>
              <p className="text-sm mt-1">{(error as Error).message}</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // Calculate breakup for visual preview
  const baseVal = parseFloat(coursePriceRupees) || 0;
  const gstVal = parseFloat(gstRatePercent) || 0;
  const gstAmount = (baseVal * gstVal) / 100;
  const totalVal = baseVal + gstAmount;

  return (
    <AppShell title="Pricing Controls">
      <div className="max-w-4xl">
        <p className="border-l-2 border-primary pl-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Admin console
        </p>
        <h1 className="mt-3 text-3xl font-semibold">Pricing Controls</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage general pricing details, GST rate, student course access duration, and live checkout configurations.
        </p>

        {paymentsTestMode && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-sm text-amber-800">
            <ShieldAlert className="size-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-semibold">Payments Test Mode is Active:</span> Users will be able to simulate successful checkout and bypass Razorpay payments. Disable this for live production environments.
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
          {/* Settings Form */}
          <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Pricing Configurations</h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="coursePrice">Course Price (excluding GST)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-semibold">
                    {currency}
                  </span>
                  <Input
                    id="coursePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="15000.00"
                    value={coursePriceRupees}
                    onChange={(e) => setCoursePriceRupees(e.target.value)}
                    className="pl-14"
                    required
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  The base cost of the ABB Certification Program before taxation.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="gstRate">GST Rate (%)</Label>
                  <Input
                    id="gstRate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="18"
                    value={gstRatePercent}
                    onChange={(e) => setGstRatePercent(e.target.value)}
                    className="mt-1.5"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Applied automatically at checkout.
                  </p>
                </div>

                <div>
                  <Label htmlFor="currency">Currency Code</Label>
                  <Input
                    id="currency"
                    type="text"
                    maxLength={3}
                    placeholder="INR"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                    className="mt-1.5 font-mono"
                    required
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    ISO 3-letter currency code.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="accessDuration">Access Duration (Days)</Label>
                <Input
                  id="accessDuration"
                  type="number"
                  min="1"
                  placeholder="365"
                  value={accessDurationDays}
                  onChange={(e) => setAccessDurationDays(e.target.value)}
                  className="mt-1.5"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  The duration in days for which learners retain course access after enrolment.
                </p>
              </div>

              <div className="pt-2 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">Certification Examination Attempts Fee</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="examFreeAttempts">Free Exam Attempts</Label>
                    <Input
                      id="examFreeAttempts"
                      type="number"
                      min="0"
                      max="10"
                      placeholder="2"
                      value={examFreeAttempts}
                      onChange={(e) => setExamFreeAttempts(e.target.value)}
                      className="mt-1.5"
                      required
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Number of attempts allowed for free (e.g. 2).
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="examAttemptPrice">Re-Attempt Fee (excluding GST)</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-2.5 text-sm text-muted-foreground font-semibold">
                        {currency}
                      </span>
                      <Input
                        id="examAttemptPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="500.00"
                        value={examAttemptPriceRupees}
                        onChange={(e) => setExamAttemptPriceRupees(e.target.value)}
                        className="pl-14"
                        required
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Fee charged for 3rd, 4th, 5th etc. attempts.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-4 mt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="testMode" className="text-sm font-semibold">
                    Payments Test Mode
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Exposes bypass controls on checkout page for QA simulation.
                  </p>
                </div>
                <Switch
                  id="testMode"
                  checked={paymentsTestMode}
                  onCheckedChange={setPaymentsTestMode}
                />
              </div>
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={updateMutation.isPending} className="w-full">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin mr-2" /> Saving Changes...
                  </>
                ) : (
                  "Save Pricing Settings"
                )}
              </Button>
            </div>
          </form>

          {/* Interactive Pricing Summary & Live Preview */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Checkout Live Preview</h2>
              <p className="text-xs text-muted-foreground mb-6">
                This is a live preview of how pricing breakup will be calculated and presented to new students during enrolment.
              </p>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
                  Student Enrolment Cost
                </span>
                <div className="text-2xl font-extrabold text-foreground mt-1">
                  {currency} {totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Includes GST & gives {accessDurationDays || "0"} days of access.
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <dt className="text-muted-foreground">Base Program Fee</dt>
                  <dd className="font-medium text-foreground">
                    {currency} {baseVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <dt className="text-muted-foreground">GST ({gstVal}%)</dt>
                  <dd className="font-medium text-foreground">
                    {currency} {gstAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </dd>
                </div>
                <div className="flex justify-between pt-1">
                  <dt className="font-semibold text-foreground">Total Enrolment Fee</dt>
                  <dd className="font-semibold text-foreground">
                    {currency} {totalVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </dd>
                </div>
              </dl>

              {/* Re-attempt Fee Preview */}
              <div className="mt-6 pt-5 border-t border-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Re-Examination Fee Preview</h3>
                {(() => {
                  const attemptBase = parseFloat(examAttemptPriceRupees) || 0;
                  const attemptGst = (attemptBase * gstVal) / 100;
                  const attemptTotal = attemptBase + attemptGst;
                  return (
                    <div className="rounded-xl border border-border bg-muted/20 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Free Included Attempts:</span>
                        <span className="font-semibold text-foreground">{examFreeAttempts || "0"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Extra Attempt Fee (excl. GST):</span>
                        <span className="font-medium">{currency} {attemptBase.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-border/50 pt-2 text-foreground">
                        <span>Total per Extra Attempt (incl. GST):</span>
                        <span>{currency} {attemptTotal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-6 flex flex-col gap-3">
              <div className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="size-5 shrink-0 text-primary mt-0.5" />
                <span className="text-xs">
                  Updates to settings are live and RLS protected.
                </span>
              </div>
              <div className="flex gap-3 text-muted-foreground">
                <CheckCircle2 className="size-5 shrink-0 text-primary mt-0.5" />
                <span className="text-xs">
                  Razorpay payments will reflect these amounts automatically.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
