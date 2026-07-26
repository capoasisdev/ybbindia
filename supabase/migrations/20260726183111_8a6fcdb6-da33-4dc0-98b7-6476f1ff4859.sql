-- lesson videos
CREATE POLICY "videos readable by enrolled" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'lesson-videos' AND (public.is_enrolled(auth.uid()) OR public.is_staff(auth.uid())));
CREATE POLICY "videos managed by content admin" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'lesson-videos' AND (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin')))
  WITH CHECK (bucket_id = 'lesson-videos' AND (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin')));

-- course resources
CREATE POLICY "resources readable by enrolled" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'course-resources' AND (public.is_enrolled(auth.uid()) OR public.is_staff(auth.uid())));
CREATE POLICY "resources managed by content admin" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'course-resources' AND (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin')))
  WITH CHECK (bucket_id = 'course-resources' AND (public.has_role(auth.uid(),'content_admin') OR public.has_role(auth.uid(),'super_admin')));

-- submissions: files stored under <user_id>/...
CREATE POLICY "submission upload own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "submission read own or staff" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'submissions' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));

-- certificates: files stored under <user_id>/...
CREATE POLICY "certificate read own or staff" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'certificates' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_staff(auth.uid())));