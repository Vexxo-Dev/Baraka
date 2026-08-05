import categoriesSeed from "./seed/v1.0.0/categories.json";
import activitiesSeed from "./seed/v1.0.0/activities.json";
import niyyahOptionsSeed from "./seed/v1.0.0/niyyah_options.json";
import niyyahProfileTagsSeed from "./seed/v1.0.0/niyyah_profile_tags.json";
import niyyahSourcesSeed from "./seed/v1.0.0/niyyah_sources.json";
import learnContentSeed from "./seed/v1.0.0/learn_content.json";

export {
  categoriesSeed,
  activitiesSeed,
  niyyahOptionsSeed,
  niyyahProfileTagsSeed,
  niyyahSourcesSeed,
  learnContentSeed,
};

export type CategoryRow = (typeof categoriesSeed)[number];
export type ActivityRow = (typeof activitiesSeed)[number];
export type NiyyahOptionRow = (typeof niyyahOptionsSeed)[number];
export type NiyyahProfileTagRow = (typeof niyyahProfileTagsSeed)[number];
export type LearnContentRow = (typeof learnContentSeed)[number];

export type NiyyahSourceRow = {
  id: string;
  niyyah_id: string;
  type: "quran" | "hadith" | "athar" | "scholar";
  text_en: string;
  text_ar: string;
  reference_en: string;
  reference_ar: string;
  sort_order: number;
};

export function mapCategory(row: CategoryRow) {
  return {
    id: row.id,
    labelEn: row.label_en,
    labelAr: row.label_ar,
    icon: row.icon,
    isCustom: row.is_custom,
    sortOrder: row.sort_order,
  };
}

export function mapActivity(row: ActivityRow) {
  return {
    id: row.id,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    category: row.category,
    niyyahTextEn: row.niyyah_text_en,
    niyyahTextAr: row.niyyah_text_ar,
    hadithRefEn: row.hadith_ref_en,
    hadithRefAr: row.hadith_ref_ar,
    defaultTime: row.default_time,
    sortOrder: row.sort_order,
  };
}

export function mapNiyyahOption(row: NiyyahOptionRow) {
  return {
    id: row.id,
    activityId: row.activity_id,
    textEn: row.text_en,
    textAr: row.text_ar,
    sourceEn: row.source_en,
    sourceAr: row.source_ar,
    sortOrder: row.sort_order,
  };
}

export function mapNiyyahProfileTag(row: NiyyahProfileTagRow) {
  return {
    niyyahId: row.niyyah_id,
    tag: row.tag,
  };
}

export function mapNiyyahSource(row: NiyyahSourceRow) {
  return {
    id: row.id,
    niyyahId: row.niyyah_id,
    type: row.type,
    textEn: row.text_en,
    textAr: row.text_ar,
    referenceEn: row.reference_en,
    referenceAr: row.reference_ar,
    sortOrder: row.sort_order,
  };
}

export function mapLearnContentRow(row: LearnContentRow) {
  return {
    id: row.id,
    titleEn: row.title_en,
    titleAr: row.title_ar,
    category: row.category,
    contentEn: row.content_en,
    contentAr: row.content_ar,
    sourceEn: row.source_en,
    sourceAr: row.source_ar,
    keywords: row.keywords,
    sortOrder: row.sort_order,
  };
}
