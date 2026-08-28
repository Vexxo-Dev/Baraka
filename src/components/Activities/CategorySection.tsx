import { memo, useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { getCategoryIcon, getCategoryLabel } from "@utils/categories";
import { AppIcon } from "@components/UI/AppIcon";
import { useTranslation } from "react-i18next";
import { AppText } from "@components/UI/AppText";
import type { DbUserActivity } from "@hooks/db/useActivities";
import { useTheme } from "@context/ThemeContext";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";
import { AnimatedPressable } from "@components/UI/AnimatedPressable";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

import { ActivityRow } from "./ActivityRow";

interface CategorySectionProps {
  category: string;
  categoryActivities: DbUserActivity[];
  onToggleActivity: (activity: DbUserActivity) => void;
  onManageActivity: (activity: DbUserActivity) => void;
  isRecentlyToggled?: boolean;
}

export default memo(function CategorySection({
  category,
  categoryActivities,
  onToggleActivity,
  onManageActivity,
  isRecentlyToggled,
}: CategorySectionProps) {
  const { t } = useTranslation();
  const { colors: C } = useTheme();

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (isRecentlyToggled) {
      setIsExpanded(true);
    }
  }, [isRecentlyToggled]);

  if (categoryActivities.length === 0) return null;

  const enabledCount = categoryActivities.filter((a) => a.enabled).length;
  const totalCount = categoryActivities.length;

  const rotation = useDerivedValue(() => {
    return withTiming(isExpanded ? 180 : 0, { duration: 250 });
  });

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  return (
    <Animated.View
      style={styles.categorySection}
      layout={LinearTransition.duration(250)}
    >
      <AnimatedPressable
        onPress={() => setIsExpanded(!isExpanded)}
        style={styles.categoryHeader}
      >
        <View style={styles.headerLeft}>
          <AppIcon
            {...getCategoryIcon(category)}
            size={14}
            color={C.textSecondary}
          />
          <AppText
            weight='Bold'
            variant='caption'
            style={[styles.categoryLabel, { color: C.textSecondary }]}
          >
            {getCategoryLabel(category, t)} · {enabledCount}/{totalCount}
          </AppText>
        </View>
        <Animated.View style={chevronStyle}>
          <Feather name='chevron-down' size={16} color={C.textSecondary} />
        </Animated.View>
      </AnimatedPressable>

      {isExpanded && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={[
            styles.categoryCard,
            { backgroundColor: C.backgroundCard, borderColor: C.border },
          ]}
        >
          {categoryActivities.map((activity, index) => (
            <View key={activity.id}>
              <ActivityRow
                activity={activity}
                onToggle={onToggleActivity}
                onManage={onManageActivity}
                colors={C}
              />
              {index < categoryActivities.length - 1 && (
                <View
                  style={[styles.divider, { backgroundColor: C.borderLight }]}
                />
              )}
            </View>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  categorySection: { marginBottom: spacing.xl },
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  categoryLabel: { textTransform: "uppercase", letterSpacing: 1 },
  categoryCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  divider: { height: 1, marginStart: spacing.md },
});
