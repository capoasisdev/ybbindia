DELETE FROM public.lesson_progress WHERE lesson_id IN (
  SELECT l.id FROM public.lessons l JOIN public.modules m ON m.id = l.module_id WHERE m.position BETWEEN 1 AND 5
);
DELETE FROM public.lessons WHERE module_id IN (SELECT id FROM public.modules WHERE position BETWEEN 1 AND 5);

INSERT INTO public.lessons (module_id, title, video_url, position, is_published)
SELECT m.id, v.title, v.url, v.position, true
FROM (VALUES
  (1, 'Module Introduction', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201-%20Intro.mp4', 1),
  (1, 'Lesson 1', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%201.mp4', 2),
  (1, 'Lesson 2', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%202.mp4', 3),
  (1, 'Lesson 3', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%203.mp4', 4),
  (1, 'Lesson 4', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%201%20-%20Lesson%204.mp4', 5),
  (2, 'Module Introduction', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Introduction.mp4', 1),
  (2, 'Lesson 5', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%205.mp4', 2),
  (2, 'Lesson 6', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%206.mp4', 3),
  (2, 'Lesson 7', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%202%20-%20Lesson%207.mp4', 4),
  (3, 'Module Introduction', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Introduction.mp4', 1),
  (3, 'Lesson 9', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%209.mp4', 2),
  (3, 'Lesson 10', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2010.mp4', 3),
  (3, 'Lesson 11', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2011.mp4', 4),
  (3, 'Lesson 12', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%203%20-%20Lesson%2012.mp4', 5),
  (4, 'Module Introduction', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Introduction.mp4', 1),
  (4, 'Lesson 13', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2013.mp4', 2),
  (4, 'Lesson 14', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2014.mp4', 3),
  (4, 'Lesson 15', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2015.mp4', 4),
  (4, 'Lesson 16', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%204%20-%20Lesson%2016%20.mp4', 5),
  (5, 'Module Introduction', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/MODULE%205%20-%20%20INTRODUCTION.mp4', 1),
  (5, 'Lesson 17', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2017.mp4', 2),
  (5, 'Lesson 18', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2018.mp4', 3),
  (5, 'Lesson 19', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2019.mp4', 4),
  (5, 'Lesson 20', 'https://pub-073da652b58c4e308816f08c68960bb2.r2.dev/Course%20Videos/Module%205%20-%20Lesson%2020.mp4', 5)
) AS v(module_position, title, url, position)
JOIN public.modules m ON m.position = v.module_position;