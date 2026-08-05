import { useMemo, useState, useEffect } from "react";
import { useEnabledActivities } from "@hooks/db/useActivities";
import { useJournalEntries, type DbJournalEntry } from "@hooks/db/useJournal";
import { useLanguage } from "@i18n";

export function useFilteredJournal() {
  const journalEntries = useJournalEntries();
  const enabledActivities = useEnabledActivities();
  const { language: lang } = useLanguage();

  const [filterActivity, setFilterActivity] = useState("__all__");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return journalEntries.filter((e) => {
      const matchActivity =
        filterActivity === "__all__" || e.activityId === filterActivity;
      const matchSearch =
        !search || e.note.toLowerCase().includes(search.toLowerCase());
      return matchActivity && matchSearch;
    });
  }, [journalEntries, filterActivity, search]);

  const groupedLocalized = useMemo(() => {
    const groups: Record<string, DbJournalEntry[]> = {};
    filtered.forEach((entry) => {
      const date = entry.createdAt.toLocaleDateString(
        lang === "ar" ? "ar-SA" : "en-US",
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }
      );
      if (!groups[date]) groups[date] = [];
      groups[date].push(entry);
    });
    return groups;
  }, [filtered, lang]);

  useEffect(() => {
    if (filterActivity !== "__all__") {
      const hasEntriesForFilter = journalEntries.some(
        (e) => e.activityId === filterActivity
      );
      if (!hasEntriesForFilter) {
        setFilterActivity("__all__");
      }
    }
  }, [journalEntries, filterActivity]);

  return {
    journalEntries,
    enabledActivities,
    filtered,
    groupedLocalized,
    filterActivity,
    setFilterActivity,
    search,
    setSearch,
  };
}
