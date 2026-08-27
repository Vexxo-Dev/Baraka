import type { AppIconFamily, FeatherIconName, MaterialCommunityIconName } from "@components/UI/AppIcon";

type CategoryIcon = { name: FeatherIconName | MaterialCommunityIconName; family?: AppIconFamily };

const CATEGORY_ICONS: Record<string, CategoryIcon> = {
  worship: { name: "mosque-outline", family: "materialCommunity" },
  daily: { name: "sun" },
  productivity: { name: "briefcase" },
  health: { name: "activity" },
  relationships: { name: "heart" },
  learning: { name: "book-open" },
};

export function getCategoryIcon(cat: string): CategoryIcon {
  return CATEGORY_ICONS[cat] || { name: "circle" };
}

export function getCategoryLabel(cat: string, t: any) {
  const labels: Record<string, string> = {
    worship: t("manageActivities.category.worship"),
    daily: t("manageActivities.category.daily"),
    productivity: t("manageActivities.category.productivity"),
    health: t("manageActivities.category.health"),
    relationships: t("manageActivities.category.relationships"),
    learning: t("manageActivities.category.learning"),
  };
  return labels[cat] || cat;
}
