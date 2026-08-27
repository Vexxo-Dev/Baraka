import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import {
  StyleSheet,
  View,
} from "react-native";
import { KeyboardAwareScrollViewCompat } from "@components/KeyboardAwareScrollViewCompat";
import { AnimatedPressable } from "@components/UI/AnimatedPressable";
import { AppIcon } from "@components/UI/AppIcon";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppText } from "@components/UI/AppText";
import { type DbLearnEntry } from "@hooks/db/useLearnContent";
import { useTheme } from "@context/ThemeContext";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";

interface EducationDetailProps {
  entry: DbLearnEntry;
  onClose: () => void;
}

export default function EducationDetail({
  entry,
  onClose,
}: EducationDetailProps) {
  const { t } = useTranslation();
  const { colors: C, isDark } = useTheme();
  const insets = useSafeAreaInsets();


  return (
    <View style={[styles.detailContainer, { backgroundColor: C.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.detailContent,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <AnimatedPressable
          onPress={onClose}
          style={[
            styles.closeButton,
            { backgroundColor: C.backgroundSubtle, borderColor: C.border },
          ]}
        >
          <AppIcon
            name="chevron-left"
            size={24}
            color={C.text}
            flipRTL
          />
        </AnimatedPressable>

        <LinearGradient
          colors={C.cardGradient}
          style={[
            styles.detailHeader,
            {
              shadowColor: isDark ? "transparent" : C.shadowColor,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDark ? 0 : 0.08,
              shadowRadius: 4,
              elevation: isDark ? 0 : 2,
            },
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View
            style={[
              styles.detailCategoryBadge,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.15)"
                  : C.backgroundSubtle,
              },
            ]}
          >
            <AppText weight='Medium' variant='caption' style={{ color: C.textSecondary }}>
              {t("category." + entry.category)}
            </AppText>
          </View>
          <AppText weight='Bold' variant='titleLarge' style={[styles.detailTitle, { color: C.text }]}>
            {entry.title}
          </AppText>
        </LinearGradient>

        <View
          style={[
            styles.detailBody,
            { backgroundColor: C.backgroundCard, borderColor: C.border },
          ]}
        >
          <AppText weight='Regular' variant='bodyLarge' style={[styles.detailText, { color: C.text }]}>
            {entry.content}
          </AppText>
        </View>

        <View
          style={[
            styles.sourceCard,
            { backgroundColor: C.successLight, borderColor: C.tint + "30" },
          ]}
        >
          <MaterialCommunityIcons name='format-quote-open' size={16} color={C.tint} />
          <View style={{ flex: 1 }}>
            <AppText weight='Bold' variant='caption' style={{ color: C.tint }}>
              {t("common.source")}
            </AppText>
            <AppText weight='Regular' variant='body' style={{ color: C.tint }}>
              {entry.source}
            </AppText>
          </View>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  detailContainer: { flex: 1 },
  detailContent: { paddingHorizontal: spacing.xl },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  detailHeader: {
    borderRadius: radius.lg,
    padding: spacing.xxl,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  detailCategoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
  },
  detailTitle: { lineHeight: 32 },
  detailBody: {
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  detailText: { lineHeight: 26 },
  sourceCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
