import { useMemo } from "react";
import { eq } from "drizzle-orm";
import { useLiveQuery } from "drizzle-orm/expo-sqlite";
import { useLanguage } from "@i18n";
import { db } from "@/db/db";
import {
  niyyahOptions,
  niyyahProfileTags,
  niyyahSources,
  customNiyyahOptions,
} from "@/db/schema";

export type DbNiyyahOption = {
  id: string;
  text: string;
  source: string | null;
  isCustom: boolean;
  profileTags: string[];
};

function useSeededOptions(
  activityId: string | undefined,
  language: string,
  profileTagsKey: string,
  profileTags: string[],
): DbNiyyahOption[] {
  return useMemo(() => {
    if (!activityId) return [];

    const options = db
      .select({
        id: niyyahOptions.id,
        text: language === "ar" ? niyyahOptions.textAr : niyyahOptions.textEn,
        source:
          language === "ar" ? niyyahOptions.sourceAr : niyyahOptions.sourceEn,
      })
      .from(niyyahOptions)
      .where(eq(niyyahOptions.activityId, activityId))
      .all();

    const tagRows = db.select().from(niyyahProfileTags).all();

    const sourceRows = db
      .select({
        niyyahId: niyyahSources.niyyahId,
        text: language === "ar" ? niyyahSources.textAr : niyyahSources.textEn,
      })
      .from(niyyahSources)
      .all();

    const visible = options.filter((opt) => {
      const tags = tagRows
        .filter((t) => t.niyyahId === opt.id)
        .map((t) => t.tag);
      return tags.length === 0 || tags.some((tag) => profileTags.includes(tag));
    });

    return visible.map((opt) => {
      const source = sourceRows.find((s) => s.niyyahId === opt.id);
      const tags = tagRows
        .filter((t) => t.niyyahId === opt.id)
        .map((t) => t.tag);
      return {
        id: opt.id,
        text: opt.text,
        source: source ? source.text : (opt.source ?? null),
        isCustom: false,
        profileTags: tags,
      };
    });
  }, [activityId, language, profileTagsKey]);
}

function useCustomOptions(
  activityId: string | undefined,
  language: string,
): DbNiyyahOption[] {
  const query = useMemo(
    () =>
      db
        .select({
          id: customNiyyahOptions.id,
          text:
            language === "ar"
              ? customNiyyahOptions.textAr
              : customNiyyahOptions.textEn,
        })
        .from(customNiyyahOptions)
        .where(eq(customNiyyahOptions.activityId, activityId ?? "")),
    [activityId, language],
  );

  const { data } = useLiveQuery(query, [activityId, language]);

  return (data ?? []).map((row) => ({
    id: row.id,
    text: row.text,
    source: null,
    isCustom: true,
    profileTags: [],
  }));
}

export function useNiyyahTextById(
  niyyahId: string | null | undefined,
): string | null {
  const { language } = useLanguage();

  return useMemo(() => {
    if (!niyyahId) return null;

    if (niyyahId.startsWith("custom_")) {
      const [row] = db
        .select({
          text:
            language === "ar"
              ? customNiyyahOptions.textAr
              : customNiyyahOptions.textEn,
        })
        .from(customNiyyahOptions)
        .where(eq(customNiyyahOptions.id, niyyahId))
        .all();
      return row?.text ?? null;
    }

    const [row] = db
      .select({
        text: language === "ar" ? niyyahOptions.textAr : niyyahOptions.textEn,
      })
      .from(niyyahOptions)
      .where(eq(niyyahOptions.id, niyyahId))
      .all();
    return row?.text ?? null;
  }, [niyyahId, language]);
}

export function useNiyyahOptions(
  activityId: string | undefined,
  profileTags: string[] = [],
): DbNiyyahOption[] {
  const { language } = useLanguage();
  const profileTagsKey = profileTags.join(",");

  const seeded = useSeededOptions(
    activityId,
    language,
    profileTagsKey,
    profileTags,
  );
  const custom = useCustomOptions(activityId, language);

  return useMemo(() => [...seeded, ...custom], [seeded, custom]);
}
