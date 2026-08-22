import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/react-native";
import { storage } from "@lib/storage";
import { DEFAULT_ACTIVITY_IDS } from "@data/onboardingDefaults";
import { db } from "./db";
import {
  categories,
  activities,
  niyyahOptions,
  niyyahProfileTags,
  niyyahSources,
  learnContent,
  contentMeta,
  userActivityPrefs,
  customActivities,
  customNiyyahOptions,
  journalEntries,
  dailyLogs,
  dailyLogNiyyahs,
} from "./schema";
import {
  categoriesSeed,
  activitiesSeed,
  niyyahOptionsSeed,
  niyyahProfileTagsSeed,
  niyyahSourcesSeed,
  learnContentSeed,
  mapCategory,
  mapActivity,
  mapNiyyahOption,
  mapNiyyahProfileTag,
  mapNiyyahSource,
  mapLearnContentRow,
} from "./seedMappers";

// Bump when any src/db/seed/v1.0.0/*.json file changes.
export const CONTENT_VERSION = "1.0.0";

const VERSION_KEY = "version";
const MMKV_CLEARED_KEY = "mmkv_content_cleared";
const ACTIVITIES_MIGRATED_KEY = "activities_migrated_from_mmkv";
const JOURNAL_MIGRATED_KEY = "journal_migrated_from_mmkv";
const DAILY_LOGS_MIGRATED_KEY = "daily_logs_migrated_from_mmkv";

type LegacyUserActivity = {
  id: string;
  category?: string;
  name?: { en: string; ar: string };
  niyyahText?: { en: string; ar: string };
  enabled?: boolean;
  customTime?: string;
  customNiyyah?: string;
  customNiyyahOptions?: Array<{ id: string; text: { en: string; ar: string } }>;
};

// Shape matches the old (pre-SQLite) `JournalEntry` type in src/types/index.ts.
type LegacyJournalEntry = {
  id: string;
  activityId: string;
  activityName?: { en: string; ar: string };
  createdAt?: string;
  note?: string;
  selectedNiyyahCount?: number;
  impactfulNiyyah?: string;
};

// Shape matches the old (pre-SQLite) `DailyLog` type in src/types/index.ts.
type LegacyDailyLog = {
  id: string;
  activityId: string;
  date: string;
  completedAt?: string;
  selectedNiyyahIds?: string[];
};

const DEFAULT_ENABLED_IDS = new Set(DEFAULT_ACTIVITY_IDS);

// Legacy MMKV keys are archived under this suffix rather than deleted outright.
// A one-shot import that silently extracts nothing must never be able to
// destroy the only copy of a user's pre-SQLite data.
const BACKUP_SUFFIX = "__backup";

/**
 * Outcome of a one-shot legacy MMKV -> SQLite import.
 * - "imported": source key existed and rows were written.
 * - "absent": source key genuinely not present (fresh install) - nothing to do.
 * - "anomaly": source key existed but yielded no rows, or the import threw.
 *   Never mark migrated and never let cleanup run on this - the source blob is
 *   the only copy of the data.
 */
type MigrationOutcome = "imported" | "absent" | "anomaly";

// Raw data existed but produced nothing. This is the failure mode that silently
// destroyed user data in the first SQLite release, so report it as a real Sentry
// EVENT (breadcrumbs only surface attached to a later error, and no error fires
// on this path - which is why the original incident produced zero Sentry data).
function reportMigrationAnomaly(
  key: string,
  reason: string,
  extra: Record<string, unknown> = {},
) {
  Sentry.captureMessage(`Legacy migration anomaly: ${key}`, {
    level: "warning",
    tags: { feature: "db", phase: "legacyMigration" },
    extra: { key, reason, ...extra },
  });
}

async function getContentMetaValue(key: string): Promise<string | undefined> {
  const rows = await db
    .select()
    .from(contentMeta)
    .where(eq(contentMeta.key, key));
  return rows[0]?.value;
}

async function seedContent() {
  await db.transaction(async (tx) => {
    for (const row of categoriesSeed) {
      const mapped = mapCategory(row);
      await tx
        .insert(categories)
        .values(mapped)
        .onConflictDoUpdate({
          target: categories.id,
          set: {
            labelEn: mapped.labelEn,
            labelAr: mapped.labelAr,
            icon: mapped.icon,
            sortOrder: mapped.sortOrder,
          },
        });
    }

    await tx.delete(niyyahSources);
    await tx.delete(niyyahProfileTags);
    await tx.delete(niyyahOptions);
    await tx.delete(learnContent);

    for (const row of activitiesSeed) {
      const mapped = mapActivity(row);
      await tx
        .insert(activities)
        .values(mapped)
        .onConflictDoUpdate({
          target: activities.id,
          set: {
            nameEn: mapped.nameEn,
            nameAr: mapped.nameAr,
            category: mapped.category,
            niyyahTextEn: mapped.niyyahTextEn,
            niyyahTextAr: mapped.niyyahTextAr,
            hadithRefEn: mapped.hadithRefEn,
            hadithRefAr: mapped.hadithRefAr,
            defaultTime: mapped.defaultTime,
            sortOrder: mapped.sortOrder,
          },
        });
    }

    await tx
      .insert(niyyahOptions)
      .values(niyyahOptionsSeed.map(mapNiyyahOption));

    if (niyyahProfileTagsSeed.length > 0) {
      await tx
        .insert(niyyahProfileTags)
        .values(niyyahProfileTagsSeed.map(mapNiyyahProfileTag));
    }

    if (niyyahSourcesSeed.length > 0) {
      await tx
        .insert(niyyahSources)
        .values(niyyahSourcesSeed.map(mapNiyyahSource));
    }

    if (learnContentSeed.length > 0) {
      await tx
        .insert(learnContent)
        .values(learnContentSeed.map(mapLearnContentRow));
    }

    const existingPrefs = await tx
      .select({ activityId: userActivityPrefs.activityId })
      .from(userActivityPrefs);
    const existingIds = new Set(existingPrefs.map((p) => p.activityId));

    const missingPrefRows = activitiesSeed
      .filter((a) => !existingIds.has(a.id))
      .map((a) => ({
        activityId: a.id,
        isEnabled: DEFAULT_ENABLED_IDS.has(a.id),
      }));

    if (missingPrefRows.length > 0) {
      await tx.insert(userActivityPrefs).values(missingPrefRows);
    }

    await tx
      .insert(contentMeta)
      .values({ key: VERSION_KEY, value: CONTENT_VERSION })
      .onConflictDoUpdate({
        target: contentMeta.key,
        set: { value: CONTENT_VERSION },
      });
  });
}

// one time migration from mmkv user to sqlite user.
// must run after seedContent() and before clearStaleMmkvContentIfNeeded()
async function migrateLegacyActivitiesIfNeeded(): Promise<MigrationOutcome> {
  const markMigrated = () =>
    db
      .insert(contentMeta)
      .values({ key: ACTIVITIES_MIGRATED_KEY, value: "1" })
      .onConflictDoUpdate({
        target: contentMeta.key,
        set: { value: "1" },
      });

  const migrated = await getContentMetaValue(ACTIVITIES_MIGRATED_KEY);
  const raw = storage.getString("@niyyah_activities");

  // A build before 2026-08-21 could mark this flag "1" without actually
  // importing anything (see the incident this fix addresses). Only trust the
  // flag when the source key is also gone - if it's still sitting there, a
  // prior run never got as far as archiving it, so retry the import for real
  // rather than letting the caller treat this as safe to clean up.
  if (migrated === "1") {
    if (raw === undefined) return "absent";
    reportMigrationAnomaly(
      "@niyyah_activities",
      "flag marked migrated but source key is still present - retrying import",
    );
  }

  if (raw === undefined) {
    await markMigrated();
    return "absent";
  }

  let legacyActivities: LegacyUserActivity[] = [];
  let parsedStateKeys: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    parsedStateKeys = parsed?.state ? Object.keys(parsed.state) : [];
    legacyActivities = parsed?.state?.activities ?? [];
  } catch (err) {
    // Do NOT mark migrated: the blob is unreadable now, but it is still the
    // only copy. Leaving the flag unset lets a fixed build retry.
    Sentry.captureException(err, {
      tags: { feature: "db", phase: "legacyMigration" },
      extra: { key: "@niyyah_activities" },
    });
    return "anomaly";
  }

  if (legacyActivities.length === 0) {
    reportMigrationAnomaly(
      "@niyyah_activities",
      "parsed but extracted 0 activities",
      {
        parsedStateKeys,
        rawLength: raw.length,
      },
    );
    return "anomaly";
  }

  const knownActivityIds = new Set(
    (await db.select({ id: activities.id }).from(activities)).map((a) => a.id),
  );

  await db.transaction(async (tx) => {
    for (const a of legacyActivities) {
      const isCustom = a.id.startsWith("custom_");

      if (isCustom) {
        await tx
          .insert(customActivities)
          .values({
            id: a.id,
            nameEn: a.name?.en ?? "",
            nameAr: a.name?.ar ?? "",
            category: a.category || "daily",
            niyyahTextEn: a.niyyahText?.en ?? "",
            niyyahTextAr: a.niyyahText?.ar ?? "",
            isEnabled: a.enabled ?? true,
            createdAt: new Date(),
          })
          .onConflictDoNothing();
      } else if (knownActivityIds.has(a.id)) {
        await tx
          .insert(userActivityPrefs)
          .values({
            activityId: a.id,
            isEnabled: a.enabled ?? false,
            customTime: a.customTime ?? null,
            customNiyyahText: a.customNiyyah ?? null,
          })
          .onConflictDoUpdate({
            target: userActivityPrefs.activityId,
            set: {
              isEnabled: a.enabled ?? false,
              customTime: a.customTime ?? null,
              customNiyyahText: a.customNiyyah ?? null,
            },
          });
      }

      for (const opt of a.customNiyyahOptions ?? []) {
        await tx
          .insert(customNiyyahOptions)
          .values({
            id: opt.id,
            activityId: a.id,
            textEn: opt.text?.en ?? "",
            textAr: opt.text?.ar ?? "",
            createdAt: new Date(),
          })
          .onConflictDoNothing();
      }
    }
  });

  await markMigrated();
  return "imported";
}

// one‑time migration for legacy journal entries (mmkv → sqlite); run after seedContent() and before clearStaleMmkvContentIfNeeded()
async function migrateLegacyJournalIfNeeded(): Promise<MigrationOutcome> {
  const markMigrated = () =>
    db
      .insert(contentMeta)
      .values({ key: JOURNAL_MIGRATED_KEY, value: "1" })
      .onConflictDoUpdate({
        target: contentMeta.key,
        set: { value: "1" },
      });

  const migrated = await getContentMetaValue(JOURNAL_MIGRATED_KEY);
  const raw = storage.getString("@niyyah_journal");

  // See migrateLegacyActivitiesIfNeeded for why the flag alone isn't trusted.
  if (migrated === "1") {
    if (raw === undefined) return "absent";
    reportMigrationAnomaly(
      "@niyyah_journal",
      "flag marked migrated but source key is still present - retrying import",
    );
  }

  if (raw === undefined) {
    await markMigrated();
    return "absent";
  }

  let legacyEntries: LegacyJournalEntry[] = [];
  let parsedStateKeys: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    parsedStateKeys = parsed?.state ? Object.keys(parsed.state) : [];
    legacyEntries = parsed?.state?.journalEntries ?? [];
  } catch (err) {
    Sentry.captureException(err, {
      tags: { feature: "db", phase: "legacyMigration" },
      extra: { key: "@niyyah_journal" },
    });
    return "anomaly";
  }

  if (legacyEntries.length === 0) {
    reportMigrationAnomaly(
      "@niyyah_journal",
      "parsed but extracted 0 entries",
      {
        parsedStateKeys,
        rawLength: raw.length,
      },
    );
    return "anomaly";
  }

  await db.transaction(async (tx) => {
    for (const e of legacyEntries) {
      const createdAt = e.createdAt ? new Date(e.createdAt) : new Date();
      await tx
        .insert(journalEntries)
        .values({
          id: e.id,
          activityId: e.activityId,
          activityNameEn: e.activityName?.en ?? "",
          activityNameAr: e.activityName?.ar ?? "",
          note: e.note ?? "",
          selectedNiyyahCount: e.selectedNiyyahCount ?? 0,
          impactfulNiyyahId: e.impactfulNiyyah ?? null,
          createdAt: Number.isNaN(createdAt.getTime()) ? new Date() : createdAt,
        })
        .onConflictDoNothing();
    }
  });

  await markMigrated();
  return "imported";
}

// one‑time migration for legacy daily logs (mmkv → sqlite); run after seedContent() and before clearStaleMmkvContentIfNeeded()
async function migrateLegacyDailyLogsIfNeeded(): Promise<MigrationOutcome> {
  const markMigrated = () =>
    db
      .insert(contentMeta)
      .values({ key: DAILY_LOGS_MIGRATED_KEY, value: "1" })
      .onConflictDoUpdate({
        target: contentMeta.key,
        set: { value: "1" },
      });

  const migrated = await getContentMetaValue(DAILY_LOGS_MIGRATED_KEY);
  const raw = storage.getString("@niyyah_daily_logs");

  // See migrateLegacyActivitiesIfNeeded for why the flag alone isn't trusted.
  if (migrated === "1") {
    if (raw === undefined) return "absent";
    reportMigrationAnomaly(
      "@niyyah_daily_logs",
      "flag marked migrated but source key is still present - retrying import",
    );
  }

  if (raw === undefined) {
    await markMigrated();
    return "absent";
  }

  let legacyLogs: LegacyDailyLog[] = [];
  let parsedStateKeys: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    parsedStateKeys = parsed?.state ? Object.keys(parsed.state) : [];
    legacyLogs = parsed?.state?.dailyLogs ?? [];
  } catch (err) {
    Sentry.captureException(err, {
      tags: { feature: "db", phase: "legacyMigration" },
      extra: { key: "@niyyah_daily_logs" },
    });
    return "anomaly";
  }

  if (legacyLogs.length === 0) {
    reportMigrationAnomaly(
      "@niyyah_daily_logs",
      "parsed but extracted 0 logs",
      {
        parsedStateKeys,
        rawLength: raw.length,
      },
    );
    return "anomaly";
  }

  await db.transaction(async (tx) => {
    for (const log of legacyLogs) {
      const completedAt = log.completedAt
        ? new Date(log.completedAt)
        : new Date();
      await tx
        .insert(dailyLogs)
        .values({
          id: log.id,
          activityId: log.activityId,
          date: log.date,
          completedAt: Number.isNaN(completedAt.getTime())
            ? new Date()
            : completedAt,
        })
        .onConflictDoNothing();

      for (const niyyahId of log.selectedNiyyahIds ?? []) {
        // dailyLogNiyyahs has no unique constraint on (dailyLogId, niyyahId),
        // and the stale-flag retry above means this loop can legitimately run
        // twice for the same log - check first so a retry can't duplicate
        // rows and inflate niyyah counts.
        const existing = await tx
          .select({ niyyahId: dailyLogNiyyahs.niyyahId })
          .from(dailyLogNiyyahs)
          .where(eq(dailyLogNiyyahs.dailyLogId, log.id));
        if (existing.some((r) => r.niyyahId === niyyahId)) continue;

        await tx
          .insert(dailyLogNiyyahs)
          .values({ dailyLogId: log.id, niyyahId });
      }
    }
  });

  await markMigrated();
  return "imported";
}

// One-time MMKV cleanup.
//
// Archives rather than deletes: each legacy blob is copied to `<key>__backup`
// before the original is removed, so a bad import can never be the last event
// standing between a user and their data. Only runs once every import has
// confirmed success ("imported") or confirmed there was nothing to import
// ("absent") - a single "anomaly" aborts cleanup and leaves the originals in
// place for a later build to retry.
async function archiveStaleMmkvContentIfNeeded(outcomes: MigrationOutcome[]) {
  if (outcomes.includes("anomaly")) {
    Sentry.captureMessage("Legacy MMKV cleanup skipped: import anomaly", {
      level: "warning",
      tags: { feature: "db", phase: "legacyMigration" },
      extra: { outcomes },
    });
    return;
  }

  const cleared = await getContentMetaValue(MMKV_CLEARED_KEY);
  if (cleared === "1") return;

  for (const key of [
    "@niyyah_activities",
    "@niyyah_journal",
    "@niyyah_daily_logs",
  ]) {
    const raw = storage.getString(key);
    if (raw) storage.set(`${key}${BACKUP_SUFFIX}`, raw);
    storage.delete(key);
  }

  await db
    .insert(contentMeta)
    .values({ key: MMKV_CLEARED_KEY, value: "1" })
    .onConflictDoUpdate({
      target: contentMeta.key,
      set: { value: "1" },
    });
}

// Call once on launch after migrations succeed (see _layout.tsx).
export async function seedIfNeeded() {
  const currentVersion = await getContentMetaValue(VERSION_KEY);

  if (currentVersion !== CONTENT_VERSION) {
    await seedContent();
  }

  // Run all three even if an earlier one reports an anomaly: they are
  // independent, and a failure to import journal entries must not also block
  // daily logs from being imported.
  const outcomes: MigrationOutcome[] = [
    await migrateLegacyActivitiesIfNeeded(),
    await migrateLegacyJournalIfNeeded(),
    await migrateLegacyDailyLogsIfNeeded(),
  ];

  await archiveStaleMmkvContentIfNeeded(outcomes);
}
