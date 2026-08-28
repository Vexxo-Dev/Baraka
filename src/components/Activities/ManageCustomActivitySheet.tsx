import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { AppBottomSheet } from "@components/UI/AppBottomSheet";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { AppText } from "@components/UI/AppText";
import { AppButton } from "@components/UI/AppButton";
import { AppTextInput } from "@components/UI/AppTextInput";
import { AnimatedPressable } from "@components/UI/AnimatedPressable";
import { useTranslation } from "react-i18next";
import { useTheme } from "@context/ThemeContext";
import { spacing } from "@constants/spacing";
import type { DbUserActivity } from "@hooks/db/useActivities";
import { Haptic } from "@utils/haptics";

interface ManageCustomActivitySheetProps {
  activity: DbUserActivity | null;
  onRename: (activityId: string, name: string) => void;
  onDelete: (activityId: string) => void;
  onClose: () => void;
}

export const ManageCustomActivitySheet = React.forwardRef<
  BottomSheetModal,
  ManageCustomActivitySheetProps
>(({ activity, onRename, onDelete, onClose }, ref) => {
  const { t } = useTranslation();
  const { colors: C } = useTheme();

  const [mode, setMode] = useState<"edit" | "confirmDelete">("edit");
  const [name, setName] = useState("");

  useEffect(() => {
    if (activity) {
      setName(activity.name);
      setMode("edit");
    }
  }, [activity?.id]);

  const handleSave = () => {
    if (!activity) return;
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(
        t("manageActivities.alert.nameRequiredTitle"),
        t("manageActivities.alert.nameRequiredMessage"),
      );
      return;
    }
    onRename(activity.id, trimmed);
    Haptic.success();
    onClose();
  };

  const handleConfirmDelete = () => {
    if (!activity) return;
    onDelete(activity.id);
    Haptic.success();
    onClose();
  };

  const handleEnterConfirm = () => {
    Haptic.warning();
    setMode("confirmDelete");
  };

  const handleCancelConfirm = () => {
    setMode("edit");
  };

  return (
    <AppBottomSheet ref={ref} snapPoints={["45%"]} enablePanDownToClose>
      {mode === "edit" ? (
        <View style={styles.container}>
          <AppText weight='Bold' variant='title' style={styles.title}>
            {t("manageActivities.renameTitle")}
          </AppText>
          <AppTextInput
            bottomSheet
            value={name}
            onChangeText={setName}
            placeholder={t("manageActivities.renamePlaceholder")}
          />
          <AppButton
            variant='primary'
            label={t("common.save")}
            onPress={handleSave}
            disabled={!name.trim()}
          />
          <View style={[styles.divider, { backgroundColor: C.border }]} />
          <AnimatedPressable
            onPress={handleEnterConfirm}
            style={styles.deleteRow}
          >
            <AppText
              weight='Medium'
              variant='bodyLarge'
              style={{ color: C.error }}
            >
              {t("manageActivities.deleteActivity")}
            </AppText>
          </AnimatedPressable>
        </View>
      ) : (
        <View style={styles.container}>
          <AppText
            weight='Bold'
            variant='title'
            style={[styles.title, { color: C.error }]}
          >
            {t("manageActivities.deleteConfirmTitle")}
          </AppText>
          <AppText
            weight='Regular'
            variant='bodyLarge'
            style={[styles.sheetDesc, { color: C.textSecondary }]}
          >
            {t("manageActivities.deleteConfirmMessage")}
          </AppText>
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <AppButton
                variant='outline'
                label={t("common.cancel")}
                onPress={handleCancelConfirm}
              />
            </View>
            <View style={styles.buttonWrapper}>
              <AppButton
                variant='destructive'
                label={t("manageActivities.deleteActivity")}
                onPress={handleConfirmDelete}
              />
            </View>
          </View>
        </View>
      )}
    </AppBottomSheet>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  title: {
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  divider: {
    height: 1,
    width: "100%",
    marginVertical: spacing.md,
  },
  deleteRow: {
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  sheetDesc: {
    textAlign: "center",
    marginBottom: spacing.xxl,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  buttonWrapper: {
    flex: 1,
  },
});
