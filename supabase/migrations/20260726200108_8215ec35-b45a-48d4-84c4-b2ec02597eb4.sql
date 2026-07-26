
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS reviewer_id uuid,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewer_feedback text,
  ADD COLUMN IF NOT EXISTS score numeric;

DROP POLICY IF EXISTS "submissions learner insert" ON public.submissions;
CREATE POLICY "submissions learner insert" ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_enrolled(auth.uid()));

DROP POLICY IF EXISTS "submissions learner update" ON public.submissions;
CREATE POLICY "submissions learner update" ON public.submissions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "submissions staff manage" ON public.submissions;
CREATE POLICY "submissions staff manage" ON public.submissions
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

GRANT SELECT, INSERT, UPDATE ON public.submissions TO authenticated;
GRANT ALL ON public.submissions TO service_role;

CREATE UNIQUE INDEX IF NOT EXISTS submissions_user_assignment_attempt_idx
  ON public.submissions (user_id, assignment_id, attempt_number);

INSERT INTO public.assignments (course_id, module_id, title, instructions, allowed_file_types, max_file_size_mb, max_attempts, is_compulsory, is_final_project, is_published, position)
SELECT m.course_id, m.id,
       m.title || ' — practical assignment',
       'Apply what you learned in "' || m.title || '" to a real or sample SME scenario. Upload a single PDF or DOCX (max 10 MB) covering your approach, working and conclusion.',
       ARRAY['pdf','docx'], 10, 3, true, false, true, m.position
FROM public.modules m
WHERE NOT EXISTS (SELECT 1 FROM public.assignments a WHERE a.module_id = m.id);

INSERT INTO public.assignments (course_id, module_id, title, instructions, allowed_file_types, max_file_size_mb, max_attempts, is_compulsory, is_final_project, is_published, position)
SELECT c.id, NULL,
       'Final project — end-to-end broking mandate',
       'Prepare a complete broking mandate for an SME of your choice: business profile, valuation, marketing plan, buyer shortlist, negotiation strategy and closing checklist. Upload one PDF (max 25 MB).',
       ARRAY['pdf'], 25, 3, true, true, true, 999
FROM public.courses c
WHERE NOT EXISTS (SELECT 1 FROM public.assignments a WHERE a.is_final_project AND a.course_id = c.id);
