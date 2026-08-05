/**
 * Default activities enabled when the user skips the activity picker.
 * IDs must match `id` values in `src/db/seed/v1.0.0/activities.json`
 * (the seeded `activities` table). Also used by `src/db/seed.ts` to decide
 * which activities get an enabled `user_activity_prefs` row on first seed.
 */
export const DEFAULT_ACTIVITY_IDS = ["fajr", "dhuhur", "asr", "maghrib", "isha"];
