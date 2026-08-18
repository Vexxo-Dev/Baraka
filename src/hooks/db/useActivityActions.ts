import { useCallback } from "react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db/db";
import {
  activities,
  userActivityPrefs,
  customActivities,
  customNiyyahOptions,
  dailyLogNiyyahs,
} from "@/db/schema";
import { generateCustomId } from "@utils/id";

export function useActivityActions() {
  const toggleActivity = useCallback(
    async (activityId: string, isCustom: boolean) => {
      if (isCustom) {
        await db
          .update(customActivities)
          .set({ isEnabled: sql`NOT ${customActivities.isEnabled}` })
          .where(eq(customActivities.id, activityId));
        return;
      }

      await db
        .insert(userActivityPrefs)
        .values({ activityId, isEnabled: true })
        .onConflictDoUpdate({
          target: userActivityPrefs.activityId,
          set: { isEnabled: sql`NOT ${userActivityPrefs.isEnabled}` },
        });
    },
    [],
  );

  const setEnabledActivities = useCallback(async (enabledIds: string[]) => {
    const allIds = (
      await db.select({ id: activities.id }).from(activities)
    ).map((a) => a.id);
    const enabledSet = new Set(enabledIds);

    await db.transaction(async (tx) => {
      for (const activityId of allIds) {
        await tx
          .insert(userActivityPrefs)
          .values({ activityId, isEnabled: enabledSet.has(activityId) })
          .onConflictDoUpdate({
            target: userActivityPrefs.activityId,
            set: { isEnabled: enabledSet.has(activityId) },
          });
      }
    });
  }, []);

  const updateActivityPrefs = useCallback(
    async (
      activityId: string,
      updates: Partial<{
        customTime: string | null;
        customNiyyahText: string | null;
      }>,
    ) => {
      await db
        .update(userActivityPrefs)
        .set(updates)
        .where(eq(userActivityPrefs.activityId, activityId));
    },
    [],
  );

  const addCustomActivity = useCallback(
    async (data: {
      nameEn: string;
      nameAr: string;
      category: string;
      niyyahTextEn: string;
      niyyahTextAr: string;
    }) => {
      const id = generateCustomId();
      await db.insert(customActivities).values({
        id,
        ...data,
        isEnabled: true,
        createdAt: new Date(),
      });
      return id;
    },
    [],
  );

  const updateCustomActivityNiyyahText = useCallback(
    async (activityId: string, text: string) => {
      await db
        .update(customActivities)
        .set({ niyyahTextEn: text, niyyahTextAr: text })
        .where(eq(customActivities.id, activityId));
    },
    [],
  );

  const addCustomNiyyahOption = useCallback(
    async (activityId: string, textEn: string, textAr: string) => {
      const id = generateCustomId();
      await db.insert(customNiyyahOptions).values({
        id,
        activityId,
        textEn,
        textAr,
        createdAt: new Date(),
      });
      return id;
    },
    [],
  );

  const deleteCustomNiyyahOption = useCallback(async (optionId: string) => {
    await db.transaction(async (tx) => {
      await tx
        .delete(dailyLogNiyyahs)
        .where(eq(dailyLogNiyyahs.niyyahId, optionId));
      await tx
        .delete(customNiyyahOptions)
        .where(eq(customNiyyahOptions.id, optionId));
    });
  }, []);

  return {
    toggleActivity,
    setEnabledActivities,
    updateActivityPrefs,
    addCustomActivity,
    updateCustomActivityNiyyahText,
    addCustomNiyyahOption,
    deleteCustomNiyyahOption,
  };
}
