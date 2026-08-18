import JournalCard from "@components/Journal/JournalCard";
import { JournalEntryForm } from "@components/Journal/JournalEntryForm";
import { AnimatedPressable } from "@components/UI/AnimatedPressable";
import { AppBottomSheet } from "@components/UI/AppBottomSheet";
import { AppButton } from "@components/UI/AppButton";
import { AppText } from "@components/UI/AppText";
import { AppTextInput } from "@components/UI/AppTextInput";
import { ChipSelector } from "@components/UI/ChipSelector";
import { EmptyState } from "@components/UI/EmptyState";
import { JournalCardSkeletonList } from "@components/Journal/JournalCardSkeleton";
import { useTheme } from "@context/ThemeContext";
import { Feather } from "@expo/vector-icons";

import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useFilteredJournal } from "@hooks/useFilteredJournal";
import { useJournalActions } from "@hooks/db/useJournalActions";
import { getActivityBilingualName } from "@hooks/db/useActivities";
import type { DbJournalEntry } from "@hooks/db/useJournal";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Platform, StyleSheet, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollViewCompat } from "@components/KeyboardAwareScrollViewCompat";
import { spacing } from "@constants/spacing";
import { radius } from "@constants/radius";

export default function JournalScreen() {
  const { t } = useTranslation();
  const { colors: C } = useTheme();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;

  const {
    journalEntries,
    enabledActivities,
    filtered,
    groupedLocalized,
    filterActivity,
    setFilterActivity,
    search,
    setSearch,
    isLoading,
  } = useFilteredJournal();

  const { addJournalEntry, updateJournalEntry, deleteJournalEntry } =
    useJournalActions();

  const [showAdd, setShowAdd] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DbJournalEntry | undefined>(
    undefined,
  );
  const [selectedEntry, setSelectedEntry] = useState<
    DbJournalEntry | undefined
  >(undefined);
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const handleSave = async (data: { activityId: string; note: string }) => {
    const { nameEn, nameAr } =
      data.activityId === "general"
        ? {
            nameEn: t("journal.general", { lng: "en" }),
            nameAr: t("journal.general", { lng: "ar" }),
          }
        : await getActivityBilingualName(
            data.activityId,
            enabledActivities.find((a) => a.id === data.activityId)
              ?.isCustom ?? false,
          );

    if (editingEntry) {
      await updateJournalEntry(editingEntry.id, {
        activityId: data.activityId,
        activityNameEn: nameEn,
        activityNameAr: nameAr,
        note: data.note,
      });
      setEditingEntry(undefined);
    } else {
      await addJournalEntry({
        activityId: data.activityId,
        activityNameEn: nameEn,
        activityNameAr: nameAr,
        note: data.note,
      });
    }
    setShowAdd(false);
  };

  const handleOptions = (entry: DbJournalEntry) => {
    setSelectedEntry(entry);
    bottomSheetRef.current?.present();
  };

  const confirmDelete = () => {
    if (selectedEntry) {
      deleteJournalEntry(selectedEntry.id);
      setSelectedEntry(undefined);
      bottomSheetRef.current?.dismiss();
    }
  };

  const filterOptions = [
    { label: t("category.All"), value: "__all__" },
    ...Array.from(new Set(journalEntries.map((e) => e.activityId))).map(
      (activityId) => {
        const firstEntry = journalEntries.find(
          (e) => e.activityId === activityId,
        );
        return {
          label: firstEntry
            ? firstEntry.activityName || t("journal.general")
            : t("journal.general"),
          value: activityId,
        };
      },
    ),
  ];

  return (
    <View style={[styles.container, { backgroundColor: C.background }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPadding + spacing.lg,
            paddingBottom: isWeb ? 34 + 84 : 60 + insets.bottom + spacing.xxl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'
      >
        <View style={styles.header}>
          <View>
            <AppText
              weight='Bold'
              variant='hero'
              style={[styles.title, { color: C.gold }]}
            >
              {t("journal.title")}
            </AppText>
            <AppText
              weight='Regular'
              variant='body'
              style={[styles.subtitle, { color: C.textSecondary }]}
            >
              {t(
                journalEntries.length === 1
                  ? "journal.subtitle.one"
                  : "journal.subtitle.other",
                { count: journalEntries.length },
              )}
            </AppText>
          </View>
          <AnimatedPressable
            onPress={() => {
              if (showAdd) {
                setShowAdd(false);
                setEditingEntry(undefined);
              } else {
                setShowAdd(true);
              }
            }}
            style={[styles.addButton, { backgroundColor: C.tint }]}
          >
            <Feather
              name={showAdd ? "x" : "feather"}
              size={20}
              color={C.background}
            />
          </AnimatedPressable>
        </View>

        {showAdd && (
          <JournalEntryForm
            entry={editingEntry}
            enabledActivities={enabledActivities}
            onSave={handleSave}
            onCancel={() => {
              setShowAdd(false);
              setEditingEntry(undefined);
            }}
          />
        )}

        {journalEntries.length > 0 && (
          <View style={{ marginBottom: spacing.md }}>
            <AppTextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t("journal.searchPlaceholder")}
              leftIcon='search'
              rightIcon={
                search.length > 0 ? (
                  <AnimatedPressable onPress={() => setSearch("")}>
                    <Feather name='x' size={16} color={C.textMuted} />
                  </AnimatedPressable>
                ) : undefined
              }
            />
          </View>
        )}

        {filterOptions.length > 2 && (
          <ChipSelector
            items={filterOptions}
            selectedValue={filterActivity}
            onSelect={setFilterActivity}
            style={{ marginHorizontal: -spacing.xl }}
          />
        )}

        {isLoading && <JournalCardSkeletonList />}

        {!isLoading && journalEntries.length === 0 && !showAdd && (
          <EmptyState
            icon='feather'
            title={t("journal.empty.title")}
            message={t("journal.empty.message")}
            actionLabel={t("journal.empty.button")}
            onAction={() => setShowAdd(true)}
          />
        )}

        {Object.entries(groupedLocalized).map(([date, entries], outerIndex) => (
          <View key={date} style={styles.dateGroup}>
            <AppText
              weight='Bold'
              variant='footnote'
              style={[styles.dateGroupLabel, { color: C.gold }]}
            >
              {date}
            </AppText>
            <View style={{ gap: spacing.sm }}>
              {entries.map((entry, innerIndex) => (
                <Animated.View
                  key={entry.id}
                  entering={FadeInDown.delay(
                    (outerIndex * 2 + innerIndex) * 50,
                  ).duration(250)}
                >
                  <JournalCard entry={entry} onOptions={handleOptions} />
                </Animated.View>
              ))}
            </View>
          </View>
        ))}

        {filtered.length === 0 && journalEntries.length > 0 && (
          <EmptyState icon='search' message={t("journal.noFilterResults")} />
        )}
      </KeyboardAwareScrollViewCompat>

      <AppBottomSheet
        ref={bottomSheetRef}
        snapPoints={["30%"]}
        onClose={() => {
          setSelectedEntry(undefined);
        }}
      >
        <View style={[styles.sheetContent, { paddingBottom: spacing.xxxl }]}>
          <AppButton
            variant='outline'
            label={t("journal.editReflection", "Edit reflection")}
            icon='feather'
            onPress={() => {
              bottomSheetRef.current?.dismiss();
              setEditingEntry(selectedEntry);
              setShowAdd(true);
            }}
            style={{ width: "100%", marginBottom: spacing.md }}
          />
          <AppButton
            variant='destructive'
            label={t("journal.delete.confirm")}
            icon='trash-2'
            onPress={confirmDelete}
            style={{ width: "100%" }}
          />
        </View>
      </AppBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.xl },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.xl,
  },
  title: { marginBottom: spacing.xs },
  subtitle: {},
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  dateGroup: { marginBottom: spacing.xxl },
  dateGroupLabel: {
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sheetContent: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
