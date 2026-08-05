CREATE TABLE `activities` (
	`id` text PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`category` text NOT NULL,
	`niyyah_text_en` text NOT NULL,
	`niyyah_text_ar` text NOT NULL,
	`hadith_ref_en` text,
	`hadith_ref_ar` text,
	`default_time` text,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` text PRIMARY KEY NOT NULL,
	`label_en` text NOT NULL,
	`label_ar` text NOT NULL,
	`icon` text,
	`is_custom` integer DEFAULT false NOT NULL,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `content_meta` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `custom_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`name_en` text NOT NULL,
	`name_ar` text NOT NULL,
	`category` text DEFAULT 'daily' NOT NULL,
	`niyyah_text_en` text NOT NULL,
	`niyyah_text_ar` text NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`category`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `custom_niyyah_options` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`text_en` text NOT NULL,
	`text_ar` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `daily_log_niyyahs` (
	`daily_log_id` text NOT NULL,
	`niyyah_id` text NOT NULL,
	FOREIGN KEY (`daily_log_id`) REFERENCES `daily_logs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `daily_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`date` text NOT NULL,
	`completed_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`activity_name_en` text NOT NULL,
	`activity_name_ar` text NOT NULL,
	`note` text NOT NULL,
	`selected_niyyah_count` integer DEFAULT 0,
	`impactful_niyyah_id` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `learn_content` (
	`id` text PRIMARY KEY NOT NULL,
	`title_en` text NOT NULL,
	`title_ar` text NOT NULL,
	`category` text NOT NULL,
	`content_en` text NOT NULL,
	`content_ar` text NOT NULL,
	`source_en` text,
	`source_ar` text,
	`keywords` text,
	`sort_order` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `niyyah_options` (
	`id` text PRIMARY KEY NOT NULL,
	`activity_id` text NOT NULL,
	`text_en` text NOT NULL,
	`text_ar` text NOT NULL,
	`source_en` text,
	`source_ar` text,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `niyyah_profile_tags` (
	`niyyah_id` text NOT NULL,
	`tag` text NOT NULL,
	FOREIGN KEY (`niyyah_id`) REFERENCES `niyyah_options`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `niyyah_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`niyyah_id` text NOT NULL,
	`type` text NOT NULL,
	`text_en` text NOT NULL,
	`text_ar` text NOT NULL,
	`reference_en` text NOT NULL,
	`reference_ar` text NOT NULL,
	`sort_order` integer NOT NULL,
	FOREIGN KEY (`niyyah_id`) REFERENCES `niyyah_options`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_activity_prefs` (
	`activity_id` text PRIMARY KEY NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`custom_time` text,
	`custom_niyyah_text` text,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE no action
);
