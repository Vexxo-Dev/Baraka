import { I18nManager, Platform, Pressable, StyleSheet, Switch } from "react-native";
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@context/ThemeContext";
import { radius } from "@constants/radius";

interface AppSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 26;
const THUMB_SIZE = 22;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 4;
const STRETCH_SCALE_X = 1.35;
const STRETCH_SCALE_Y = 0.72;

function AppSwitchIOS({ value, onValueChange, disabled }: AppSwitchProps) {
  const { colors: C } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: C.border, true: C.tint + "80" }}
      thumbColor={value ? C.tint : C.textMuted}
      ios_backgroundColor={C.border}
    />
  );
}

function AppSwitchAndroid({ value, onValueChange, disabled }: AppSwitchProps) {
  const { colors: C } = useTheme();

  const travel = I18nManager.isRTL ? -THUMB_TRAVEL : THUMB_TRAVEL;

  const progress = useDerivedValue(() =>
    withTiming(value ? 1 : 0, {
      duration: 280,
      easing: Easing.inOut(Easing.quad),
    }),
  );

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [C.border, C.tint + "80"],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, travel]);
    const scaleX = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, STRETCH_SCALE_X, 1],
    );
    const scaleY = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, STRETCH_SCALE_Y, 1],
    );

    return {
      transform: [{ translateX }, { scaleX }, { scaleY }],
      backgroundColor: interpolateColor(progress.value, [0, 1], [C.textMuted, C.tint]),
    };
  });

  const handlePress = () => {
    if (disabled) return;
    onValueChange(!value);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={disabled && styles.disabled}
    >
      <Animated.View style={[styles.track, trackStyle]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

export function AppSwitch(props: AppSwitchProps) {
  return Platform.OS === "ios" ? (
    <AppSwitchIOS {...props} />
  ) : (
    <AppSwitchAndroid {...props} />
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: radius.full,
    padding: 2,
    justifyContent: "center",
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: radius.full,
  },
  disabled: {
    opacity: 0.5,
  },
});
