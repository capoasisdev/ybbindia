-- ============ COURSE ============
CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  subtitle text,
  description text,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published courses public" ON public.courses FOR SELECT TO anon USING (is_published);
CREATE POLICY "courses readable" ON public.courses FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "courses content admin" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER courses_touch BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  position int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX modules_course_idx ON public.modules (course_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO authenticated;
GRANT SELECT ON public.modules TO anon;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published modules public" ON public.modules FOR SELECT TO anon USING (is_published);
CREATE POLICY "modules readable" ON public.modules FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "modules content admin" ON public.modules FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER modules_touch BEFORE UPDATE ON public.modules FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TYPE public.lesson_completion_mode AS ENUM ('watch_percentage','manual');

CREATE TABLE public.lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  summary text,
  video_url text,
  video_storage_path text,
  duration_seconds int NOT NULL DEFAULT 0,
  position int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  completion_mode public.lesson_completion_mode NOT NULL DEFAULT 'watch_percentage',
  completion_watch_percent int NOT NULL DEFAULT 90,
  release_at timestamptz,
  prerequisite_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lessons_module_idx ON public.lessons (module_id, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons readable" ON public.lessons FOR SELECT TO authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "lessons content admin" ON public.lessons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER lessons_touch BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ RESOURCES ============
CREATE TYPE public.resource_scope AS ENUM ('course','module','lesson');
CREATE TYPE public.resource_kind AS ENUM ('file','link');

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.resource_scope NOT NULL,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  kind public.resource_kind NOT NULL DEFAULT 'file',
  title text NOT NULL,
  description text,
  storage_path text,
  external_url text,
  file_type text,
  file_size_bytes bigint,
  version text NOT NULL DEFAULT 'v1',
  is_downloadable boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  is_workbook boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  download_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources readable" ON public.resources FOR SELECT TO authenticated USING (NOT is_archived OR public.is_staff(auth.uid()));
CREATE POLICY "resources content admin" ON public.resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER resources_touch BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.resource_downloads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.resource_downloads TO authenticated;
GRANT ALL ON public.resource_downloads TO service_role;
ALTER TABLE public.resource_downloads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "downloads own insert" ON public.resource_downloads FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "downloads readable" ON public.resource_downloads FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ============ COMMERCE ============
CREATE TYPE public.order_status AS ENUM ('created','pending','paid','failed','cancelled','refunded');

CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  percent_off int,
  amount_off_paise int,
  is_active boolean NOT NULL DEFAULT true,
  max_redemptions int,
  redemption_count int NOT NULL DEFAULT 0,
  valid_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.discount_codes TO authenticated;
GRANT ALL ON public.discount_codes TO service_role;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "discounts admin" ON public.discount_codes FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  status public.order_status NOT NULL DEFAULT 'created',
  base_amount_paise int NOT NULL,
  discount_amount_paise int NOT NULL DEFAULT 0,
  discount_code text,
  gst_rate_percent numeric(5,2) NOT NULL,
  cgst_paise int NOT NULL DEFAULT 0,
  sgst_paise int NOT NULL DEFAULT 0,
  igst_paise int NOT NULL DEFAULT 0,
  total_amount_paise int NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  billing_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  gateway text NOT NULL DEFAULT 'razorpay',
  gateway_order_id text UNIQUE,
  is_manual boolean NOT NULL DEFAULT false,
  manual_reason text,
  refund_status text,
  refund_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON public.orders (user_id, created_at DESC);
GRANT SELECT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders own or admin" ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));
CREATE TRIGGER orders_touch BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gateway text NOT NULL DEFAULT 'razorpay',
  gateway_payment_id text UNIQUE,
  gateway_signature text,
  status text NOT NULL,
  amount_paise int NOT NULL,
  method text,
  error_code text,
  error_description text,
  raw_event jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments own or admin" ON public.payments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  seller_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  buyer_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_paise int NOT NULL
);
GRANT SELECT ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices own or admin" ON public.invoices FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TABLE public.enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  source text NOT NULL DEFAULT 'purchase',
  UNIQUE (user_id, course_id)
);
GRANT SELECT ON public.enrolments TO authenticated;
GRANT ALL ON public.enrolments TO service_role;
ALTER TABLE public.enrolments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enrolments own or staff" ON public.enrolments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.is_enrolled(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrolments
    WHERE user_id = _user_id AND is_active
      AND (valid_until IS NULL OR valid_until > now())
  );
$$;
REVOKE ALL ON FUNCTION public.is_enrolled(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_enrolled(uuid) TO authenticated;

-- ============ PROGRESS ============
CREATE TABLE public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  watched_seconds int NOT NULL DEFAULT 0,
  watch_percent int NOT NULL DEFAULT 0,
  last_position_seconds int NOT NULL DEFAULT 0,
  is_complete boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
CREATE INDEX lesson_progress_user_idx ON public.lesson_progress (user_id);
GRANT SELECT, INSERT, UPDATE ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress own or staff read" ON public.lesson_progress FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

-- ============ ASSIGNMENTS ============
CREATE TYPE public.submission_status AS ENUM ('not_started','submitted','under_review','approved','resubmission_required','rejected');

CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  brief_storage_path text,
  due_days_after_enrolment int,
  allowed_file_types text[] NOT NULL DEFAULT ARRAY['pdf','docx','xlsx','pptx','jpg','png'],
  max_file_size_mb int NOT NULL DEFAULT 10,
  max_attempts int NOT NULL DEFAULT 3,
  is_compulsory boolean NOT NULL DEFAULT true,
  is_final_project boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT false,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assignments readable" ON public.assignments FOR SELECT TO authenticated
  USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "assignments content admin" ON public.assignments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER assignments_touch BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number int NOT NULL DEFAULT 1,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes bigint,
  learner_note text,
  status public.submission_status NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  is_latest boolean NOT NULL DEFAULT true,
  UNIQUE (assignment_id, user_id, attempt_number)
);
CREATE INDEX submissions_status_idx ON public.submissions (status, submitted_at);
GRANT SELECT ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "submissions own or staff" ON public.submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.submission_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision public.submission_status NOT NULL,
  feedback text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.submission_reviews TO authenticated;
GRANT ALL ON public.submission_reviews TO service_role;
ALTER TABLE public.submission_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews visible to owner or staff" ON public.submission_reviews FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.submissions s WHERE s.id = submission_id AND s.user_id = auth.uid())
  );

-- ============ EXAM ============
CREATE TYPE public.question_type AS ENUM ('mcq','multi_select','true_false');
CREATE TYPE public.attempt_status AS ENUM ('in_progress','submitted','auto_submitted','cancelled');

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  topic text,
  difficulty text NOT NULL DEFAULT 'medium',
  type public.question_type NOT NULL DEFAULT 'mcq',
  prompt text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_option_ids text[] NOT NULL DEFAULT '{}',
  marks int NOT NULL DEFAULT 1,
  explanation text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions staff only" ON public.questions FOR SELECT TO authenticated USING (public.is_staff(auth.uid()));
CREATE POLICY "questions content admin" ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin'));
CREATE TRIGGER questions_touch BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  attempt_number int NOT NULL,
  status public.attempt_status NOT NULL DEFAULT 'in_progress',
  question_count int NOT NULL,
  duration_minutes int NOT NULL,
  pass_percent int NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  score int,
  total_marks int,
  score_percent numeric(5,2),
  is_passed boolean,
  cancelled_reason text,
  question_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (user_id, course_id, attempt_number)
);
GRANT SELECT ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts own or staff" ON public.exam_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TABLE public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_ids text[] NOT NULL DEFAULT '{}',
  is_correct boolean,
  marks_awarded int NOT NULL DEFAULT 0,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempt answers own or staff" ON public.attempt_answers FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.user_id = auth.uid())
  );

CREATE TABLE public.reattempt_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by uuid NOT NULL,
  reason text NOT NULL,
  consumed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reattempt_grants TO authenticated;
GRANT ALL ON public.reattempt_grants TO service_role;
ALTER TABLE public.reattempt_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reattempts own or admin" ON public.reattempt_grants FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ============ CERTIFICATION ============
CREATE TYPE public.certificate_status AS ENUM ('active','suspended','revoked');

CREATE TABLE public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  abb_id text NOT NULL UNIQUE,
  learner_name text NOT NULL,
  programme_name text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  status public.certificate_status NOT NULL DEFAULT 'active',
  status_reason text,
  signatory_name text,
  signatory_title text,
  storage_path text,
  approved_by uuid,
  regenerated_count int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
GRANT SELECT ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certificates own or staff" ON public.certificates FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE TRIGGER certificates_touch BEFORE UPDATE ON public.certificates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.abb_id_sequence (
  year int PRIMARY KEY,
  last_number int NOT NULL DEFAULT 0
);
GRANT ALL ON public.abb_id_sequence TO service_role;
ALTER TABLE public.abb_id_sequence ENABLE ROW LEVEL SECURITY;

-- Public verification: limited fields only, via security definer function
CREATE OR REPLACE FUNCTION public.verify_certificate(_abb_id text)
RETURNS TABLE (abb_id text, learner_name text, programme_name text, issued_at timestamptz, status public.certificate_status)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.abb_id, c.learner_name, c.programme_name, c.issued_at, c.status
  FROM public.certificates c
  WHERE upper(c.abb_id) = upper(_abb_id);
$$;
GRANT EXECUTE ON FUNCTION public.verify_certificate(text) TO anon, authenticated;

-- ============ LEGAL ============
CREATE TYPE public.legal_stage AS ENUM ('registration','payment','certification');

CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  title text NOT NULL,
  version text NOT NULL,
  body text NOT NULL,
  effective_date date NOT NULL DEFAULT current_date,
  required_at_stage public.legal_stage,
  is_mandatory boolean NOT NULL DEFAULT true,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug, version)
);
GRANT SELECT, INSERT, UPDATE ON public.legal_documents TO authenticated;
GRANT SELECT ON public.legal_documents TO anon;
GRANT ALL ON public.legal_documents TO service_role;
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal published public" ON public.legal_documents FOR SELECT TO anon USING (is_published);
CREATE POLICY "legal readable" ON public.legal_documents FOR SELECT TO authenticated USING (is_published OR public.is_admin(auth.uid()));
CREATE POLICY "legal admin write" ON public.legal_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'super_admin')) WITH CHECK (public.has_role(auth.uid(),'super_admin'));

CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE RESTRICT,
  document_slug text NOT NULL,
  document_version text NOT NULL,
  stage public.legal_stage NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text
);
CREATE INDEX legal_acceptances_user_idx ON public.legal_acceptances (user_id);
GRANT SELECT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceptances own or admin" ON public.legal_acceptances FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.block_acceptance_mutation()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN RAISE EXCEPTION 'Legal acceptance records are immutable'; END; $$;
REVOKE ALL ON FUNCTION public.block_acceptance_mutation() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER legal_acceptances_immutable BEFORE UPDATE OR DELETE ON public.legal_acceptances
  FOR EACH ROW EXECUTE FUNCTION public.block_acceptance_mutation();

-- ============ SUPPORT ============
CREATE TYPE public.ticket_status AS ENUM ('open','in_progress','waiting_for_learner','resolved','closed');

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number text NOT NULL UNIQUE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'normal',
  status public.ticket_status NOT NULL DEFAULT 'open',
  owner_id uuid,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets own or staff" ON public.support_tickets FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE TRIGGER support_tickets_touch BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_staff_reply boolean NOT NULL DEFAULT false,
  body text NOT NULL,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ticket messages own or staff" ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND t.user_id = auth.uid())
  );

CREATE TABLE public.notification_templates (
  key text PRIMARY KEY,
  label text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates admin" ON public.notification_templates FOR ALL TO authenticated
  USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));