
DROP POLICY IF EXISTS "attempts learner insert" ON public.exam_attempts;
DROP POLICY IF EXISTS "attempts learner update" ON public.exam_attempts;
DROP POLICY IF EXISTS "progress own insert" ON public.lesson_progress;
DROP POLICY IF EXISTS "progress own update" ON public.lesson_progress;
DROP POLICY IF EXISTS "submissions learner insert" ON public.submissions;
DROP POLICY IF EXISTS "submissions learner update" ON public.submissions;

REVOKE INSERT, UPDATE, DELETE ON public.exam_attempts FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.lesson_progress FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.submissions FROM authenticated;

GRANT SELECT ON public.exam_attempts TO authenticated;
GRANT SELECT ON public.lesson_progress TO authenticated;
GRANT SELECT ON public.submissions TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
GRANT ALL ON public.lesson_progress TO service_role;
GRANT ALL ON public.submissions TO service_role;
