import { useMemo } from "react";
import { desc } from "drizzle-orm";
import { useLanguage } from "@i18n";
import { db } from "@/db/db";
import { journalEntries } from "@/db/schema";
import { useSafeLiveQuery } from "./useSafeLiveQuery";

export type DbJournalEntry = {
  id: string;
  activityId: string;
  activityName: string;
  note: string;
  selectedNiyyahCount: number | null;
  impactfulNiyyahId: string | null;
  createdAt: Date;
};

export type JournalState = {
  entries: DbJournalEntry[];
  isLoading: boolean;
};

export function useJournalEntries(): JournalState {
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

  const { data, isLoading } = useSafeLiveQuery(query, [language], "journal_entries");

  const entries = useMemo(
    () =>
      (data ?? []).map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt),
      })),
    [data],
  );

  return { entries, isLoading };
}
