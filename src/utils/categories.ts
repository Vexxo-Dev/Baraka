const CATEGORY_ICONS: Record<string, any> = {
  worship: "star",
  daily: "sun",
  productivity: "briefcase",
  health: "activity",
  relationships: "heart",
  learning: "book-open",
};

export function getCategoryIcon(cat: string) {
  return CATEGORY_ICONS[cat] || "circle";
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
