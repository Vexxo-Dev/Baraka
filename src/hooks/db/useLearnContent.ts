import { useMemo } from "react";
import { eq } from "drizzle-orm";
import { useLanguage } from "@i18n";
import { db } from "@/db/db";
import { learnContent } from "@/db/schema";

const KNOWN_CATEGORY_ORDER = [
  "Foundations",
  "Work",
  "Health",
  "Daily Life",
  "Worship",
  "Relationships",
  "Learning",
];

export type DbLearnEntry = {
  id: string;
  title: string;
  category: string;
  content: string;
  source: string | null;
  keywords: string[];
};

export function useLearnContent(category?: string): DbLearnEntry[] {
  const { language } = useLanguage();

  return useMemo(() => {
    const base = db
      .select({
        id: learnContent.id,
        title: language === "ar" ? learnContent.titleAr : learnContent.titleEn,
        category: learnContent.category,
        content:
          language === "ar" ? learnContent.contentAr : learnContent.contentEn,
        source:
          language === "ar" ? learnContent.sourceAr : learnContent.sourceEn,
        keywords: learnContent.keywords,
      })
      .from(learnContent);

    const rows = category
      ? base.where(eq(learnContent.category, category)).all()
      : base.all();

    return rows.map(
      (row): DbLearnEntry => ({
        id: row.id,
        title: row.title,
        category: row.category,
        content: row.content,
        source: row.source ?? null,
        keywords: row.keywords ? JSON.parse(row.keywords) : [],
      }),
    );
  }, [category, language]);
}

export function useLearnCategories(): string[] {
  const allEntries = useLearnContent();

  return useMemo(() => {
    const present = Array.from(new Set(allEntries.map((e) => e.category)));

    present.sort((a, b) => {
      const aIndex = KNOWN_CATEGORY_ORDER.indexOf(a);
      const bIndex = KNOWN_CATEGORY_ORDER.indexOf(b);
      if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });

    return ["All", ...present];
  }, [allEntries]);
}
