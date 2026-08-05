import { useMemo } from "react";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { db } from "@/db/db";
import { dailyLogs, dailyLogNiyyahs } from "@/db/schema";
import { computeStreak } from "@utils/stats";
import { getTodayString } from "@utils/date";
import { useToday } from "@hooks/useToday";

export function useDailyLogs() {
  const { data: allLogs } = useLiveQuery(db.select().from(dailyLogs));
  const { data: allNiyyahs } = useLiveQuery(db.select().from(dailyLogNiyyahs));

  const logs = allLogs ?? [];
  const niyyahRows = allNiyyahs ?? [];
  const today = useToday();

  const todayLogs = useMemo(
    () => logs.filter((l) => l.date === today),
    [logs, today],
  );

  const isCompletedToday = (activityId: string) =>
    todayLogs.some((l) => l.activityId === activityId);

  const getTodayLogForActivity = (activityId: string) =>
    todayLogs.find((l) => l.activityId === activityId);

  const getTodayNiyyahIds = (activityId: string): string[] => {
    const log = todayLogs.find((l) => l.activityId === activityId);
    if (!log) return [];
    return niyyahRows
      .filter((n) => n.dailyLogId === log.id)
      .map((n) => n.niyyahId);
  };

  const streak = useMemo(() => computeStreak(logs), [logs]);

  const getTodayAjrMultiplier = () => {
    const acts = todayLogs.length;
    if (acts === 0) return { acts: 0, avgNiyyahs: 0, total: 0 };

    const totalNiyyahs = todayLogs.reduce((sum, log) => {
      const count = niyyahRows.filter((n) => n.dailyLogId === log.id).length;
      return sum + count + 1; // +1 for the core intention itself
    }, 0);

    const avgNiyyahs = Math.round((totalNiyyahs / acts) * 10) / 10;
    return { acts, avgNiyyahs, total: acts * avgNiyyahs };
  };

  return {
    logs,
    todayLogs,
    isCompletedToday,
    getTodayLogForActivity,
    getTodayNiyyahIds,
    streak,
    getTodayAjrMultiplier,
  };
}

export async function getFreshDailyLogState() {
  const logs = await db.select().from(dailyLogs);
  const today = getTodayString();
  return {
    streak: computeStreak(logs),
    completedSomethingToday: logs.some((l) => l.date === today),
  };
}
