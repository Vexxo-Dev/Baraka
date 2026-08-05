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

const DEFAULT_ENABLED_IDS = new Set(DEFAULT_ACTIVITY_IDS);

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
    await tx.delete(activities);

    await tx.insert(activities).values(activitiesSeed.map(mapActivity));
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
async function migrateLegacyActivitiesIfNeeded() {
  const migrated = await getContentMetaValue(ACTIVITIES_MIGRATED_KEY);
  if (migrated === "1") return;

  const markMigrated = () =>
    db
      .insert(contentMeta)
      .values({ key: ACTIVITIES_MIGRATED_KEY, value: "1" })
      .onConflictDoUpdate({
        target: contentMeta.key,
        set: { value: "1" },
      });

  const raw = storage.getString("@niyyah_activities");
  if (!raw) {
    await markMigrated();
    return;
  }

  let legacyActivities: LegacyUserActivity[] = [];
  try {
    const parsed = JSON.parse(raw);
    legacyActivities = parsed?.state?.activities ?? [];
  } catch (err) {
    Sentry.captureException(err);
    await markMigrated();
    return;
  }

  if (legacyActivities.length === 0) {
    await markMigrated();
    return;
  }

  const knownActivityIds = new Set(
    (await db.select({ id: activities.id }).from(activities)).map(
      (a) => a.id,
    ),
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
}

// One-time MMKV cleanup
async function clearStaleMmkvContentIfNeeded() {
  const cleared = await getContentMetaValue(MMKV_CLEARED_KEY);
  if (cleared === "1") return;

  storage.delete("@niyyah_activities");
  storage.delete("@niyyah_journal");
  storage.delete("@niyyah_daily_logs");

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

  await migrateLegacyActivitiesIfNeeded();
  await clearStaleMmkvContentIfNeeded();
}
