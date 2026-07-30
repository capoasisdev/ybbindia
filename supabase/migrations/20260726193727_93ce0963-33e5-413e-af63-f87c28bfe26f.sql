INSERT INTO public.settings (key, value, label, description)
VALUES (
  'payments_test_mode',
  'true'::jsonb,
  'Payments test mode',
  'When on, checkout offers a simulated payment that activates enrolment without charging. Turn off before go-live.'
)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;