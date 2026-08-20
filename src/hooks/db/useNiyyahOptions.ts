import { useMemo } from "react";
import { eq } from "drizzle-orm";
import * as Sentry from "@sentry/react-native";
import { useLanguage } from "@i18n";
import { db } from "@/db/db";
import {
  niyyahOptions,
  niyyahProfileTags,
  niyyahSources,
  customNiyyahOptions,
} from "@/db/schema";
import { useSafeLiveQuery } from "./useSafeLiveQuery";

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

    // Reads seeded content synchronously; if migrations/seed haven't run yet
    // (e.g. an early boot race) the underlying tables may not exist, so this
    // can throw. Degrade to an empty list instead of crashing the tree.
    try {
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
    } catch (err) {
      Sentry.captureException(err, {
        tags: { feature: "db" },
        extra: { table: "niyyah_options", activityId },
      });
      return [];
    }
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

  const { data } = useSafeLiveQuery(query, [activityId, language], "custom_niyyah_options");

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

    try {
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
    } catch (err) {
      Sentry.captureException(err, {
        tags: { feature: "db" },
        extra: { table: "niyyah_options", niyyahId },
      });
      return null;
    }
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
