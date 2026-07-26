-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('learner','reviewer','support_admin','content_admin','super_admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('reviewer','support_admin','content_admin','super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('support_admin','content_admin','super_admin')
  );
$$;

CREATE POLICY "own roles readable" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin(auth.uid()));

-- ============ SHARED HELPERS ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ============ LEARNER PROFILES ============
CREATE TABLE public.learner_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  mobile text,
  city text,
  state text,
  profession text,
  billing_address text,
  billing_city text,
  billing_state text,
  billing_pincode text,
  gst_number text,
  photograph_path text,
  education text,
  organisation text,
  identity_proof_path text,
  certificate_name text,
  certificate_name_locked boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  deactivated_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX learner_profiles_mobile_key ON public.learner_profiles (mobile) WHERE mobile IS NOT NULL;
CREATE UNIQUE INDEX learner_profiles_email_key ON public.learner_profiles (lower(email));
GRANT SELECT, INSERT, UPDATE ON public.learner_profiles TO authenticated;
GRANT ALL ON public.learner_profiles TO service_role;
ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read own or staff" ON public.learner_profiles
  FOR SELECT TO authenticated USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "insert own" ON public.learner_profiles
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "update own or admin" ON public.learner_profiles
  FOR UPDATE TO authenticated USING (id = auth.uid() OR public.is_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

CREATE TRIGGER learner_profiles_touch BEFORE UPDATE ON public.learner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.learner_profiles (id, email, full_name, mobile)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    NULLIF(NEW.raw_user_meta_data ->> 'mobile', '')
  )
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'learner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PROFILE FIELD CONFIG ============
CREATE TABLE public.profile_field_config (
  field_key text PRIMARY KEY,
  label text NOT NULL,
  is_required boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  display_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profile_field_config TO authenticated, anon;
GRANT ALL ON public.profile_field_config TO service_role;
ALTER TABLE public.profile_field_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "field config readable" ON public.profile_field_config FOR SELECT TO authenticated, anon USING (true);
CREATE POLICY "field config admin write" ON public.profile_field_config
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.profile_field_config (field_key, label, is_required, is_visible, display_order) VALUES
  ('full_name','Full name',true,true,1),
  ('mobile','Mobile number',true,true,2),
  ('email','Email address',true,true,3),
  ('city','City',true,true,4),
  ('state','State',true,true,5),
  ('profession','Profession',true,true,6),
  ('billing_address','Billing address',true,true,7),
  ('photograph_path','Photograph',false,true,8),
  ('education','Education',false,true,9),
  ('organisation','Organisation',false,true,10),
  ('identity_proof_path','Identity proof',false,true,11),
  ('gst_number','GST number',false,true,12);

-- ============ SETTINGS ============
CREATE TABLE public.settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  label text NOT NULL,
  description text,
  group_name text NOT NULL DEFAULT 'general',
  is_public boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
GRANT SELECT ON public.settings TO authenticated, anon;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public settings readable" ON public.settings
  FOR SELECT TO anon USING (is_public = true);
CREATE POLICY "settings readable to signed in" ON public.settings
  FOR SELECT TO authenticated USING (is_public = true OR public.is_admin(auth.uid()));
CREATE POLICY "settings super admin write" ON public.settings
  FOR ALL TO authenticated USING (public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'super_admin'));

INSERT INTO public.settings (key, value, label, description, group_name, is_public) VALUES
  ('course_price_paise','1500000'::jsonb,'Course price (paise)','ABB Certification Programme fee excluding GST, in paise.','commerce',true),
  ('gst_rate_percent','18'::jsonb,'GST rate (%)','GST percentage applied at checkout.','commerce',true),
  ('currency','"INR"'::jsonb,'Currency','Transaction currency.','commerce',true),
  ('access_duration_days','365'::jsonb,'Course access duration (days)','Days of access granted from date of enrolment.','commerce',true),
  ('invoice_prefix','"YBB/ABB/"'::jsonb,'Invoice number prefix','Prefix for generated GST invoice numbers.','commerce',false),
  ('invoice_next_number','1'::jsonb,'Next invoice number','Sequence counter for invoice numbering.','commerce',false),
  ('company_legal_name','"Yoova Business Broking"'::jsonb,'Legal entity name','Name printed on invoices and certificates.','company',true),
  ('company_address','""'::jsonb,'Registered address','Address printed on invoices.','company',true),
  ('company_gstin','""'::jsonb,'GSTIN','YBB GST identification number.','company',false),
  ('company_state','""'::jsonb,'Place of supply state','Used for CGST/SGST vs IGST split.','company',false),
  ('sequential_lessons','true'::jsonb,'Sequential lesson access','Require lessons to be completed in order.','learning',false),
  ('lesson_complete_watch_percent','90'::jsonb,'Lesson completion watch (%)','Watch percentage required to auto-complete a lesson.','learning',false),
  ('exam_question_count','50'::jsonb,'Exam question count','Number of questions drawn per attempt.','exam',false),
  ('exam_duration_minutes','60'::jsonb,'Exam duration (minutes)','Time limit per attempt.','exam',false),
  ('exam_pass_percent','70'::jsonb,'Pass percentage','Minimum score required to pass.','exam',false),
  ('exam_max_attempts','3'::jsonb,'Maximum attempts','Attempts allowed per learner.','exam',false),
  ('exam_wait_hours','24'::jsonb,'Waiting period (hours)','Cooling-off period between attempts.','exam',false),
  ('exam_randomise_questions','true'::jsonb,'Randomise question order','Shuffle question order per attempt.','exam',false),
  ('exam_randomise_options','true'::jsonb,'Randomise answer order','Shuffle answer options per attempt.','exam',false),
  ('exam_reveal_answers','false'::jsonb,'Reveal correct answers','Show correct answers after an attempt.','exam',false),
  ('exam_require_all_lessons','true'::jsonb,'Require all lessons complete','Block exam until every lesson is complete.','exam',false),
  ('exam_require_assignments','true'::jsonb,'Require compulsory assignments approved','Block exam until compulsory work is approved.','exam',false),
  ('certification_auto_approve','false'::jsonb,'Automatic certification approval','Issue certificates without manual admin approval.','certification',false),
  ('abb_id_format','"YBB-ABB-{YYYY}-{NNNN}"'::jsonb,'ABB ID format','Template for generated ABB IDs.','certification',false),
  ('certificate_signatory_name','""'::jsonb,'Authorised signatory','Name printed on the certificate.','certification',false),
  ('certificate_signatory_title','""'::jsonb,'Signatory designation','Designation printed on the certificate.','certification',false),
  ('certificate_validity_note','"This certificate does not expire."'::jsonb,'Validity note','Validity wording on the certificate.','certification',false),
  ('programme_name','"ABB Certification Programme"'::jsonb,'Programme name','Public programme title.','company',true),
  ('support_email','""'::jsonb,'Support email','Displayed to learners for help.','company',true);

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  reason text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_logs_created_idx ON public.audit_logs (created_at DESC);
CREATE INDEX audit_logs_entity_idx ON public.audit_logs (entity_type, entity_id);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit readable by admin" ON public.audit_logs
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));