import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const categories = sqliteTable('categories', {
  id: text('id').primaryKey(),
  labelEn: text('label_en').notNull(),
  labelAr: text('label_ar').notNull(),
  icon: text('icon'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  sortOrder: integer('sort_order').notNull(),
});

export const activities = sqliteTable('activities', {
  id: text('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  category: text('category').notNull().references(() => categories.id),

  niyyahTextEn: text('niyyah_text_en').notNull(),
  niyyahTextAr: text('niyyah_text_ar').notNull(),
  hadithRefEn: text('hadith_ref_en'),
  hadithRefAr: text('hadith_ref_ar'),
  defaultTime: text('default_time'),
  sortOrder: integer('sort_order').notNull(),
});

export const niyyahOptions = sqliteTable('niyyah_options', {
  id: text('id').primaryKey(),
  activityId: text('activity_id')
    .notNull()
    .references(() => activities.id),
  textEn: text('text_en').notNull(),
  textAr: text('text_ar').notNull(),
  sourceEn: text('source_en'),
  sourceAr: text('source_ar'),
  sortOrder: integer('sort_order').notNull(),
});

export const niyyahProfileTags = sqliteTable('niyyah_profile_tags', {
  niyyahId: text('niyyah_id')
    .notNull()
    .references(() => niyyahOptions.id),
  tag: text('tag').notNull(),
});

export const niyyahSources = sqliteTable('niyyah_sources', {
  id: text('id').primaryKey(),
  niyyahId: text('niyyah_id')
    .notNull()
    .references(() => niyyahOptions.id),
  type: text('type', { enum: ['quran', 'hadith', 'athar', 'scholar'] }).notNull(),
  textEn: text('text_en').notNull(),
  textAr: text('text_ar').notNull(),
  referenceEn: text('reference_en').notNull(),
  referenceAr: text('reference_ar').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const learnContent = sqliteTable('learn_content', {
  id: text('id').primaryKey(),
  titleEn: text('title_en').notNull(),
  titleAr: text('title_ar').notNull(),
  category: text('category').notNull(),
  contentEn: text('content_en').notNull(),
  contentAr: text('content_ar').notNull(),
  sourceEn: text('source_en'),
  sourceAr: text('source_ar'),
  keywords: text('keywords'),
  sortOrder: integer('sort_order').notNull(),
});

export const contentMeta = sqliteTable('content_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});

export const userActivityPrefs = sqliteTable('user_activity_prefs', {
  activityId: text('activity_id')
    .primaryKey()
    .references(() => activities.id),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(false),
  customTime: text('custom_time'),
  customNiyyahText: text('custom_niyyah_text'),
});

export const customNiyyahOptions = sqliteTable('custom_niyyah_options', {
  id: text('id').primaryKey(),
  activityId: text('activity_id').notNull(), // not foreign key can belong to builtin or custom activities
  textEn: text('text_en').notNull(),
  textAr: text('text_ar').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const customActivities = sqliteTable('custom_activities', {
  id: text('id').primaryKey(),
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  category: text('category').notNull().default('daily').references(() => categories.id),

  niyyahTextEn: text('niyyah_text_en').notNull(),
  niyyahTextAr: text('niyyah_text_ar').notNull(),
  isEnabled: integer('is_enabled', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const dailyLogs = sqliteTable('daily_logs', {
  id: text('id').primaryKey(),
  activityId: text('activity_id').notNull(),
  date: text('date').notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp' }).notNull(),
});

export const dailyLogNiyyahs = sqliteTable('daily_log_niyyahs', {
  dailyLogId: text('daily_log_id')
    .notNull()
    .references(() => dailyLogs.id, { onDelete: 'cascade' }),
  niyyahId: text('niyyah_id').notNull(),
});

export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey(),
  activityId: text('activity_id').notNull(),
  activityNameEn: text('activity_name_en').notNull(),
  activityNameAr: text('activity_name_ar').notNull(),
  note: text('note').notNull(),
  selectedNiyyahCount: integer('selected_niyyah_count').default(0),
  impactfulNiyyahId: text('impactful_niyyah_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});
