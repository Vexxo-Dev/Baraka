import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Skeleton } from "@components/UI/Skeleton";
import { useTheme } from "@context/ThemeContext";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";

export function ActivityDetailSkeleton() {
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const topPadding = insets.top;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: C.background, paddingTop: topPadding + spacing.lg },
      ]}
    >
      <Skeleton width='60%' height={28} borderRadius={radius.sm} />
      <Skeleton width='90%' height={16} borderRadius={radius.sm} style={styles.spacedLine} />
      <Skeleton width='40%' height={16} borderRadius={radius.sm} />

      <View style={styles.checklist}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.optionRow,
              { backgroundColor: C.backgroundCard, borderColor: C.border },
            ]}
          >
            <Skeleton width={20} height={20} borderRadius={radius.sm} />
            <Skeleton width='70%' height={16} borderRadius={radius.sm} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.xl },
  spacedLine: { marginTop: spacing.lg },
  checklist: { marginTop: spacing.xxl, gap: spacing.sm },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
