import { useState, useMemo, useCallback } from "react";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  useAllActivities,
  getActivityBilingualName,
} from "@hooks/db/useActivities";
import { useActivityActions } from "@hooks/db/useActivityActions";
import { useNiyyahOptions } from "@hooks/db/useNiyyahOptions";
import { useDailyLogs, getFreshDailyLogState } from "@hooks/db/useDailyLogs";
import { useDailyLogActions } from "@hooks/db/useDailyLogActions";
import { useJournalActions } from "@hooks/db/useJournalActions";
import { useSettingsStore } from "@store";
import { useNiyyahSelection } from "./useNiyyahSelection";
import { useToast } from "@hooks/useToast";
import { Haptic } from "@utils/haptics";
import { evaluateStreakRisk } from "@/services/notifications";
import * as Sentry from "@sentry/react-native";

type Step = "view" | "reflect";

const EMPTY_IDS: string[] = [];

export function useActivityDetail(id: string) {
  const { t, i18n } = useTranslation();
  const { language: lang } = i18n;
  const { toastMessage, showToast, animatedToastStyle } = useToast();

  const settings = useSettingsStore((s) => s.settings);
  const getProfileTags = useSettingsStore((s) => s.getProfileTags);

  const { activities: allActivities, isLoading } = useAllActivities();
  const activity = allActivities.find((a) => a.id === id);

  const { isCompletedToday, getTodayNiyyahIds } = useDailyLogs();
  const { markComplete, unmarkComplete, setTodayNiyyahs } =
    useDailyLogActions();
  const {
    updateActivityPrefs,
    updateCustomActivityNiyyahText,
    addCustomNiyyahOption,
    deleteCustomNiyyahOption,
  } = useActivityActions();
  const { addJournalEntry } = useJournalActions();

  const completed = isCompletedToday(id);
  const activityName = activity?.name ?? "";

  const profileTags = getProfileTags();

  const allAdvanced = useNiyyahOptions(activity?.id, profileTags);

  const rawTodayIds = completed ? getTodayNiyyahIds(id) : EMPTY_IDS;
  const todayIdsKey = rawTodayIds.join(",");
  const activitySelectedIds = useMemo(() => rawTodayIds, [todayIdsKey]);

  const {
    localSelected,
    cleanSelected,
    cleanSelectedCount,
    ajrCount,
    toggleNiyyah,
  } = useNiyyahSelection(activitySelectedIds);

  const handleToggleNiyyah = useCallback(
    (niyyahId: string) => {
      const wasSelected = localSelected.includes(niyyahId);
      const nextSelected = wasSelected
        ? localSelected.filter((x) => x !== niyyahId)
        : [...localSelected, niyyahId];

      toggleNiyyah(niyyahId);

      if (completed && activity) {
        setTodayNiyyahs(activity.id, nextSelected);
      }
    },
    [localSelected, toggleNiyyah, completed, activity, setTodayNiyyahs],
  );

  const [step, setStep] = useState<Step>("view");
  const [reflectionNote, setReflectionNote] = useState("");
  const [impactfulNiyyah, setImpactfulNiyyah] = useState("");
  const [showEditNiyyah, setShowEditNiyyah] = useState(false);
  const [editedNiyyah, setEditedNiyyah] = useState("");

  const handleToggleEditNiyyah = useCallback(() => {
    setShowEditNiyyah((prev) => {
      const next = !prev;
      if (next && activity) {
        setEditedNiyyah(activity.customNiyyahText ?? activity.niyyahText);
      }
      return next;
    });
  }, [activity]);

  const refreshStreakRisk = useCallback(() => {
    getFreshDailyLogState()
      .then(({ streak, completedSomethingToday }) =>
        evaluateStreakRisk({
          notificationsEnabled: settings.notificationsEnabled,
          streakCount: streak,
          completedSomethingToday,
          t,
        }),
      )
      .catch((error) =>
        Sentry.captureException(error, {
          tags: { feature: "notifications" },
          extra: { phase: "refreshStreakRisk" },
        }),
      );
  }, [settings.notificationsEnabled, t]);

  const handleSaveAndRenew = useCallback(async () => {
    if (!activity) return;
    Haptic.success();
    await markComplete(activity.id, cleanSelected);
    refreshStreakRisk();
    setStep("reflect");
  }, [activity, cleanSelected, markComplete, refreshStreakRisk]);

  const handleUnmark = useCallback(async () => {
    if (!activity) return;
    Haptic.lightTap();
    await unmarkComplete(activity.id);
    refreshStreakRisk();
  }, [activity, unmarkComplete, refreshStreakRisk]);

  const handleSaveReflection = useCallback(async () => {
    if (!activity || !reflectionNote.trim()) return;
    const { nameEn, nameAr } = await getActivityBilingualName(
      activity.id,
      activity.isCustom,
    );
    await addJournalEntry({
      activityId: activity.id,
      activityNameEn: nameEn,
      activityNameAr: nameAr,
      note: reflectionNote.trim(),
      selectedNiyyahCount: ajrCount,
      impactfulNiyyahId: impactfulNiyyah || undefined,
    });
    Haptic.success();
    showToast(t("activity.reflectionSavedToast"));
    setTimeout(() => router.back(), 550);
  }, [
    activity,
    reflectionNote,
    ajrCount,
    impactfulNiyyah,
    addJournalEntry,
    showToast,
    t,
  ]);

  const handleSaveNiyyah = useCallback(async () => {
    if (!activity) return;
    if (activity.isCustom) {
      await updateCustomActivityNiyyahText(activity.id, editedNiyyah);
    } else {
      await updateActivityPrefs(activity.id, {
        customNiyyahText: editedNiyyah,
      });
    }
    setShowEditNiyyah(false);
  }, [
    activity,
    editedNiyyah,
    updateCustomActivityNiyyahText,
    updateActivityPrefs,
  ]);

  const handleAddCustomNiyyah = useCallback(
    async (text: string) => {
      if (!activity || !text.trim()) return;
      await addCustomNiyyahOption(activity.id, text.trim(), text.trim());
    },
    [activity, addCustomNiyyahOption],
  );

  const handleDeleteCustomNiyyah = useCallback(
    (optionId: string) => {
      deleteCustomNiyyahOption(optionId);
    },
    [deleteCustomNiyyahOption],
  );

  return {
    activity,
    isLoading,
    activityName,
    completed,
    allAdvanced,
    step,
    setStep,
    localSelected,
    cleanSelectedCount,
    ajrCount,
    toggleNiyyah: handleToggleNiyyah,
    reflectionNote,
    setReflectionNote,
    impactfulNiyyah,
    setImpactfulNiyyah,
    showEditNiyyah,
    setShowEditNiyyah,
    handleToggleEditNiyyah,
    editedNiyyah,
    setEditedNiyyah,
    handleSaveAndRenew,
    handleUnmark,
    handleSaveReflection,
    handleSaveNiyyah,
    handleAddCustomNiyyah,
    handleDeleteCustomNiyyah,
    toastMessage,
    animatedToastStyle,
    lang,
  };
}
