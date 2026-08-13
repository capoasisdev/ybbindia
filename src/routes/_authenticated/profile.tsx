import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  User,
  Mail,
  MapPin,
  Award,
  CreditCard,
  Loader2,
  CheckCircle2,
  Lock,
  AlertCircle,
  Save,
  Edit3,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getMyProfile, updateMyProfile } from "@/lib/profile.functions";
import type { UpdateProfileInput } from "@/lib/profile.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "My profile | ABB Certification Programme" },
      { name: "description", content: "Manage your personal, billing and certificate details." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center gap-2.5 mb-5">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Icon className="size-4" />
        </span>
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  locked,
  required,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  locked?: boolean;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium flex items-center gap-1.5">
        {label}
        {required && <span className="text-destructive">*</span>}
        {locked && (
          <span className="ml-1 inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
            <Lock className="size-3" /> Locked
          </span>
        )}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || locked}
        className={cn(
          "h-10",
          locked && "cursor-not-allowed bg-muted/50 text-muted-foreground",
        )}
      />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function Page() {
  const fetchProfile = useServerFn(getMyProfile);
  const saveProfile = useServerFn(updateMyProfile);
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => fetchProfile({}),
  });

  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state — initialised from profile once loaded
  const [form, setForm] = useState<UpdateProfileInput>({
    full_name: "",
    mobile: null,
    city: null,
    state: null,
    organisation: null,
    profession: null,
    education: null,
    certificate_name: null,
    billing_address: null,
    billing_city: null,
    billing_state: null,
    billing_pincode: null,
    gst_number: null,
  });

  // Sync form when profile loads
  const [synced, setSynced] = useState(false);
  if (profile && !synced) {
    setForm({
      full_name: profile.full_name ?? "",
      mobile: profile.mobile ?? null,
      city: profile.city ?? null,
      state: profile.state ?? null,
      organisation: profile.organisation ?? null,
      profession: profile.profession ?? null,
      education: profile.education ?? null,
      certificate_name: profile.certificate_name ?? null,
      billing_address: profile.billing_address ?? null,
      billing_city: profile.billing_city ?? null,
      billing_state: profile.billing_state ?? null,
      billing_pincode: profile.billing_pincode ?? null,
      gst_number: profile.gst_number ?? null,
    });
    setSynced(true);
  }

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileInput) => saveProfile({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
      queryClient.invalidateQueries({ queryKey: ["learner-overview"] });
      setEditing(false);
      setSaved(true);
      setFormError(null);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => {
      setFormError(err?.message ?? "Something went wrong. Please try again.");
    },
  });

  const set = (key: keyof UpdateProfileInput) => (val: string) =>
    setForm((f) => ({ ...f, [key]: val || null }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name?.trim()) {
      setFormError("Full name is required.");
      return;
    }
    setFormError(null);
    mutation.mutate(form);
  };

  const handleCancel = () => {
    // Reset form to saved profile data
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        mobile: profile.mobile ?? null,
        city: profile.city ?? null,
        state: profile.state ?? null,
        organisation: profile.organisation ?? null,
        profession: profile.profession ?? null,
        education: profile.education ?? null,
        certificate_name: profile.certificate_name ?? null,
        billing_address: profile.billing_address ?? null,
        billing_city: profile.billing_city ?? null,
        billing_state: profile.billing_state ?? null,
        billing_pincode: profile.billing_pincode ?? null,
        gst_number: profile.gst_number ?? null,
      });
    }
    setFormError(null);
    setEditing(false);
  };

  if (isLoading) {
    return (
      <AppShell title="My profile">
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell title="My profile">
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          <AlertCircle className="mx-auto mb-3 size-6 text-muted-foreground/60" />
          Your profile could not be loaded. Please try refreshing the page.
        </div>
      </AppShell>
    );
  }

  const displayName = profile.full_name || profile.email;
  const initials = (profile.full_name || profile.email || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <AppShell title="My profile">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-accent text-white text-xl font-semibold select-none">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{displayName}</h1>
              <p className="mt-0.5 text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {profile.email}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Member since {memberSince}
              </p>
            </div>
          </div>

          {/* Edit / Save buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {saved && (
              <span className="flex items-center gap-1.5 text-sm text-green-600">
                <CheckCircle2 className="size-4" /> Saved!
              </span>
            )}
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={mutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Save className="size-4" />
                  )}
                  Save changes
                </Button>
              </>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(true)}
              >
                <Edit3 className="size-4" />
                Edit profile
              </Button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {formError && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 mt-0.5 shrink-0" />
            {formError}
          </div>
        )}

        {/* Personal Information */}
        <Section icon={User} title="Personal Information">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="full_name"
              label="Full name"
              value={form.full_name ?? ""}
              onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
              placeholder="Your full name"
              disabled={!editing}
              required
            />
            <Field
              id="email"
              label="Email address"
              type="email"
              value={profile.email}
              onChange={() => {}}
              placeholder="Email"
              disabled
              locked
            />
            <Field
              id="mobile"
              label="Mobile number"
              type="tel"
              value={form.mobile ?? ""}
              onChange={set("mobile")}
              placeholder="+91 98765 43210"
              disabled={!editing}
            />
            <Field
              id="profession"
              label="Profession / Job title"
              value={form.profession ?? ""}
              onChange={set("profession")}
              placeholder="e.g. Electrical Engineer"
              disabled={!editing}
            />
            <Field
              id="organisation"
              label="Organisation / Company"
              value={form.organisation ?? ""}
              onChange={set("organisation")}
              placeholder="Your employer or organisation"
              disabled={!editing}
            />
            <Field
              id="education"
              label="Highest education"
              value={form.education ?? ""}
              onChange={set("education")}
              placeholder="e.g. B.E. Electrical"
              disabled={!editing}
            />
          </div>
        </Section>

        {/* Location */}
        <Section icon={MapPin} title="Location">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="city"
              label="City"
              value={form.city ?? ""}
              onChange={set("city")}
              placeholder="Your city"
              disabled={!editing}
            />
            <Field
              id="state"
              label="State"
              value={form.state ?? ""}
              onChange={set("state")}
              placeholder="Your state"
              disabled={!editing}
            />
          </div>
        </Section>

        {/* Certificate Details */}
        <Section icon={Award} title="Certificate Details">
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {profile.certificate_name_locked ? (
              <span className="flex items-start gap-2">
                <Lock className="size-4 mt-0.5 shrink-0" />
                Your certificate name has been locked and cannot be changed. Contact support if you need an update.
              </span>
            ) : (
              <span className="flex items-start gap-2">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                The name below will be printed on your certificate. Once your certificate is issued, this field will be locked.
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="certificate_name"
              label="Name on certificate"
              value={form.certificate_name ?? ""}
              onChange={set("certificate_name")}
              placeholder="Name exactly as you want it on certificate"
              disabled={!editing}
              locked={profile.certificate_name_locked}
            />
          </div>
        </Section>

        {/* Billing Details */}
        <Section icon={CreditCard} title="Billing Details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field
                id="billing_address"
                label="Billing address"
                value={form.billing_address ?? ""}
                onChange={set("billing_address")}
                placeholder="Street address"
                disabled={!editing}
              />
            </div>
            <Field
              id="billing_city"
              label="Billing city"
              value={form.billing_city ?? ""}
              onChange={set("billing_city")}
              placeholder="City"
              disabled={!editing}
            />
            <Field
              id="billing_state"
              label="Billing state"
              value={form.billing_state ?? ""}
              onChange={set("billing_state")}
              placeholder="State"
              disabled={!editing}
            />
            <Field
              id="billing_pincode"
              label="PIN code"
              value={form.billing_pincode ?? ""}
              onChange={set("billing_pincode")}
              placeholder="6-digit PIN"
              disabled={!editing}
            />
          </div>
        </Section>

        {/* Status pill — non-editable */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              profile.is_active
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700",
            )}
          >
            <span
              className={cn(
                "size-1.5 rounded-full",
                profile.is_active ? "bg-green-500" : "bg-red-500",
              )}
            />
            {profile.is_active ? "Account active" : "Account inactive"}
          </span>
          {!editing && (
            <span className="text-muted-foreground/70">
              Click "Edit profile" to update your details.
            </span>
          )}
        </div>

        {/* Bottom save button (visible when editing) */}
        {editing && (
          <div className="flex justify-end gap-2 border-t border-border pt-6">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={mutation.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Save changes
            </Button>
          </div>
        )}
      </form>
    </AppShell>
  );
}
