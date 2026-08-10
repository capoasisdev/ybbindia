/**
 * Platform settings contract. Every value here is stored in the `settings`
 * table and is editable by a Super Admin from Admin -> System Settings.
 * These constants are the launch values confirmed by YBB, used only as a
 * fallback if a key has not yet been written to the database.
 */

export type SettingValue =
  string | number | boolean | null | SettingValue[] | { [key: string]: SettingValue };

export type SettingsMap = Record<string, SettingValue>;

export const SETTING_DEFAULTS = {
  course_price_paise: 1_500_000,
  gst_rate_percent: 18,
  currency: "INR",
  access_duration_days: 365,
  invoice_prefix: "YBB/ABB/",
  invoice_next_number: 1,
  company_legal_name: "Yoova Business Broking",
  company_address: "",
  company_gstin: "",
  company_state: "",
  sequential_lessons: true,
  lesson_complete_watch_percent: 90,
  exam_question_count: 50,
  exam_duration_minutes: 60,
  exam_pass_percent: 70,
  exam_max_attempts: 10,
  exam_free_attempts: 2,
  exam_attempt_price_paise: 50000,
  exam_wait_hours: 24,
  exam_randomise_questions: true,
  exam_randomise_options: true,
  exam_reveal_answers: false,
  exam_require_all_lessons: true,
  exam_require_assignments: true,
  certification_auto_approve: false,
  abb_id_format: "YBB-ABB-{YYYY}-{NNNN}",
  certificate_signatory_name: "",
  certificate_signatory_title: "",
  certificate_validity_note: "This certificate does not expire.",
  programme_name: "ABB Certification Programme",
  support_email: "",
  /**
   * When true, the checkout exposes a "Simulate successful payment" path that
   * fulfils the order without contacting Razorpay. Must be false at go-live.
   */
  payments_test_mode: true,
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;

export function readSetting<K extends SettingKey>(
  settings: SettingsMap | undefined | null,
  key: K,
): (typeof SETTING_DEFAULTS)[K] {
  const raw = settings?.[key];
  if (raw === undefined || raw === null || raw === "") return SETTING_DEFAULTS[key];
  return raw as (typeof SETTING_DEFAULTS)[K];
}

export function readNumber(settings: SettingsMap | undefined | null, key: SettingKey): number {
  return Number(readSetting(settings, key));
}

export function readBool(settings: SettingsMap | undefined | null, key: SettingKey): boolean {
  return Boolean(readSetting(settings, key));
}

export function readString(settings: SettingsMap | undefined | null, key: SettingKey): string {
  return String(readSetting(settings, key) ?? "");
}
