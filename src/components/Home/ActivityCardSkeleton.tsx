import { StyleSheet, View } from "react-native";
import { Skeleton } from "@components/UI/Skeleton";
import { useTheme } from "@context/ThemeContext";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";

export function ActivityCardSkeleton() {
  const { colors: C } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.backgroundCard, borderColor: C.border },
      ]}
    >
      <View style={styles.textContainer}>
        <Skeleton width='55%' height={18} borderRadius={radius.sm} />
        <Skeleton width='90%' height={14} borderRadius={radius.sm} style={styles.line} />
        <Skeleton width='70%' height={14} borderRadius={radius.sm} style={styles.line} />
      </View>
      <Skeleton width={24} height={24} borderRadius={radius.sm} />
    </View>
  );
}

export function ActivityCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ marginBottom: spacing.sm }}>
          <ActivityCardSkeleton />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    gap: spacing.md,
  },
  textContainer: { flex: 1, gap: spacing.xs },
  line: { marginTop: 2 },
});
