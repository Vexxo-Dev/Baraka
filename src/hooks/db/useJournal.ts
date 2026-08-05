import { useMemo } from "react";
import { desc } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLanguage } from "@i18n";
import { db } from "@/db/db";
import { journalEntries } from "@/db/schema";

export type DbJournalEntry = {
  id: string;
  activityId: string;
  activityName: string;
  note: string;
  selectedNiyyahCount: number | null;
  impactfulNiyyahId: string | null;
  createdAt: Date;
};

export function useJournalEntries(): DbJournalEntry[] {
  const { language } = useLanguage();

  const query = useMemo(
    () =>
      db
        .select({
          id: journalEntries.id,
          activityId: journalEntries.activityId,
          activityName:
            language === "ar"
              ? journalEntries.activityNameAr
              : journalEntries.activityNameEn,
          note: journalEntries.note,
          selectedNiyyahCount: journalEntries.selectedNiyyahCount,
          impactfulNiyyahId: journalEntries.impactfulNiyyahId,
          createdAt: journalEntries.createdAt,
        })
        .from(journalEntries)
        .orderBy(desc(journalEntries.createdAt)),
    [language],
  );

  const { data } = useLiveQuery(query, [language]);

  return (data ?? []).map((row) => ({
    ...row,
    createdAt: new Date(row.createdAt),
  }));
}
