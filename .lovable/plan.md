# YBB | ABB Learning & Certification Platform — Implementation Plan

Source of truth: PRD v1.0. Confirmed decisions: Razorpay payments, video in private Lovable Cloud storage, real content supplied by YBB, and the launch defaults below.

## Locked configurable defaults (all editable in Admin → Settings)

Access 365 days from enrolment · lesson complete at 90% watched · sequential access · exam 50 random questions / 60 min / 70% pass / 3 attempts / 24h wait · manual certification approval · price ₹15,000 + 18% GST · ABB ID `YBB-ABB-YYYY-NNNN` · certificate no expiry.

## 1. Architecture

TanStack Start (React 19, SSR) + Lovable Cloud (Postgres, Auth, private Storage). No fake data anywhere; every screen reads real tables.

- **Public site** — SSR routes for SEO: programme page, register, login, forgot/reset password, checkout, payment result, certificate verification, legal document viewer.
- **Learner app** — under `_authenticated/`: dashboard, profile, course player, resources, assignments, exam, results, certificate, legal, support.
- **Reviewer console** — submission queue, submission detail, decision history.
- **Admin console** — dashboard, learners, orders/payments, course/content, resources, assignments, question bank, exam settings, certificates, legal versions, support, reports, audit log, system settings.
- **Business logic** — pure, testable modules in `src/domain/` (eligibility, progress, exam scoring, GST/invoice, ABB ID, RBAC). Server functions orchestrate only.
- **Security** — every rule enforced server-side. RLS on all tables, `has_role()` security-definer, roles in a separate `user_roles` table. Sequential lesson rules, exam eligibility and attempt limits validated server-side so URLs can't bypass them. Signed short-lived URLs for video and learner files. Audit log on payment, override, result change, certification and legal acceptance.

### Folder structure

```text
src/
  routes/            public, _authenticated/{learner,reviewer,admin}, api/public/*
  domain/            eligibility, progress, exam, invoice, abb-id, rbac (pure logic)
  lib/*.functions.ts server functions (RPC)
  lib/*.server.ts    server-only helpers
  components/        ui/, course/, admin/, forms/
  hooks/  types/
```

### Routes (abridged)

`/` `/register` `/login` `/forgot-password` `/reset-password` `/checkout` `/payment/:status` `/verify/:abbId` `/legal/:slug`
`/dashboard` `/profile` `/course` `/course/:lessonId` `/resources` `/assignments` `/assignments/:id` `/exam` `/exam/attempt` `/results` `/certificate` `/support` `/support/:ticketId`
`/reviewer` `/reviewer/:submissionId`
`/admin/...` (14 screens above)
`api/public/webhooks/razorpay` (signature-verified, idempotent)

### Database schema (Lovable Cloud)

`user_roles` (visitor/learner/reviewer/support_admin/content_admin/super_admin) · `learner_profiles` (contact, billing, GST, certificate_name, certificate_name_locked) · `profile_field_config` · `courses` `modules` `lessons` (order, publish, prerequisite, completion rule, video_path) · `resources` (scope course/module/lesson, version, downloadable, archived) + `resource_downloads` · `orders` `payments` `invoices` (GST breakup, configurable numbering) · `discount_codes` · `enrolments` (valid_until) · `lesson_progress` (watch %, last position) · `assignments` `submissions` (versioned, status enum) `submission_reviews` · `questions` (mcq/multi/true-false, module, difficulty) `exam_config` `exam_attempts` `attempt_answers` · `certificates` (abb_id unique, status active/suspended/revoked) · `legal_documents` (versioned) `legal_acceptances` (immutable, insert-only) · `support_tickets` `ticket_messages` · `audit_logs` · `settings` (key/value, Super Admin) · `notification_templates`.
Every table gets explicit GRANTs + RLS: learners see only their own rows; reviewers see allocated submissions; admin access via `has_role()`.

### Auth & permissions

Email/password + OTP-style email verification, password reset, rate-limited endpoints. Role gates enforced in RLS and in every server function, not in the UI alone.

### State & storage

TanStack Query for all server state (loader `ensureQueryData` + `useSuspenseQuery`); local state only for form/player UI. Private buckets: `lesson-videos`, `resources`, `submissions`, `certificates`, `ticket-attachments` — all access through signed URLs after an entitlement check.

## 2. Milestones

Before each one I'll state what's being built, which PRD section it satisfies, and the files changing.

1. **Foundation & design system** — YBB brand tokens, typography, layout shells, component library. (§10 usability, §5 UI)
2. **Auth & roles** — registration, verification, login, reset, `user_roles`, RLS, route gates. (§6.1)
3. **Core schema & settings** — all tables, RLS, audit log, Admin → System Settings with the locked defaults. (§8, §6.10)
4. **Public programme page + legal versions** — SSR marketing page, versioned legal documents and acceptance capture. (§6.9)
5. **Commerce** — Razorpay checkout, orders, GST invoice generator, idempotent webhook, auto-enrolment, admin orders/refunds/manual enrolment. (§6.2)
6. **Course content admin** — modules/lessons CRUD, ordering, publish, video upload, completion & prerequisite rules, preview-as-learner. (§6.3)
7. **Course player & progress** — secure streaming, resume position, 90% auto-complete, sequential enforcement, learner dashboard with Continue Learning. (§6.3, §6.5)
8. **Resources & workbook** — scoped resources, versioning, replace-in-place, download control and counts. (§6.4)
9. **Assignments & reviewer console** — configurable assignments, versioned submissions, full status workflow, reviewer feedback, final project. (§6.6)
10. **Question bank & examination** — question CRUD/import, exam config, eligibility gate, timer + auto-submit, scoring, attempts, reattempt approval. (§6.7)
11. **Certification** — Code of Conduct, declaration, manual/auto approval, ABB ID generation, PDF certificate + QR, public verification, suspend/revoke. (§6.8)
12. **Operations & launch QA** — support tickets, admin dashboard metrics, CSV exports, email notifications, audit log viewer, full payment-to-certificate acceptance test. (§6.10, §12)

## 3. Open items I need from you

- **Razorpay keys** — I'll request `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` securely at Milestone 5. (Note: Lovable's built-in Stripe/Paddle needs no account; Razorpay is BYOK. Say the word if you'd rather switch.)
  ```dotenv
  RAZORPAY_KEY_SECRET=NvYVaaDRK7jB2WDXxcwnTnkD
  ```
  ```dotenv
  RAZORPAY_KEY_ID=rzp_live_THK4Q6Xze6ElEp
  ```
- **Content files** — module/lesson list with video files, the ABB Workbook and templates, and the exam question bank. Needed for Milestones 6–10; I'll build the admin CRUD first so nothing is blocked, and load your real content the moment it arrives.  
Module 1 - Intro.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201-%20Intro.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201-%20Intro.mp4)
  Module 1 - Lesson 1.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%201.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%201.mp4)
  Module 1 - Lesson 2.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%202.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%202.mp4)
  Module 1 - Lesson 3.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%203.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%203.mp4)
  Module 1 - Lesson 4.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%204.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%204.mp4)
  Module 2 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Introduction.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Introduction.mp4)
  Module 2 - Lesson 5.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%205.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%205.mp4)
  Module 2 - Lesson 6.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%206.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%206.mp4)
  Module 2 - Lesson 7.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%207.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%207.mp4)
  Module 3 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Introduction.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Introduction.mp4)
  Module 3 - Lesson 9.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%209.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%209.mp4)
  Module 3 - Lesson 10.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2010.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2010.mp4)
  Module 3 - Lesson 11.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2011.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2011.mp4)
  Module 3 - Lesson 12.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2012.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2012.mp4)
  Module 4 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Introduction.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Introduction.mp4)
  Module 4 - Lesson 13.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2013.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2013.mp4)
  Module 4 - Lesson 14.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2014.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2014.mp4)
  Module 4 - Lesson 15.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2015.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2015.mp4)
  Module 4 - Lesson 16.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2016%20.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2016%20.mp4)
  Module 5 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/MODULE%205%20-%20%20INTRODUCTION.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/MODULE%205%20-%20%20INTRODUCTION.mp4)
  Module 5 - Lesson 17.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2017.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2017.mp4)
  Module 5 - Lesson 18.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2018.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2018.mp4)
  Module 5 - Lesson 19.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2019.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2019.mp4)
  Module 5 - Lesson 20.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2020.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2020.mp4)
  Module 6 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Introduction%20(1).mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Introduction%20(1).mp4)
  Module 6 - Lesson 21.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2021.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2021.mp4)
  Module 6 - Lesson 22.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2022.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2022.mp4)
  Module 6 - Lesson 23.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2023.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2023.mp4)
  Module 6 - Lesson 24.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2024%20.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2024%20.mp4)
  Module 6 - Lesson 25.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2025.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2025.mp4)
  Module 6 - Lesson 26.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206-%20Lesson%2026.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206-%20Lesson%2026.mp4)
  Module 6 - Lesson 27.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2027%20.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%206%20-%20Lesson%2027%20.mp4)
  Module 7 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20Introduction.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20Introduction.mp4)
  Module 7 - Lesson 28.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2028.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2028.mp4)
  Module 7 - Lesson 29.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2029.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2029.mp4)
  Module 7 - Lesson 30.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2030.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2030.mp4)
  Module 7 - Lesson 31.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2031.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2031.mp4)
  Module 7 - Lesson 32.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2032.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2032.mp4)
  Module 7 - Lesson 33.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2033.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2033.mp4)
  Module 7 - Lesson 34.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2034.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%207%20-%20Lesson%2034.mp4)
  Module 8 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Introduction.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Introduction.mp4)
  Module 8 - Lesson 35.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2035.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2035.mp4)
  Module 8 - Lesson 36.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2036.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2036.mp4)
  Module 8 - Lesson 37.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2037.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2037.mp4)
  Module 8 - Lesson 38.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2038.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2038.mp4)
  Module 8 - Lesson 39.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2039.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2039.mp4)
  Module 8 - Lesson 40.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2040.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2040.mp4)
  Module 8 - Lesson 41.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2041.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2041.mp4)
  Module 8 - Lesson 42.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2042.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%208%20-%20Lesson%2042.mp4)
  Module 9 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%209%20-%20Introduction.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%209%20-%20Introduction.mp4)
  Module 9 - Lesson 43.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%209%20-%20Lesson%2043.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%209%20-%20Lesson%2043.mp4)
  Module 9 - Lesson 44.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%209%20-%20Lesson%2044.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%209%20-%20Lesson%2044.mp4)
  Module 9 - Lesson 45.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/MODULE%209%20-%20Lesson%2045.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/MODULE%209%20-%20Lesson%2045.mp4)  
  Module 10 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Introduction.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Introduction.mp4)
  Module 10 - Lesson 46.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Lesson%2046.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Lesson%2046.mp4)
  Module 10 - Lesson 47.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Lesson%2047.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Lesson%2047.mp4)
  Module 10 - Lesson 48.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Lesson%2048.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Lesson%2048.mp4)
  Module 10 - Lesson 49.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Lesson%2049.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2010%20-%20Lesson%2049.mp4)
  Module 11 - Introduction.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2011%20-%20Introduction.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2011%20-%20Introduction.mp4)
  Module 11 - Lesson 50.mp4
  [https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2011%20-%20Lesson%2050.mp4](https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%2011%20-%20Lesson%2050.mp4)  

- **YBB legal details** — registered name, address, GSTIN, invoice number prefix/series, authorised signatory name and signature image, logo, and the final text of purchase terms, privacy policy and the ABB Code of Conduct.
- **Compulsory assignments** — PRD §13 leaves the exact assignment list and final project to YBB; I'll ship the engine, and you configure them in admin.