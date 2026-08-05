import { Feather } from "@expo/vector-icons";
import { Haptic } from "@utils/haptics";
import { StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  LinearTransition,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import { AnimatedPressable } from "./UI/AnimatedPressable";
import type { DbUserActivity } from "@hooks/db/useActivities";
import { AppText } from "@components/UI/AppText";
import { useTheme } from "@context/ThemeContext";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";

type Props = {
  activity: DbUserActivity;
  completed: boolean;
  onToggle: () => void;
  onPress: () => void;
  compact?: boolean;
};

export default function NiyyahCard({
  activity,
  completed,
  onToggle,
  onPress,
  compact = false,
}: Props) {
  const isCompact = compact && completed;
  const { colors: C } = useTheme();
  const checkScale = useSharedValue(1);

  const handleCheckPress = async () => {
    checkScale.value = withSequence(
      withTiming(0.94, { duration: 80 }),
      withSpring(1, { damping: 15, stiffness: 300 }),
    );
    Haptic.selection();
    onToggle();
  };

  const displayName = activity.name;
  const displayNiyyah = activity.customNiyyahText ?? activity.niyyahText;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <Animated.View
      layout={LinearTransition.duration(280)}
      style={[animatedStyle, { marginBottom: spacing.sm }]}
    >
      <AnimatedPressable
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: completed ? C.successLight : C.backgroundCard,
            borderColor: completed ? C.tint + "40" : C.border,
          },
        ]}
      >
        <Animated.View
          layout={LinearTransition.duration(280)}
          style={[styles.content, isCompact && styles.contentCompact]}
        >
          <Animated.View
            layout={LinearTransition.duration(280)}
            style={styles.textContainer}
          >
            <View style={styles.nameRow}>
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
                style={[
                  styles.sidePill,
                  { backgroundColor: C.tint },
                ]}
              />
              <AppText
                weight='Bold'
                variant='bodyLarge'
                style={{ color: completed ? C.tint : C.text, flexShrink: 1 }}
                numberOfLines={1}
              >
                {displayName}
              </AppText>
            </View>
            {!isCompact && (
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(150)}
              >
                <AppText
                  weight='Regular'
                  variant='footnote'
                  style={{ lineHeight: 24, color: C.textSecondary }}
                  numberOfLines={2}
                >
                  {displayNiyyah}
                </AppText>
              </Animated.View>
            )}
          </Animated.View>

          <View style={styles.checkWrapper}>
            <AnimatedPressable
              onPress={handleCheckPress}
              hitSlop={28}
              style={[
                styles.checkButton,
                {
                  backgroundColor: completed ? C.gold : "transparent",
                  borderColor: completed ? C.gold : C.border,
                  borderWidth: 1.5,
                },
              ]}
            >
              {completed && (
                <Feather name='check' size={11} color={C.textOnTint} />
              )}
            </AnimatedPressable>
            {!completed && (
              <View
                style={[
                  styles.checkDot,
                  { backgroundColor: C.tint, borderColor: C.backgroundCard },
                ]}
              />
            )}
          </View>
        </Animated.View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    flexDirection: "row",
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  contentCompact: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  textContainer: { flex: 1, gap: 3 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginStart: -spacing.md },
  checkButton: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  checkWrapper: {
    position: "relative",
  },
  checkDot: {
    position: "absolute",
    bottom: -2.5,
    right: -2.5,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  sidePill: {
    width: 3.5,
    height: '100%',
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
});
