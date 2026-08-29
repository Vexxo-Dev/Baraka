import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { AppText } from "@components/UI/AppText";
import { AnimatedPressable } from "@components/UI/AnimatedPressable";
import { AppIcon as Feather } from "@components/UI/AppIcon";
import { useTranslation } from "react-i18next";
import { useTheme } from "@context/ThemeContext";
import { getRoleByTag } from "@utils/roleHelpers";
import type { DbNiyyahOption } from "@hooks/db/useNiyyahOptions";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";

interface ChecklistRowProps {
  option: DbNiyyahOption;
  checked: boolean;
  onToggleNiyyah: (id: string) => void;
  onDeleteCustomNiyyah: (id: string) => void;
}

export const ChecklistRow = React.memo(
  ({ option, checked, onToggleNiyyah, onDeleteCustomNiyyah }: ChecklistRowProps) => {
    const { t } = useTranslation();
    const { colors: C } = useTheme();
    const [isMultiline, setIsMultiline] = useState(false);

    return (
      <AnimatedPressable
        onPress={() => onToggleNiyyah(option.id)}
        style={[
          styles.niyyahOption,
          {
            backgroundColor: checked ? C.tint + "15" : C.backgroundSubtle,
            borderColor: checked ? C.tint + "88" : C.border,
          },
        ]}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: checked ? C.tint : "transparent",
              borderColor: checked ? C.tint : C.border,
            },
          ]}
        >
          {checked && <Feather name='check' size={12} color={C.background} />}
        </View>
        <View style={{ flex: 1 }}>
          <AppText
            onTextLayout={(e) => {
              const multi = e.nativeEvent.lines.length > 1;
              if (multi !== isMultiline) setIsMultiline(multi);
            }}
            weight={checked ? "Medium" : "Regular"}
            variant='body'
            style={[
              { color: checked ? C.text : C.textSecondary },
              isMultiline && { lineHeight: 22 },
            ]}
          >
            {option.text}
          </AppText>
          {option.profileTags && option.profileTags.length > 0 && (
            <View style={styles.roleBadgeRow}>
              {option.profileTags.map((tag) => {
                const role = getRoleByTag(tag);
                const roleColor = role?.color || C.tint;
                const roleIcon = (role?.icon || "star") as any;
                return (
                  <View
                    key={tag}
                    style={[
                      styles.roleBadge,
                      { backgroundColor: roleColor + "20" },
                    ]}
                  >
                    <Feather name={roleIcon} size={10} color={roleColor} />
                    <AppText
                      weight='Medium'
                      variant='caption'
                      style={{ color: roleColor }}
                    >
                      {t(`settings.role.${tag}`)}
                    </AppText>
                  </View>
                );
              })}
            </View>
          )}
        </View>
        {option.isCustom && (
          <AnimatedPressable
            onPress={() => onDeleteCustomNiyyah(option.id)}
            hitSlop={12}
            style={styles.deleteButton}
          >
            <Feather name='trash-2' size={16} color={C.textMuted} />
          </AnimatedPressable>
        )}
      </AnimatedPressable>
    );
  }
);

const styles = StyleSheet.create({
  niyyahOption: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
    flexShrink: 0,
  },
  roleBadgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: "flex-start",
  },
  deleteButton: {
    padding: spacing.xs,
    marginTop: 1,
  },
});

