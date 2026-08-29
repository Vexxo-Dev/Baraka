import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@components/UI/AppText";
import { AnimatedPressable } from "@components/UI/AnimatedPressable";
import { AppTextInput } from "@components/UI/AppTextInput";
import { AppButton } from "@components/UI/AppButton";
import { AppIcon as Feather } from "@components/UI/AppIcon";
import { useTranslation } from "react-i18next";
import { useTheme } from "@context/ThemeContext";
import type { DbNiyyahOption } from "@hooks/db/useNiyyahOptions";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";

interface NiyyahChecklistProps {
  allAdvanced: DbNiyyahOption[];
  localSelected: string[];
  onToggleNiyyah: (id: string) => void;
  onAddCustomNiyyah: (text: string) => void;
  onDeleteCustomNiyyah: (optionId: string) => void;
}

import { ChecklistRow } from "./ChecklistRow";

export const NiyyahChecklist = React.memo(
  ({
    allAdvanced,
    localSelected,
    onToggleNiyyah,
    onAddCustomNiyyah,
    onDeleteCustomNiyyah,
  }: NiyyahChecklistProps) => {
    const { t } = useTranslation();
    const { colors: C } = useTheme();

    const [showAddCustom, setShowAddCustom] = useState(false);
    const [customText, setCustomText] = useState("");

    const handleAdd = () => {
      onAddCustomNiyyah(customText);
      setCustomText("");
      setShowAddCustom(false);
    };

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: C.backgroundCard, borderColor: C.border },
        ]}
      >
        <View style={styles.cardHeader}>
          <AppText
            weight='Medium'
            variant='caption'
            style={[styles.sectionLabel, { color: C.gold }]}
          >
            {t("activity.multiplyIntentions")}
          </AppText>
          <AppText weight='Bold' variant='caption' style={{ color: C.tint }}>
            {t("activity.selectedCount", { count: localSelected.length })}
          </AppText>
        </View>
        <AppText
          weight='Regular'
          variant='footnote'
          style={[styles.multiHint, { color: C.textMuted }]}
        >
          {t("activity.multiHint")}
        </AppText>

        {allAdvanced.map((option) => (
          <ChecklistRow
            key={option.id}
            option={option}
            checked={localSelected.includes(option.id)}
            onToggleNiyyah={onToggleNiyyah}
            onDeleteCustomNiyyah={onDeleteCustomNiyyah}
          />
        ))}

        {!showAddCustom ? (
          <AnimatedPressable
            onPress={() => setShowAddCustom(true)}
            style={[styles.addCustomBtn, { borderColor: C.tint + "66" }]}
          >
            <Feather name='plus' size={14} color={C.tintLight} />
            <AppText
              weight='Medium'
              variant='body'
              style={{ color: C.tintLight }}
            >
              {t("activity.addCustomIntention")}
            </AppText>
          </AnimatedPressable>
        ) : (
          <View
            style={[
              styles.customInputCard,
              {
                backgroundColor: C.backgroundCard,
                borderColor: C.border,
              },
            ]}
          >
            <AppTextInput
              value={customText}
              onChangeText={setCustomText}
              placeholder={t("activity.customNiyyahPlaceholder")}
              multiline
              autoFocus
            />
            <View style={styles.editActions}>
              <AppButton
                variant='ghost'
                label={t("common.cancel")}
                onPress={() => setShowAddCustom(false)}
              />
              <AppButton
                variant='primary'
                label={t("common.add")}
                onPress={handleAdd}
                disabled={!customText.trim()}
              />
            </View>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  multiHint: { marginTop: -spacing.xs, lineHeight: 18 },
  addCustomBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: "dashed",
    marginTop: spacing.sm,
  },
  customInputCard: {
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  editActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
    justifyContent: "flex-end",
  },
});
