-- Shift all lesson positions from 10 onwards
UPDATE public.lessons SET position = position + 1 WHERE position >= 10;

-- Insert Lesson 8
INSERT INTO public.lessons (module_id, title, video_url, position, is_published)
VALUES (
  'a082b581-ee2a-45b5-b673-ae1b72119f04', 
  'Module 2 - Lesson 8', 
  'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%208.mp4', 
  10, 
  true
);
