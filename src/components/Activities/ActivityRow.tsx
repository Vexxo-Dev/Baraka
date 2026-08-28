import { memo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { AppSwitch } from "@components/UI/AppSwitch";
import { AppText } from "@components/UI/AppText";
import type { DbUserActivity } from "@hooks/db/useActivities";
import { spacing } from "@constants/spacing";
import { AnimatedPressable } from "@components/UI/AnimatedPressable";
import { Feather } from "@expo/vector-icons";

export interface ActivityRowProps {
  activity: DbUserActivity;
  onToggle: (activity: DbUserActivity) => void;
  onManage: (activity: DbUserActivity) => void;
  colors: any;
}

export const ActivityRow = memo(
  ({ activity, onToggle, onManage, colors: C }: ActivityRowProps) => {
    const handleToggle = useCallback(() => {
      onToggle(activity);
    }, [activity, onToggle]);

    return (
      <View style={styles.activityRow}>
        <View style={styles.activityInfo}>
          <AppText
            weight='Medium'
            variant='bodyLarge'
            style={{ color: C.text }}
          >
            {activity.name}
          </AppText>
        </View>
        {activity.isCustom && (
          <AnimatedPressable
            onPress={() => onManage(activity)}
            style={styles.manageBtn}
          >
            <Feather name='more-vertical' size={20} color={C.textSecondary} />
          </AnimatedPressable>
        )}
        <AppSwitch value={activity.enabled} onValueChange={handleToggle} />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  activityInfo: { flex: 1, gap: spacing.xs },
  manageBtn: {
    padding: spacing.xs,
  },
});

