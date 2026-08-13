import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { SettingsMap, SettingValue } from "@/domain/settings";

function serverPublicClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

/** Public, non-sensitive settings used by the marketing site and checkout page. */
export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverPublicClient();
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .eq("is_public", true);

  if (error) {
    console.error("[settings] public read failed", error.message);
    return {} as SettingsMap;
  }

  const map: SettingsMap = {};
  for (const row of data ?? []) map[row.key] = row.value as SettingValue;
  return map;
});

/** Public verification of an ABB certificate. Returns limited information only. */
export const verifyCertificate = createServerFn({ method: "GET" })
  .inputValidator((data: { abbId: string }) => ({ abbId: String(data.abbId ?? "").trim() }))
  .handler(async ({ data }) => {
    if (!data.abbId) return { found: false as const };
    const supabase = serverPublicClient();
    const { data: rows, error } = await supabase.rpc("verify_certificate", {
      _abb_id: data.abbId,
    });
    if (error) {
      console.error("[verify] failed", error.message);
      return { found: false as const };
    }
    const record = rows?.[0];
    if (!record) return { found: false as const };
    return {
      found: true as const,
      abbId: record.abb_id,
      learnerName: record.learner_name,
      programmeName: record.programme_name,
      issuedAt: record.issued_at,
      status: record.status,
    };
  });

const FALLBACK_LEGAL_DOCS: Record<string, { slug: string; title: string; version: string; body: string; effective_date: string }> = {
  terms: {
    slug: "terms",
    title: "Terms of Use",
    version: "1.0",
    effective_date: "2026-08-13",
    body: `These Terms of Use (“Terms”) govern your access to and use of the website, learning platform, certification programme, videos, workbook, assessments, examinations and related services (collectively, the “Services”) offered by Yoova Business Broking Pvt Ltd (“YBB”, “we”, “us”, “our”).

By creating an account, purchasing a course, accessing any course material or using our Services, you agree to these Terms.

### 1. About Us
Yoova Business Broking Pvt Ltd
E503, Samraat Tropicano, Serene Meadows,
Gangapur Road, Nashik – 422013, Maharashtra, India
Email: info@ybbindia.com
Website: ybbindia.com

### 2. Eligibility
You must be legally capable of entering into a binding agreement under applicable law to purchase or use paid Services. If you are under 18 years of age, you may use the Services only with the consent and supervision of a parent or legal guardian.

### 3. Course Access
Upon successful payment and activation, you will receive a limited, personal, non-transferable and revocable right to access the purchased course.

Course access is for the registered learner only. You must not:
• Share your login credentials with any other person;
• Copy, record, download, distribute or resell course content unless expressly permitted;
• Upload course material to social media, messaging groups, file-sharing sites or third-party platforms;
• Use course content to create or sell a competing training programme;
• Attempt to bypass platform controls, examination rules or access restrictions.

YBB may suspend or terminate access where misuse, unauthorised sharing, fraud or breach of these Terms is identified.

### 4. Educational Purpose Only
The ABB Certification Programme is an educational and professional-development programme. It does not provide legal, tax, accounting, investment, financial, regulatory or transaction-specific professional advice.

Business broking, valuation, negotiations and transaction execution involve commercial and legal risks. Learners must obtain advice from appropriately qualified professionals before acting on any legal, tax, financial or transaction matter.

### 5. No Guarantee of Income, Deals or Employment
YBB does not guarantee:
• Employment, placement or business opportunities;
• Income, commissions, deal closures or client acquisition;
• Approval, licensing or recognition by any government, regulator, association or third party;
• Any particular commercial, financial or professional outcome.

Your results depend on your own effort, skill, experience, market conditions and other factors beyond YBB’s control.

### 6. Certification and Examination
Where a certification examination is offered:
• You must comply with the stated eligibility, completion and examination requirements;
• You must complete the examination independently and honestly;
• You must not use unauthorised assistance, impersonation, answer-sharing or any unfair means;
• YBB may invalidate an examination attempt, withhold a certificate or revoke a certificate where misconduct, fraud or material misrepresentation is identified.

A certificate confirms completion of YBB’s stated programme requirements. It is not a government licence, legal authorisation or guarantee of competence, employment or commercial success.

### 7. Intellectual Property
All course videos, workbooks, text, templates, branding, designs, assessments, graphics, trademarks and other materials are owned by or licensed to YBB and are protected by applicable intellectual-property laws.

No ownership rights are transferred to you. You may use the materials only for your own personal learning and professional development.

### 8. Payments
All fees must be paid through the payment methods made available on the platform. Prices, offers and course availability may be changed at YBB’s discretion before purchase.

You are responsible for providing accurate billing and account information.

### 9. Refunds
Refunds are governed by YBB’s Refund Policy, which forms part of these Terms.

### 10. Platform Availability
We aim to keep the Services available and accurate. However, we do not guarantee uninterrupted, error-free or always-available access. We may modify, update, maintain, suspend or discontinue any part of the Services where reasonably necessary.

### 11. Limitation of Liability
To the maximum extent permitted by applicable law, YBB will not be liable for any indirect, incidental, special, consequential or business losses, including lost profits, lost opportunities, loss of data or failure to close a transaction.

Nothing in these Terms excludes liability that cannot lawfully be excluded under applicable law.

### 12. Indemnity
You agree to indemnify and hold YBB harmless from claims, losses or expenses arising from your misuse of the Services, breach of these Terms, infringement of third-party rights or unlawful conduct.

### 13. Changes to These Terms
We may update these Terms from time to time. The revised version will be posted on this page with an updated Effective Date. Continued use of the Services after an update constitutes acceptance of the revised Terms.

### 14. Governing Law and Jurisdiction
These Terms are governed by the laws of India. Subject to applicable law, the courts at Nashik, Maharashtra shall have exclusive jurisdiction over disputes arising from these Terms or the Services.

### 15. Contact
For questions or concerns, email info@ybbindia.com.`,
  },
  privacy: {
    slug: "privacy",
    title: "Privacy Policy",
    version: "1.0",
    effective_date: "2026-08-13",
    body: `Yoova Business Broking Pvt Ltd (“YBB”, “we”, “us”, “our”) respects your privacy. This Privacy Policy explains how we collect, use, store, share and protect your personal data when you visit ybbindia.com or use our learning platform and related services.

### 1. Who We Are
Yoova Business Broking Pvt Ltd
E503, Samraat Tropicano, Serene Meadows,
Gangapur Road, Nashik – 422013, Maharashtra, India
Email: info@ybbindia.com

### 2. Personal Data We Collect
We may collect:
• Name, email address, mobile number and city;
• Account login details;
• Course enrolment, progress, assignment submissions and examination results;
• Payment and transaction details. Payment-card or UPI details may be processed directly by our payment gateway and not stored by YBB;
• Communications sent to us through email, forms, support requests or feedback;
• Device, browser, IP address, cookies and website-usage information;
• Information you voluntarily provide in assignments or learner submissions.

Please do not include confidential client information, sensitive financial details or third-party personal data in assignments unless you are authorised to do so and it is necessary.

### 3. Why We Use Your Data
We use personal data to:
• Create and manage your learner account;
• Process enrolments and payments;
• Deliver course content, workbooks, assessments and certification services;
• Track course progress and examination outcomes;
• Respond to support requests and communicate important service updates;
• Prevent fraud, misuse, cheating and unauthorised account sharing;
• Improve our website, platform and learner experience;
• Comply with legal, accounting and regulatory obligations;
• Send programme updates or marketing communications where you have consented or where permitted by law.

### 4. Consent and Choices
Where consent is required, we will request it clearly. You may withdraw consent for optional communications, such as marketing emails, by using the unsubscribe link or emailing us at info@ybbindia.com.

Withdrawal of consent will not affect processing already carried out lawfully, or processing needed to provide an active course, complete a transaction, prevent fraud or meet legal obligations.

### 5. Sharing of Data
We may share data only as reasonably necessary with:
• Learning-management-system, hosting, email, analytics and customer-support providers;
• Payment gateways and payment-processing partners;
• Professional advisers, auditors or service providers;
• Government authorities, regulators or law-enforcement agencies where required by law;
• A successor organisation in the event of a merger, acquisition or restructuring.

We do not sell your personal data.

### 6. Cookies and Analytics
We may use cookies and similar technologies to keep you signed in, remember preferences, analyse website usage and improve our Services.

You may control cookies through your browser settings. Disabling certain cookies may affect platform functionality.

### 7. Data Security
We use reasonable organisational, technical and administrative safeguards to protect personal data. However, no online system is completely secure, and we cannot guarantee absolute security.

Please keep your password confidential and notify us immediately if you believe your account has been accessed without permission.

### 8. Data Retention
We retain personal data only for as long as reasonably required for the purposes described in this Policy, including course access, certification records, support, fraud prevention and legal or accounting obligations.

We may retain limited records after account closure where needed for compliance, dispute resolution or enforcement of our rights.

### 9. Your Rights
Subject to applicable law, you may request:
• Access to personal data we hold about you;
• Correction of inaccurate or incomplete data;
• Erasure of personal data where legally applicable;
• Withdrawal of consent;
• Grievance redressal regarding our handling of your data.

To make a request, email info@ybbindia.com with the subject line: Privacy Request.

### 10. Children
Our paid professional programme is not intended for unsupervised use by children. If a learner is under 18, a parent or legal guardian must provide consent and supervise use of the Services.

### 11. Third-Party Links
Our Services may contain links to third-party websites or tools. Their privacy practices are governed by their own policies. YBB is not responsible for third-party privacy practices.

### 12. Changes to This Policy
We may update this Privacy Policy from time to time. The revised policy will be posted on this page with a revised Effective Date.

### 13. Contact and Grievance
For privacy questions, requests or grievances, contact:
Yoova Business Broking Pvt Ltd
Email: info@ybbindia.com
Address: E503, Samraat Tropicano, Serene Meadows, Gangapur Road, Nashik – 422013, Maharashtra, India`,
  },
  refund: {
    slug: "refund",
    title: "Refund Policy",
    version: "1.0",
    effective_date: "2026-08-13",
    body: `This Refund Policy applies to all purchases of courses, certification programmes, digital workbooks, assessments and related digital learning services offered by Yoova Business Broking Pvt Ltd (“YBB”).

### 1. No Refund After Course Access Is Granted
YBB provides digital course access immediately or shortly after successful payment. Once course access, video access, workbook access, assessment access or any other digital learning material has been provided or activated, no refund, cancellation, transfer or exchange will be permitted.

This applies whether or not the learner has watched videos, downloaded the workbook, attempted an assessment or completed the programme.

### 2. Why This Policy Applies
The programme includes instant access to proprietary digital learning material, workbooks, assessments and certification resources. Once access is provided, these resources cannot be returned.

Please review the course details, eligibility, pricing and programme requirements carefully before making payment.

### 3. Exceptional Payment Issues
A refund may be considered only where:
• You were charged more than once for the same order due to a technical payment error; or
• Payment was successfully debited but course access was not granted, and YBB is unable to provide access within a reasonable time.

For such issues, contact info@ybbindia.com within 48 hours of payment, with your registered email address, payment date, transaction ID and proof of payment.

Where a duplicate charge is verified, YBB will process the applicable refund through the original payment method.

### 4. No Refund for These Reasons
Refunds will not be issued for:
• Change of mind;
• Lack of time or failure to use the programme;
• Failure to complete lessons, assignments or examinations;
• Dissatisfaction based on personal expectations;
• Lack of business results, deal closures, employment, income or certification outcome;
• Technical issues caused by the learner’s device, internet connection, browser or incorrect email address;
• Account sharing, misuse, breach of Terms of Use or examination misconduct;
• Promotional, discounted or bundled purchases, unless required by applicable law.

### 5. Statutory Rights
Nothing in this Refund Policy limits rights that cannot legally be excluded under applicable Indian law.

### 6. Contact
For verified payment or access issues, email:
info@ybbindia.com
Yoova Business Broking Pvt Ltd
E503, Samraat Tropicano, Serene Meadows, Gangapur Road, Nashik – 422013, Maharashtra, India`,
  },
};

export const FULL_CURRICULUM_MODULES = [
  {
    id: "m1",
    position: 1,
    title: "Introduction to Business Broking",
    description: "Overview of business broking, transaction lifecycle, market mapping, and deal structuring options.",
    lessons: [
      { id: "l1", position: 1, title: "Spot One Saleable Business", lessonNumber: 1 },
      { id: "l2", position: 2, title: "Build the Transaction Journey", lessonNumber: 2 },
      { id: "l3", position: 3, title: "Create a Mini Market Map", lessonNumber: 3 },
      { id: "l4", position: 4, title: "Match the Transaction Type", lessonNumber: 4 },
    ],
  },
  {
    id: "m2",
    position: 2,
    title: "Foundations of Business Ownership",
    description: "Business model classification, SME vs startup vs corporate analysis, lifecycle assessment, and seller motivations.",
    lessons: [
      { id: "l5", position: 1, title: "Classify Three Business Models", lessonNumber: 5 },
      { id: "l6", position: 2, title: "Compare an SME, Startup and Corporate", lessonNumber: 6 },
      { id: "l7", position: 3, title: "Identify a Business Life-Cycle Stage", lessonNumber: 7 },
      { id: "l8", position: 4, title: "Understand One Seller's Motivation", lessonNumber: 8 },
    ],
  },
  {
    id: "m3",
    position: 3,
    title: "Business Broker Ethics & Professional Standards",
    description: "Ethical decision-making, confidentiality management, conflict resolution, and seller discovery conversations.",
    lessons: [
      { id: "l9", position: 1, title: "Make Two Ethical Decisions", lessonNumber: 9 },
      { id: "l10", position: 2, title: "Plan Confidential Information Release", lessonNumber: 10 },
      { id: "l11", position: 3, title: "Resolve Two Conflicts of Interest", lessonNumber: 11 },
      { id: "l12", position: 4, title: "Run a Five-Minute Discovery Conversation", lessonNumber: 12 },
    ],
  },
  {
    id: "m4",
    position: 4,
    title: "Finding Business Sale Opportunities",
    description: "Prospecting strategies, networking maps, referral partner relationships, and seller snapshots.",
    lessons: [
      { id: "l13", position: 1, title: "Start a Five-Prospect List", lessonNumber: 13 },
      { id: "l14", position: 2, title: "Create a Five-Contact Network Map", lessonNumber: 14 },
      { id: "l15", position: 3, title: "Plan Three Referral Relationships", lessonNumber: 15 },
      { id: "l16", position: 4, title: "Prepare a Seller Snapshot", lessonNumber: 16 },
    ],
  },
  {
    id: "m5",
    position: 5,
    title: "Understanding Buyers",
    description: "Buyer segmentation, investor mindset, buyer qualification frameworks, and expectation management.",
    lessons: [
      { id: "l17", position: 1, title: "Match Four Buyer Types", lessonNumber: 17 },
      { id: "l18", position: 2, title: "Assess One Business Like an Investor", lessonNumber: 18 },
      { id: "l19", position: 3, title: "Qualify Two Buyers", lessonNumber: 19 },
      { id: "l20", position: 4, title: "Create a Six-Point Buyer Brief", lessonNumber: 20 },
    ],
  },
  {
    id: "m6",
    position: 6,
    title: "Business Valuation Fundamentals",
    description: "Valuation drivers, Net Asset Value, EBITDA multiples, market ranges, SDE adjustments, and industry metrics.",
    lessons: [
      { id: "l21", position: 1, title: "Rate Five Valuation Drivers", lessonNumber: 21 },
      { id: "l22", position: 2, title: "Calculate Net Asset Value", lessonNumber: 22 },
      { id: "l23", position: 3, title: "Apply Three EBITDA Multiples", lessonNumber: 23 },
      { id: "l24", position: 4, title: "Estimate a Market-Based Value Range", lessonNumber: 24 },
      { id: "l25", position: 5, title: "Calculate EBITDA and SDE", lessonNumber: 25 },
      { id: "l26", position: 6, title: "Create a One-Industry Valuation Note", lessonNumber: 26 },
      { id: "l27", position: 7, title: "Respond to Two Seller Expectations", lessonNumber: 27 },
    ],
  },
  {
    id: "m7",
    position: 7,
    title: "Creating Business Sale Mandates",
    description: "Exclusive vs non-exclusive mandates, pitch decks, mandate term sheets, onboarding readiness, CBP, and teasers.",
    lessons: [
      { id: "l28", position: 1, title: "Compare Exclusive and Non-Exclusive Mandates", lessonNumber: 28 },
      { id: "l29", position: 2, title: "Give a 60-Second Exclusive-Mandate Pitch", lessonNumber: 29 },
      { id: "l30", position: 3, title: "Complete the Key Mandate Terms", lessonNumber: 30 },
      { id: "l31", position: 4, title: "Check Seller Readiness", lessonNumber: 31 },
      { id: "l32", position: 5, title: "Create a One-Page Mini CBP", lessonNumber: 32 },
      { id: "l33", position: 6, title: "Write a Six-Line Anonymous Teaser", lessonNumber: 33 },
      { id: "l34", position: 7, title: "Make a Five-Step Confidentiality Checklist", lessonNumber: 34 },
    ],
  },
  {
    id: "m8",
    position: 8,
    title: "Buyer Acquisition & Deal Sourcing",
    description: "Buyer databases, professional referral networks, strategic buyers, investor profiles, discovery, and objection handling.",
    lessons: [
      { id: "l35", position: 1, title: "Create Three Buyer Profiles", lessonNumber: 35 },
      { id: "l36", position: 2, title: "Plan Five Referral Contacts", lessonNumber: 36 },
      { id: "l37", position: 3, title: "Identify Three Strategic Buyer Types", lessonNumber: 37 },
      { id: "l38", position: 4, title: "Build Three Investor Profiles", lessonNumber: 38 },
      { id: "l39", position: 5, title: "Complete One Buyer Qualification", lessonNumber: 39 },
      { id: "l40", position: 6, title: "Prepare and Use Six Discovery Questions", lessonNumber: 40 },
      { id: "l41", position: 7, title: "Handle Two Buyer Objections", lessonNumber: 41 },
      { id: "l42", position: 8, title: "Score Three Buyer Matches", lessonNumber: 42 },
    ],
  },
  {
    id: "m9",
    position: 9,
    title: "Offer Management & Negotiation",
    description: "Evaluating purchase offers, bridging valuation gaps, creative deal structures (cash, earn-outs, vendor finance).",
    lessons: [
      { id: "l43", position: 1, title: "Compare Two Offers", lessonNumber: 43 },
      { id: "l44", position: 2, title: "Bridge an ₹8-10 Crore Price Gap", lessonNumber: 44 },
      { id: "l45", position: 3, title: "Design Two Deal Structures", lessonNumber: 45 },
    ],
  },
  {
    id: "m10",
    position: 10,
    title: "Due Diligence & Transaction Execution",
    description: "Due diligence checklists, virtual data room organization, SPA vs APA selection, and transaction closing steps.",
    lessons: [
      { id: "l46", position: 1, title: "Prepare an Eight-Document Due Diligence List", lessonNumber: 46 },
      { id: "l47", position: 2, title: "Build a Six-Folder Data Room", lessonNumber: 47 },
      { id: "l48", position: 3, title: "Choose Between an SPA and APA", lessonNumber: 48 },
      { id: "l49", position: 4, title: "Prepare an Eight-Step Closing Checklist", lessonNumber: 49 },
    ],
  },
  {
    id: "m11",
    position: 11,
    title: "Ethics, Professional Standards & Career Development",
    description: "Professional charter, ongoing compliance, career development, and practice building for certified brokers.",
    lessons: [
      { id: "l50", position: 1, title: "Write Your Five-Point ABB Charter", lessonNumber: 50 },
    ],
  },
];

/** Published legal document by slug, latest effective version. */
export const getLegalDocument = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => ({ slug: String(data.slug ?? "") }))
  .handler(async ({ data }) => {
    try {
      const supabase = serverPublicClient();
      const { data: rows, error } = await supabase
        .from("legal_documents")
        .select("slug, title, version, body, effective_date")
        .eq("slug", data.slug)
        .eq("is_published", true)
        .order("effective_date", { ascending: false })
        .limit(1);
      if (!error && rows?.[0]) {
        return rows[0];
      }
    } catch (e) {
      console.warn("[legal] DB lookup failed, falling back to static policy", e);
    }
    return FALLBACK_LEGAL_DOCS[data.slug] ?? null;
  });

/** Published legal documents list for the public legal index. */
export const listLegalDocuments = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const supabase = serverPublicClient();
    const { data, error } = await supabase
      .from("legal_documents")
      .select("slug, title, version, effective_date")
      .eq("is_published", true)
      .order("title", { ascending: true });
    if (!error && data?.length) {
      const seen = new Set<string>();
      return data.filter((row) => {
        if (seen.has(row.slug)) return false;
        seen.add(row.slug);
        return true;
      });
    }
  } catch (e) {
    console.warn("[legal] DB list failed, falling back to static list", e);
  }
  return Object.values(FALLBACK_LEGAL_DOCS).map((doc) => ({
    slug: doc.slug,
    title: doc.title,
    version: doc.version,
    effective_date: doc.effective_date,
  }));
});

/** Published course outline for the public programme page. Always returns full 11 modules and 50 lessons. */
export const getPublicCourseOutline = createServerFn({ method: "GET" }).handler(async () => {
  const defaultCourse = {
    id: "abb-course-1",
    title: "Authorised Business Broker (ABB) Certification Programme",
    slug: "abb-certification-programme",
    subtitle: "Master business broking, valuation, deal structuring, and transaction execution in India.",
    description:
      "A comprehensive professional certification covering the entire transaction lifecycle across 11 modules and 50 practical lessons.",
  };

  return { course: defaultCourse, modules: FULL_CURRICULUM_MODULES };
});
