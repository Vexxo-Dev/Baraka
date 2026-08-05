import { useLocalSearchParams, router } from "expo-router";
import { useLearnContent } from "@hooks/db/useLearnContent";
import EducationDetail from "@components/Learn/EducationDetail";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { AppText } from "@components/UI/AppText";

export default function LearnDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const entries = useLearnContent();

  const entry = entries.find((e) => e.id === id);

  if (!entry) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <AppText weight="Bold">{t("learn.noResults", "Entry not found")}</AppText>
      </View>
    );
  }

  return <EducationDetail entry={entry} onClose={() => router.back()} />;
}
