import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Bell,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  RefreshCw,
  Loader2,
  ShieldAlert,
  Sliders,
  FileText,
  UserCheck,
  Building,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getAdminNotificationData,
  updateNotificationTemplate,
  updateNotificationSettings,
  sendTestEmail,
  sendTemplateTestEmail,
  type AdminNotificationTemplate,
} from "@/lib/admin-notifications.functions";

export const Route = createFileRoute("/_authenticated/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Automations | YBB Admin" },
      { name: "description", content: "Manage automated transactional emails, templates, and delivery logs." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NotificationsAdminPage,
});

const TEMPLATE_PLACEHOLDERS: Record<string, string[]> = {
  order_confirmed_customer: ["{{learner_name}}", "{{programme_name}}", "{{order_id}}", "{{amount}}", "{{invoice_number}}", "{{valid_until}}"],
  order_created_admin: ["{{learner_name}}", "{{learner_email}}", "{{learner_mobile}}", "{{programme_name}}", "{{order_id}}", "{{amount}}", "{{invoice_number}}", "{{date}}"],
  assignment_submitted_customer: ["{{learner_name}}", "{{assignment_title}}"],
  assignment_submitted_admin: ["{{learner_name}}", "{{learner_email}}", "{{assignment_title}}", "{{lesson_title}}", "{{submitted_at}}"],
  assignment_reviewed_customer: ["{{learner_name}}", "{{assignment_title}}", "{{review_status}}", "{{reviewer_notes}}"],
  certificate_issued_customer: ["{{learner_name}}", "{{abb_id}}", "{{issue_date}}"],
  certificate_issued_admin: ["{{learner_name}}", "{{learner_email}}", "{{abb_id}}", "{{issue_date}}"],
  ticket_created_admin: ["{{ticket_number}}", "{{learner_name}}", "{{learner_email}}", "{{category}}", "{{priority}}", "{{ticket_subject}}", "{{ticket_description}}"],
  ticket_reply_customer: ["{{learner_name}}", "{{ticket_number}}", "{{ticket_subject}}", "{{reply_message}}"],
};

function NotificationsAdminPage() {
  const queryClient = useQueryClient();
  const fetchData = useServerFn(getAdminNotificationData);
  const saveTemplate = useServerFn(updateNotificationTemplate);
  const saveSettings = useServerFn(updateNotificationSettings);
  const triggerTestEmail = useServerFn(sendTestEmail);
  const triggerTemplateSample = useServerFn(sendTemplateTestEmail);

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-notifications-data"],
    queryFn: () => fetchData(),
    retry: false,
  });

  // Settings form state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [adminEmail, setAdminEmail] = useState("info@ybbindia.com");
  const [fromName, setFromName] = useState("Yoova Business Broking");
  const [fromEmail, setFromEmail] = useState("info@ybbindia.com");

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [sendingSampleKey, setSendingSampleKey] = useState<string | null>(null);

  // Template editor modal state
  const [editingTemplate, setEditingTemplate] = useState<AdminNotificationTemplate | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editEnabled, setEditEnabled] = useState(true);

  // Sync loaded settings
  useEffect(() => {
    if (data?.settings) {
      setNotificationsEnabled(data.settings.notificationsEnabled);
      setAdminEmail(data.settings.adminNotificationEmail);
      setFromName(data.settings.notificationFromName);
      setFromEmail(data.settings.notificationFromEmail);
    }
  }, [data?.settings]);

  // Save Settings Mutation
  const settingsMutation = useMutation({
    mutationFn: (newSettings: {
      notificationsEnabled?: boolean;
      adminNotificationEmail?: string;
      notificationFromName?: string;
      notificationFromEmail?: string;
    }) => saveSettings({ data: newSettings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-data"] });
      toast.success("Notification settings updated successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update notification settings.");
    },
  });

  // Save Template Mutation
  const templateMutation = useMutation({
    mutationFn: (updated: { key: string; subject?: string; body?: string; isEnabled?: boolean }) =>
      saveTemplate({ data: updated }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-data"] });
      setEditingTemplate(null);
      toast.success("Template saved successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save template.");
    },
  });

  const handleOpenEdit = (template: AdminNotificationTemplate) => {
    setEditingTemplate(template);
    setEditSubject(template.subject);
    setEditBody(template.body);
    setEditEnabled(template.isEnabled);
  };

  const handleSaveEdit = () => {
    if (!editingTemplate) return;
    templateMutation.mutate({
      key: editingTemplate.key,
      subject: editSubject,
      body: editBody,
      isEnabled: editEnabled,
    });
  };

  const handleToggleTemplateFast = (template: AdminNotificationTemplate, nextVal: boolean) => {
    templateMutation.mutate({
      key: template.key,
      isEnabled: nextVal,
    });
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailAddress || !testEmailAddress.includes("@")) {
      toast.error("Please enter a valid email address for testing.");
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await triggerTestEmail({
        data: {
          recipientEmail: testEmailAddress.trim(),
        },
      });

      if (res.status === "simulated") {
        toast.info("Test logged in Simulation Mode: RESEND_API_KEY is not yet added to .env.");
      } else {
        toast.success(`Test email sent successfully to ${testEmailAddress}!`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-data"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to send test email.");
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleSendTemplateSample = async (templateKey: string) => {
    const target = testEmailAddress.trim() || adminEmail.trim() || "pranav.p@capoasis.com";
    if (!target || !target.includes("@")) {
      toast.error("Please specify a recipient email in Settings & Test tab first.");
      return;
    }

    setSendingSampleKey(templateKey);
    try {
      const res = await triggerTemplateSample({
        data: {
          templateKey,
          recipientEmail: target,
        },
      });

      if (res.status === "simulated") {
        toast.info(`Sample for "${templateKey}" logged in Simulation Mode.`);
      } else {
        toast.success(`Sample email for "${templateKey}" sent to ${target}!`);
      }
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-data"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to send sample email.");
    } finally {
      setSendingSampleKey(null);
    }
  };

  if (isLoading) {
    return (
      <AppShell title="Notification Automations">
        <div className="flex h-[50vh] flex-col items-center justify-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading notification automations…</p>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell title="Notification Automations">
        <div className="mx-auto max-w-4xl py-12">
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center">
            <ShieldAlert className="mx-auto size-10 text-destructive" />
            <h3 className="mt-3 text-lg font-semibold text-destructive">Failed to load automations</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Access restricted to administrators."}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  const customerTemplates = data.templates.filter((t) => !t.key.includes("_admin"));
  const adminTemplates = data.templates.filter((t) => t.key.includes("_admin"));
  const activeCount = data.templates.filter((t) => t.isEnabled).length;

  return (
    <AppShell title="Notification Automations">
      <div className="mx-auto max-w-6xl space-y-8 pb-16">
        {/* Page Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Notification Automations
              </h1>
              <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-xs">
                Resend Engine
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Automated transactional emails for learners and internal alert routing for the YBB team.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-1.5 self-start sm:self-auto"
          >
            <RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Top Metric & Status Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Provider Status */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email Provider
              </CardTitle>
              <Mail className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {data.isApiKeyConfigured ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" />
                  <div>
                    <div className="font-semibold text-emerald-700">Resend Active</div>
                    <p className="text-xs text-muted-foreground">API key verified</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AlertCircle className="size-5 text-amber-500" />
                  <div>
                    <div className="font-semibold text-amber-600">Simulation Mode</div>
                    <p className="text-xs text-muted-foreground">Key not in .env (logs only)</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Master Switch */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Master Switch
              </CardTitle>
              <Sliders className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </div>
                <p className="text-xs text-muted-foreground">Global dispatch status</p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(checked) => {
                  setNotificationsEnabled(checked);
                  settingsMutation.mutate({ notificationsEnabled: checked });
                }}
              />
            </CardContent>
          </Card>

          {/* Active Automations Count */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Active Triggers
              </CardTitle>
              <Bell className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {activeCount} <span className="text-sm font-normal text-muted-foreground">/ {data.templates.length}</span>
              </div>
              <p className="text-xs text-muted-foreground">Templates ready to fire</p>
            </CardContent>
          </Card>

          {/* Admin Alert Email */}
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Admin Alert Inbox
              </CardTitle>
              <Building className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="truncate font-semibold text-foreground" title={adminEmail}>
                {adminEmail || "Not set"}
              </div>
              <p className="text-xs text-muted-foreground">Receives internal sales & reviews</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabbed Navigation */}
        <Tabs defaultValue="templates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="settings">Settings & Test</TabsTrigger>
            <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          </TabsList>

          {/* ══════════════ TAB 1: TEMPLATES ══════════════ */}
          <TabsContent value="templates" className="space-y-8">
            {/* Customer Automations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserCheck className="size-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Customer Automations (Learners)</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {customerTemplates.map((template) => (
                  <Card key={template.key} className="border-border transition-all hover:border-border/80">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold">{template.label}</CardTitle>
                          <code className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded mt-1 inline-block">
                            {template.key}
                          </code>
                        </div>
                        <Switch
                          checked={template.isEnabled}
                          onCheckedChange={(checked) => handleToggleTemplateFast(template, checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{template.subject}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <Badge
                          variant={template.isEnabled ? "default" : "secondary"}
                          className="text-[11px]"
                        >
                          {template.isEnabled ? "Active" : "Paused"}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={sendingSampleKey === template.key}
                            onClick={() => handleSendTemplateSample(template.key)}
                            className="h-8 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            title="Sends a realistic sample test email"
                          >
                            {sendingSampleKey === template.key ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Send className="size-3" />
                            )}
                            Send Sample
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(template)}
                            className="h-8 text-xs flex items-center gap-1.5"
                          >
                            <Edit3 className="size-3" />
                            Edit Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Admin Internal Alerts */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="size-5 text-accent" />
                <h2 className="text-lg font-semibold text-foreground">Internal Alerts (YBB Team)</h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {adminTemplates.map((template) => (
                  <Card key={template.key} className="border-border transition-all hover:border-border/80">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base font-semibold">{template.label}</CardTitle>
                          <code className="text-[11px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded mt-1 inline-block">
                            {template.key}
                          </code>
                        </div>
                        <Switch
                          checked={template.isEnabled}
                          onCheckedChange={(checked) => handleToggleTemplateFast(template, checked)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground">Subject:</span>
                        <p className="text-sm font-medium text-foreground line-clamp-1">{template.subject}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <Badge
                          variant={template.isEnabled ? "default" : "secondary"}
                          className="text-[11px]"
                        >
                          {template.isEnabled ? "Active" : "Paused"}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={sendingSampleKey === template.key}
                            onClick={() => handleSendTemplateSample(template.key)}
                            className="h-8 text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                            title="Sends a realistic sample test email"
                          >
                            {sendingSampleKey === template.key ? (
                              <Loader2 className="size-3 animate-spin" />
                            ) : (
                              <Send className="size-3" />
                            )}
                            Send Sample
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(template)}
                            className="h-8 text-xs flex items-center gap-1.5"
                          >
                            <Edit3 className="size-3" />
                            Edit Template
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ══════════════ TAB 2: SETTINGS & TEST ══════════════ */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Configuration Form */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Sender & Routing Settings</CardTitle>
                  <CardDescription>
                    Configure sender identity and destination email for automated team alerts.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Admin Alert Destination Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="info@ybbindia.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Where admin alerts (new sales, assignment submissions, support tickets) are sent.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from-name">Sender Display Name</Label>
                    <Input
                      id="from-name"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="Yoova Business Broking"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="from-email">Sender Email Address</Label>
                    <Input
                      id="from-email"
                      type="email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="info@ybbindia.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Must be a domain verified in your Resend account, or <code>onboarding@resend.dev</code> for initial testing.
                    </p>
                  </div>

                  <Button
                    onClick={() =>
                      settingsMutation.mutate({
                        adminNotificationEmail: adminEmail,
                        notificationFromName: fromName,
                        notificationFromEmail: fromEmail,
                      })
                    }
                    disabled={settingsMutation.isPending}
                    className="w-full mt-2"
                  >
                    {settingsMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Save Settings
                  </Button>
                </CardContent>
              </Card>

              {/* Live Test Tool */}
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Test Email Delivery</CardTitle>
                  <CardDescription>
                    Send an immediate test notification to verify deliverability and email rendering.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSendTest} className="space-y-4">
                    <div className="rounded-lg bg-secondary/50 p-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <Info className="size-4 text-primary" />
                        <span>How testing works:</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        If <code>RESEND_API_KEY</code> is present in your environment, an email is dispatched via Resend. If not, it simulates and logs to the activity history below.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="test-recipient">Recipient Email</Label>
                      <Input
                        id="test-recipient"
                        type="email"
                        value={testEmailAddress}
                        onChange={(e) => setTestEmailAddress(e.target.value)}
                        placeholder="yourname@gmail.com"
                        required
                      />
                    </div>

                    <Button type="submit" disabled={isSendingTest} className="w-full">
                      {isSendingTest ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Sending Test Email…
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 size-4" />
                          Dispatch Test Notification
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ══════════════ TAB 3: ACTIVITY LOGS ══════════════ */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Notification Delivery Audit Trail</CardTitle>
                    <CardDescription>
                      Recent automated notifications dispatched or simulated across the platform.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Last 50 Events
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {data.recentLogs.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    <Clock className="mx-auto size-8 text-muted-foreground/40 mb-2" />
                    No notifications have been recorded yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="border-b border-border bg-secondary/30 text-muted-foreground">
                        <tr>
                          <th className="py-2.5 px-3 font-semibold">Status</th>
                          <th className="py-2.5 px-3 font-semibold">Recipient</th>
                          <th className="py-2.5 px-3 font-semibold">Type</th>
                          <th className="py-2.5 px-3 font-semibold">Subject</th>
                          <th className="py-2.5 px-3 font-semibold">Template Key</th>
                          <th className="py-2.5 px-3 font-semibold">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {data.recentLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-secondary/20">
                            <td className="py-3 px-3 whitespace-nowrap">
                              {log.status === "sent" ? (
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">
                                  Sent
                                </Badge>
                              ) : log.status === "simulated" ? (
                                <Badge className="bg-sky-500/10 text-sky-600 border-sky-500/20 text-[10px]">
                                  Simulated
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px]">
                                  Failed
                                </Badge>
                              )}
                            </td>
                            <td className="py-3 px-3 font-medium text-foreground max-w-[180px] truncate">
                              {log.recipientEmail}
                            </td>
                            <td className="py-3 px-3 text-muted-foreground capitalize">
                              {log.recipientType}
                            </td>
                            <td className="py-3 px-3 text-foreground max-w-[240px] truncate" title={log.subject}>
                              {log.subject}
                            </td>
                            <td className="py-3 px-3">
                              <code className="text-[10px] bg-secondary px-1 py-0.5 rounded">
                                {log.templateKey}
                              </code>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground whitespace-nowrap">
                              {new Date(log.createdAt).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* ══════════════ EDIT TEMPLATE MODAL ══════════════ */}
        <Dialog open={Boolean(editingTemplate)} onOpenChange={(open) => !open && setEditingTemplate(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span>Edit Template</span>
                <Badge variant="outline" className="text-xs">
                  {editingTemplate?.key}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Customize the email subject and body. Changes take effect on the very next automated trigger.
              </DialogDescription>
            </DialogHeader>

            {editingTemplate && (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="text-sm font-semibold">Enable Automation</div>
                    <div className="text-xs text-muted-foreground">
                      When disabled, triggers for this event will be safely skipped.
                    </div>
                  </div>
                  <Switch checked={editEnabled} onCheckedChange={setEditEnabled} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-subject">Email Subject</Label>
                  <Input
                    id="template-subject"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="template-body">Email Body (Plain Text with Paragraphs)</Label>
                    <span className="text-[11px] text-muted-foreground">Double newline creates paragraph</span>
                  </div>
                  <Textarea
                    id="template-body"
                    rows={8}
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    className="font-mono text-xs leading-relaxed"
                  />
                </div>

                {/* Placeholder Chips */}
                <div className="space-y-1.5 rounded-lg bg-secondary/50 p-3">
                  <div className="text-xs font-semibold text-foreground">Available Variables:</div>
                  <div className="flex flex-wrap gap-1.5">
                    {(TEMPLATE_PLACEHOLDERS[editingTemplate.key] || ["{{learner_name}}", "{{programme_name}}"]).map(
                      (tag) => (
                        <code
                          key={tag}
                          onClick={() => setEditBody((prev) => prev + " " + tag)}
                          className="cursor-pointer rounded bg-background px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                          title="Click to insert"
                        >
                          {tag}
                        </code>
                      ),
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Click any tag above to insert it into the message body.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <Button
                variant="outline"
                type="button"
                disabled={!editingTemplate || sendingSampleKey === editingTemplate.key}
                onClick={() => editingTemplate && handleSendTemplateSample(editingTemplate.key)}
                className="flex items-center gap-1.5 self-start sm:self-auto text-xs"
              >
                {editingTemplate && sendingSampleKey === editingTemplate.key ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Send className="size-3.5" />
                )}
                Send Sample Test
              </Button>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={templateMutation.isPending}>
                  {templateMutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                  Save Template Changes
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
