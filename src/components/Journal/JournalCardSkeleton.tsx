import { StyleSheet, View } from "react-native";
import { Skeleton } from "@components/UI/Skeleton";
import { useTheme } from "@context/ThemeContext";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";

export function JournalCardSkeleton() {
  const { colors: C } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: C.backgroundCard, borderColor: C.border },
      ]}
    >
      <View style={styles.cardHeader}>
        <Skeleton width={70} height={22} borderRadius={radius.sm} />
        <Skeleton width={60} height={14} borderRadius={radius.sm} />
      </View>
      <Skeleton width='100%' height={16} borderRadius={radius.sm} />
      <Skeleton width='75%' height={16} borderRadius={radius.sm} />
    </View>
  );
}

export function JournalCardSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <JournalCardSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
