import { useMemo } from "react";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLanguage } from "@i18n";
import { db } from "@/db/db";
import { activities, userActivityPrefs, customActivities } from "@/db/schema";

export type DbUserActivity = {
  id: string;
  name: string;
  category: string;
  niyyahText: string;
  hadithRef: string | null;
  defaultTime: string | null;
  enabled: boolean;
  customTime: string | null;
  customNiyyahText: string | null;
  isCustom: boolean;
};

function useBuiltinActivities(): DbUserActivity[] {
  const { language } = useLanguage();

  const activitiesQuery = useMemo(
    () =>
      db
        .select({
          id: activities.id,
          name: language === "ar" ? activities.nameAr : activities.nameEn,
          category: activities.category,
          niyyahText:
            language === "ar"
              ? activities.niyyahTextAr
              : activities.niyyahTextEn,
          hadithRef:
            language === "ar" ? activities.hadithRefAr : activities.hadithRefEn,
          defaultTime: activities.defaultTime,
        })
        .from(activities),
    [language],
  );
  const { data: activitiesData } = useLiveQuery(activitiesQuery, [language]);

  const prefsQuery = useMemo(() => db.select().from(userActivityPrefs), []);
  const { data: prefsData } = useLiveQuery(prefsQuery, []);

  return useMemo(() => {
    const prefsById = new Map(
      (prefsData ?? []).map((p) => [p.activityId, p]),
    );
    return (activitiesData ?? []).map((row) => {
      const prefs = prefsById.get(row.id);
      return {
        id: row.id,
        name: row.name,
        category: row.category,
        niyyahText: row.niyyahText,
        hadithRef: row.hadithRef ?? null,
        defaultTime: row.defaultTime,
        enabled: prefs?.isEnabled ?? false,
        customTime: prefs?.customTime ?? null,
        customNiyyahText: prefs?.customNiyyahText ?? null,
        isCustom: false,
      };
    });
  }, [activitiesData, prefsData]);
}

function useCustomActivitiesList(): DbUserActivity[] {
  const { language } = useLanguage();

  const query = useMemo(
    () =>
      db
        .select({
          id: customActivities.id,
          name:
            language === "ar" ? customActivities.nameAr : customActivities.nameEn,
          category: customActivities.category,
          niyyahText:
            language === "ar"
              ? customActivities.niyyahTextAr
              : customActivities.niyyahTextEn,
          isEnabled: customActivities.isEnabled,
        })
        .from(customActivities),
    [language],
  );

  const { data } = useLiveQuery(query, [language]);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    niyyahText: row.niyyahText,
    hadithRef: null,
    defaultTime: null,
    enabled: row.isEnabled,
    customTime: null,
    customNiyyahText: null,
    isCustom: true,
  }));
}

export function useAllActivities(): DbUserActivity[] {
  const builtin = useBuiltinActivities();
  const custom = useCustomActivitiechangsList();
  return [...builtin, ...custom];
}

export function useEnabledActivities(): DbUserActivity[] {
  return useAllActivities().filter((a) => a.enabled);
}

export async function getActivityBilingualName(
  activityId: string,
  isCustom: boolean,
) {
  const table = isCustom ? customActivities : activities;
  const [row] = await db
    .select({ nameEn: table.nameEn, nameAr: table.nameAr })
    .from(table)
    .where(eq(table.id, activityId));
  return row ?? { nameEn: "", nameAr: "" };
}
