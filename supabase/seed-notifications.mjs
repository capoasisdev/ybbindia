import fs from "fs";

const env = fs.readFileSync(".env", "utf8").split("\n").reduce((acc, line) => {
  const [k, ...v] = line.split("=");
  if (k && v.length) acc[k.trim()] = v.join("=").trim().replace(/^["'\''"]|["'\''"]$/g, "");
  return acc;
}, {});

const templates = [
  {
    key: "order_confirmed_customer",
    label: "Order & Enrolment Confirmation (Customer)",
    subject: "Welcome to YBB! Your Enrolment is Confirmed (Order #{{order_id}})",
    body: `Dear {{learner_name}},

Congratulations and welcome! Your payment of {{amount}} for the {{programme_name}} has been successfully processed.

Enrolment & Order Details:
• Order ID: {{order_id}}
• Invoice Number: {{invoice_number}}
• Validity: {{valid_until}}

Your course curriculum and learning modules are now completely unlocked. You can sign in anytime and begin your journey.

Warm regards,
Yoova Business Broking Team
https://www.ybbindia.com`,
    is_enabled: true,
  },
  {
    key: "order_created_admin",
    label: "New Course Enrolment Alert (Admin)",
    subject: "New Enrolment: {{learner_name}} has enrolled ({{amount}})",
    body: `Hello Team,

A new learner has successfully enrolled in the {{programme_name}}.

Learner Details:
• Name: {{learner_name}}
• Email: {{learner_email}}
• Mobile: {{learner_mobile}}
• Order ID: {{order_id}}
• Amount Paid: {{amount}}
• Invoice: {{invoice_number}}
• Date: {{date}}

You can manage this learner in the Admin Portal under 'Enrolled Learners'.

YBB Automated Alerts`,
    is_enabled: true,
  },
  {
    key: "assignment_submitted_customer",
    label: "Assignment Submission Received (Customer)",
    subject: "Assignment Received: {{assignment_title}}",
    body: `Dear {{learner_name}},

We have received your assignment submission for "{{assignment_title}}".

Our instructors will review your submission and provide feedback. You will receive an automated notification as soon as the review is complete.

Best regards,
Yoova Business Broking Team`,
    is_enabled: true,
  },
  {
    key: "assignment_submitted_admin",
    label: "Assignment Pending Review Alert (Admin)",
    subject: "Action Required: {{learner_name}} submitted {{assignment_title}}",
    body: `Hello Review Team,

A new assignment has been submitted and is waiting for evaluation.

Submission Details:
• Learner: {{learner_name}} ({{learner_email}})
• Assignment: {{assignment_title}}
• Lesson: {{lesson_title}}
• Submitted At: {{submitted_at}}

Please log in to Admin -> Submission Reviews to evaluate this assignment.

YBB Automated Alerts`,
    is_enabled: true,
  },
  {
    key: "assignment_reviewed_customer",
    label: "Assignment Review Decision (Customer)",
    subject: "Assignment Update: {{assignment_title}} has been {{review_status}}",
    body: `Dear {{learner_name}},

Your instructor has reviewed your submission for "{{assignment_title}}".

Result: {{review_status}}

Instructor Feedback:
{{reviewer_notes}}

Log in to your dashboard to review your progress and continue with the curriculum.

Best regards,
Yoova Business Broking Team`,
    is_enabled: true,
  },
  {
    key: "certificate_issued_customer",
    label: "Certificate Issued Notification (Customer)",
    subject: "Congratulations! Your ABB Certification is Approved (ABB ID: {{abb_id}})",
    body: `Dear {{learner_name}},

Congratulations on completing all programme requirements and passing the examination!

Your official Authorised Business Broker (ABB) Certificate has been approved and issued.

• Official ABB ID: {{abb_id}}
• Issue Date: {{issue_date}}

You can now view, download, or share your digital verified certificate directly from your learner dashboard.

Warm regards,
Yoova Business Broking Team`,
    is_enabled: true,
  },
  {
    key: "certificate_issued_admin",
    label: "Certificate Issued Alert (Admin)",
    subject: "New Certified Broker: {{learner_name}} (ABB ID: {{abb_id}})",
    body: `Hello Team,

A new Authorised Business Broker certificate has been issued.

Details:
• Learner: {{learner_name}} ({{learner_email}})
• ABB ID: {{abb_id}}
• Issued At: {{issue_date}}

The record is accessible under Admin -> Certificate Approvals.

YBB Automated Alerts`,
    is_enabled: true,
  },
  {
    key: "ticket_created_admin",
    label: "New Support Ticket Alert (Admin)",
    subject: "Support Ticket #{{ticket_number}}: {{ticket_subject}}",
    body: `Hello Support Team,

A learner has created a new support ticket.

Ticket Details:
• Ticket Number: {{ticket_number}}
• Learner: {{learner_name}} ({{learner_email}})
• Category: {{category}}
• Priority: {{priority}}
• Subject: {{ticket_subject}}

Description:
{{ticket_description}}

Please check the support inbox to assist the learner.

YBB Automated Alerts`,
    is_enabled: true,
  },
  {
    key: "ticket_reply_customer",
    label: "Support Ticket Reply (Customer)",
    subject: "Response on Support Ticket #{{ticket_number}}",
    body: `Dear {{learner_name}},

Our team has replied to your support ticket #{{ticket_number}} ({{ticket_subject}}).

Staff Response:
{{reply_message}}

You can reply to this message anytime by navigating to Support in your learner dashboard.

Best regards,
Yoova Business Broking Team`,
    is_enabled: true,
  },
];

async function seed() {
  console.log(`Seeding ${templates.length} notification templates...`);
  for (const t of templates) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/notification_templates`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify(t),
    });
    if (!res.ok) {
      console.error(`Failed to upsert ${t.key}:`, res.status, await res.text());
    } else {
      console.log(`Upserted template: ${t.key}`);
    }
  }

  // Also seed default settings for notifications if missing
  const defaultSettings = [
    { key: "notifications_enabled", value: true },
    { key: "admin_notification_email", value: "info@ybbindia.com" },
    { key: "notification_from_name", value: "Yoova Business Broking" },
    { key: "notification_from_email", value: "info@ybbindia.com" },
  ];

  for (const s of defaultSettings) {
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/settings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        Prefer: "resolution=ignore-duplicates",
      },
      body: JSON.stringify(s),
    });
    console.log(`Setting check ${s.key}:`, res.status);
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);

